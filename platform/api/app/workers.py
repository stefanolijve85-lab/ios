"""Celery worker — orchestrates the full scoring pipeline."""
from __future__ import annotations

from datetime import datetime, timezone

import ulid
from celery import Celery
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import tenant_session
from .models import (
    Alert, Document, ForensicReport, Invoice, RiskAssessment,
    Supplier, SupplierIbanHistory,
)
from .services import (
    anomaly, email_security, forensics, ingestion, iban_security,
    risk_scoring, supplier_trust, vision,
)

celery_app = Celery("trustline", broker=settings.redis_url, backend=settings.redis_url)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{ulid.new().str}"


def _ensure_supplier(
    session: Session, *, tenant_id: str, name: str | None, vat: str | None,
    domain: str | None,
) -> Supplier | None:
    if not (name or vat):
        return None
    q = select(Supplier).where(Supplier.tenant_id == tenant_id)
    if vat:
        sup = session.execute(q.where(Supplier.vat == vat)).scalar_one_or_none()
        if sup:
            return sup
    if name:
        sup = session.execute(q.where(Supplier.name == name)).scalar_one_or_none()
        if sup:
            return sup
    sup = Supplier(
        id=_new_id("sup"), tenant_id=tenant_id,
        name=name or vat or "(unknown)",
        vat=vat, primary_domain=domain,
    )
    session.add(sup)
    session.flush()
    return sup


def _record_iban(session: Session, *, tenant_id: str, supplier_id: str, iban: str):
    existing = session.execute(
        select(SupplierIbanHistory)
        .where(SupplierIbanHistory.supplier_id == supplier_id)
        .where(SupplierIbanHistory.iban == iban)
    ).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if existing:
        existing.last_seen_at = now
        existing.use_count += 1
    else:
        session.add(SupplierIbanHistory(
            id=_new_id("siban"), tenant_id=tenant_id,
            supplier_id=supplier_id, iban=iban,
            iban_country=iban[:2] if len(iban) >= 2 else None,
            first_seen_at=now, last_seen_at=now, use_count=1,
        ))


@celery_app.task(name="ingest.process")
def process_document(tenant_id: str, document_id: str, file_hex: str) -> str:
    """Run the full pipeline: parse → forensics → supplier/iban/email/anomaly → score."""
    file_bytes = bytes.fromhex(file_hex)

    with tenant_session(tenant_id) as s:
        doc = s.get(Document, document_id)
        if not doc:
            return "missing_document"

        # 1. OCR / parsing
        doc.status = "parsing"
        provider = ingestion.get_ocr_provider()
        parsed = provider.parse(file_bytes, mime_type=doc.mime_type)
        doc.status = "parsed"
        doc.parsed_at = datetime.now(timezone.utc)

        # 2. Find/create supplier and update IBAN history
        sup = _ensure_supplier(
            s, tenant_id=tenant_id,
            name=parsed.supplier_name, vat=parsed.vat,
            domain=parsed.supplier_domain,
        )
        if sup and parsed.iban:
            _record_iban(s, tenant_id=tenant_id, supplier_id=sup.id, iban=parsed.iban)

        # 3. Sub-services
        forensic = forensics.analyze(file_bytes)
        iban_res = iban_security.assess(
            s, tenant_id=tenant_id,
            supplier_id=sup.id if sup else None,
            iban_raw=parsed.iban,
        )
        supplier_res = (
            supplier_trust.assess(
                s, supplier=sup, extracted_vat=parsed.vat,
                extracted_domain=parsed.supplier_domain,
            ) if sup else
            supplier_trust.SupplierTrustResult(
                score=40, vat_valid=None, domain_age_days=None,
                has_mx=None, has_spf=None, has_dmarc=None,
                sanctions_match=False,
                signals=[{"code": "supplier_unknown", "severity": "medium",
                          "detail": "Could not identify supplier from invoice"}],
            )
        )
        email_res = email_security.EmailResult(
            score=80, spf_pass=None, dkim_pass=None, dmarc_pass=None,
            from_addr=None, reply_to_addr=None, display_name=None,
            lookalike_score=0, signals=[],
        )  # populated when ingest source is email/EML

        anomaly_res = anomaly.assess(
            s, tenant_id=tenant_id,
            supplier_id=sup.id if sup else None,
            total_cents=parsed.total_cents,
            issue_dt=datetime.now(timezone.utc),
        )
        vision_res = vision.assess(file_bytes)

        # 4. Aggregate
        sub_scores = [
            risk_scoring.SubScore("forensics", forensic.score, "PDF structural integrity"),
            risk_scoring.SubScore("supplier", supplier_res.score, "Supplier trust signals"),
            risk_scoring.SubScore("iban", iban_res.score, "Payment / IBAN risk"),
            risk_scoring.SubScore("email", email_res.score, "Email authenticity"),
            risk_scoring.SubScore("anomaly", anomaly_res.score, "Behavioral anomaly"),
            risk_scoring.SubScore("vision", vision_res.score, "Visual template match"),
            risk_scoring.SubScore("history", 80 if (sup and sup.trust_score and sup.trust_score >= 75) else 60,
                                  "Historical relationship"),
        ]
        hard = risk_scoring.hard_penalties_from_signals(
            forensics_signals=forensic.signals,
            supplier_signals=supplier_res.signals,
            iban_signals=iban_res.signals,
            email_signals=email_res.signals,
        )
        decision = risk_scoring.score(sub_scores=sub_scores, hard_penalties=hard)

        # 5. Persist invoice + reports
        inv = s.execute(
            select(Invoice).where(Invoice.document_id == document_id)
        ).scalar_one()
        inv.supplier_id = sup.id if sup else None
        inv.invoice_number = parsed.invoice_number
        inv.issue_date = parsed.issue_date
        inv.due_date = parsed.due_date
        inv.currency = parsed.currency
        inv.subtotal_cents = parsed.subtotal_cents
        inv.tax_cents = parsed.tax_cents
        inv.total_cents = parsed.total_cents
        inv.iban = parsed.iban
        inv.iban_country = (parsed.iban or "")[:2] if parsed.iban else None
        inv.language = parsed.language
        inv.raw_text_excerpt = parsed.raw_text_excerpt
        inv.trust_score = decision.trust_score
        inv.risk_band = decision.risk_band
        inv.scored_at = datetime.now(timezone.utc)
        inv.status = "scored"

        s.add(ForensicReport(
            invoice_id=inv.id, tenant_id=tenant_id,
            score=forensic.score, has_javascript=forensic.has_javascript,
            metadata_score=forensic.metadata_score,
            font_score=forensic.font_score,
            rendering_score=forensic.rendering_score,
            signals=forensic.signals,
        ))

        s.add(RiskAssessment(
            id=_new_id("risk"), tenant_id=tenant_id, invoice_id=inv.id,
            trust_score=decision.trust_score,
            risk_band=decision.risk_band,
            hard_penalty=decision.hard_penalty,
            recommended_action=decision.recommended_action,
            contributors=[c.model_dump() for c in decision.contributors],
            weights_version=decision.weights_version,
            model_version=decision.model_version,
        ))

        # 6. Alerts for high-impact bands
        if decision.risk_band in {"high", "critical"}:
            s.add(Alert(
                id=_new_id("alr"), tenant_id=tenant_id,
                invoice_id=inv.id,
                supplier_id=sup.id if sup else None,
                kind="high_risk_invoice",
                severity="high" if decision.risk_band == "high" else "critical",
                title=f"High-risk invoice: {decision.risk_band}",
                detail=decision.recommended_action,
                payload={
                    "trust_score": decision.trust_score,
                    "top_signals": [c.model_dump() for c in decision.contributors[:3]],
                },
            ))

        # 7. Update supplier rolling trust score (simple EMA)
        if sup:
            old = sup.trust_score or supplier_res.score
            new = int(0.7 * old + 0.3 * supplier_res.score)
            sup.trust_score = new
            sup.trust_band = (
                "trusted" if new >= 90 else "low" if new >= 75 else
                "medium" if new >= 55 else "suspicious" if new >= 35 else
                "high" if new >= 15 else "critical"
            )

    return "ok"
