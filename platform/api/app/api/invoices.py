"""Invoice endpoints."""
from __future__ import annotations

from datetime import datetime, timezone

import ulid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import Principal, current_principal, db_for, require_role
from ..models import (
    Document, ForensicReport, Invoice, RiskAssessment, Supplier,
)
from ..schemas import (
    InvoiceBrief, InvoiceDetail, InvoiceUploadOut, RiskAssessmentOut,
    SupplierBrief, ForensicReportOut,
)
from ..security.audit import append as audit_append
from ..services import ingestion

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _new_id(prefix: str) -> str:
    return f"{prefix}_{ulid.new().str}"


def _supplier_brief(s: Supplier | None) -> SupplierBrief | None:
    if not s:
        return None
    return SupplierBrief(
        id=s.id, name=s.name, vat=s.vat, primary_domain=s.primary_domain,
        trust_score=s.trust_score, trust_band=s.trust_band, status=s.status,  # type: ignore[arg-type]
    )


def _invoice_brief(inv: Invoice, sup: Supplier | None) -> InvoiceBrief:
    return InvoiceBrief(
        id=inv.id,
        invoice_number=inv.invoice_number,
        supplier=_supplier_brief(sup),
        total_cents=inv.total_cents,
        currency=inv.currency,
        status=inv.status,
        trust_score=inv.trust_score,
        risk_band=inv.risk_band,  # type: ignore[arg-type]
        created_at=inv.created_at,
    )


@router.post("", response_model=InvoiceUploadOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_invoice(
    file: UploadFile = File(...),
    source: str = Form("upload"),
    reference: str | None = Form(None),
    p: Principal = Depends(require_role("admin", "finance", "cfo")),
    db: Session = Depends(db_for),
) -> InvoiceUploadOut:
    contents = await file.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "empty_file")
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "file_too_large")

    doc_id = _new_id("doc")
    storage_key = f"tenants/{p.tenant_id}/{doc_id}/{file.filename}"
    sha = ingestion.sha256_of(contents)

    document = Document(
        id=doc_id,
        tenant_id=p.tenant_id,
        source=source,
        filename=file.filename or "invoice.pdf",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
        storage_key=storage_key,
        sha256=sha,
        uploaded_by=p.user_id,
        status="received",
    )
    db.add(document)

    invoice = Invoice(
        id=_new_id("inv"),
        tenant_id=p.tenant_id,
        document_id=doc_id,
        external_ref=reference,
        status="processing",
    )
    db.add(invoice)
    db.flush()

    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="invoice.uploaded", resource_kind="invoice",
                 resource_id=invoice.id, payload={"source": source, "sha256": sha})

    # In production we'd push the file to S3 here and enqueue a Celery task.
    # The dev stack has the worker pick this up via DB poll (see workers.py).
    from ..workers import process_document
    process_document.delay(p.tenant_id, doc_id, contents.hex())  # type: ignore[attr-defined]

    return InvoiceUploadOut(id=invoice.id, status="processing")


@router.get("", response_model=list[InvoiceBrief])
def list_invoices(
    status_filter: str | None = None,
    risk_band: str | None = None,
    supplier_id: str | None = None,
    limit: int = 50,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> list[InvoiceBrief]:
    q = select(Invoice).where(Invoice.tenant_id == p.tenant_id)
    if status_filter:
        q = q.where(Invoice.status == status_filter)
    if risk_band:
        q = q.where(Invoice.risk_band == risk_band)
    if supplier_id:
        q = q.where(Invoice.supplier_id == supplier_id)
    q = q.order_by(Invoice.created_at.desc()).limit(min(limit, 200))

    rows = db.execute(q).scalars().all()
    out: list[InvoiceBrief] = []
    for inv in rows:
        sup = db.get(Supplier, inv.supplier_id) if inv.supplier_id else None
        out.append(_invoice_brief(inv, sup))
    return out


@router.get("/{invoice_id}", response_model=InvoiceDetail)
def get_invoice(
    invoice_id: str,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> InvoiceDetail:
    inv = db.get(Invoice, invoice_id)
    if not inv or inv.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    sup = db.get(Supplier, inv.supplier_id) if inv.supplier_id else None
    forensic = db.get(ForensicReport, inv.id)
    risk = db.execute(
        select(RiskAssessment)
        .where(RiskAssessment.invoice_id == inv.id)
        .order_by(RiskAssessment.created_at.desc()).limit(1)
    ).scalar_one_or_none()

    return InvoiceDetail(
        **_invoice_brief(inv, sup).model_dump(),
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        iban=inv.iban,
        iban_country=inv.iban_country,
        bank_account_holder=inv.bank_account_holder,
        forensic=ForensicReportOut(
            score=forensic.score, has_javascript=forensic.has_javascript,
            metadata_score=forensic.metadata_score, font_score=forensic.font_score,
            rendering_score=forensic.rendering_score, signals=forensic.signals,  # type: ignore[arg-type]
        ) if forensic else None,
        risk=RiskAssessmentOut(
            trust_score=risk.trust_score, risk_band=risk.risk_band,  # type: ignore[arg-type]
            hard_penalty=risk.hard_penalty,
            recommended_action=risk.recommended_action,
            contributors=risk.contributors,  # type: ignore[arg-type]
            weights_version=risk.weights_version,
            model_version=risk.model_version,
            created_at=risk.created_at,
        ) if risk else None,
    )


@router.post("/{invoice_id}/approve")
def approve(
    invoice_id: str,
    p: Principal = Depends(require_role("admin", "cfo", "finance")),
    db: Session = Depends(db_for),
) -> dict:
    inv = db.get(Invoice, invoice_id)
    if not inv or inv.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    if inv.risk_band in {"high", "critical"} and p.role != "cfo":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "cfo_required_for_high_risk")
    inv.status = "approved"
    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="invoice.approved", resource_kind="invoice",
                 resource_id=inv.id)
    return {"id": inv.id, "status": inv.status}


@router.post("/{invoice_id}/reject")
def reject(
    invoice_id: str,
    reason_code: str | None = None,
    p: Principal = Depends(require_role("admin", "cfo", "finance", "reviewer")),
    db: Session = Depends(db_for),
) -> dict:
    inv = db.get(Invoice, invoice_id)
    if not inv or inv.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    inv.status = "rejected"
    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="invoice.rejected", resource_kind="invoice",
                 resource_id=inv.id, payload={"reason_code": reason_code})
    return {"id": inv.id, "status": inv.status}
