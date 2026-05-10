"""Aggregations for dashboard charts and AI insights."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..deps import Principal, current_principal, db_for
from ..models import Alert, Invoice, Supplier, SupplierIbanHistory
from ..schemas import InsightsOverview, SupplierBrief

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/overview", response_model=InsightsOverview)
def overview(
    days: int = 30,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> InsightsOverview:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    total = db.execute(
        select(func.count()).select_from(Invoice)
        .where(Invoice.tenant_id == p.tenant_id)
        .where(Invoice.created_at >= since)
    ).scalar_one()

    high_risk = db.execute(
        select(func.count()).select_from(Invoice)
        .where(Invoice.tenant_id == p.tenant_id)
        .where(Invoice.created_at >= since)
        .where(Invoice.risk_band.in_(["high", "critical", "suspicious"]))
    ).scalar_one()

    avg = db.execute(
        select(func.avg(Invoice.trust_score))
        .where(Invoice.tenant_id == p.tenant_id)
        .where(Invoice.created_at >= since)
    ).scalar_one() or 0

    band_rows = db.execute(
        select(Invoice.risk_band, func.count())
        .where(Invoice.tenant_id == p.tenant_id)
        .where(Invoice.created_at >= since)
        .group_by(Invoice.risk_band)
    ).all()
    risk_mix = {b or "unscored": int(c) for b, c in band_rows}

    trend_rows = db.execute(
        select(
            func.date_trunc("day", Invoice.created_at).label("d"),
            func.avg(Invoice.trust_score).label("s"),
        )
        .where(Invoice.tenant_id == p.tenant_id)
        .where(Invoice.created_at >= since)
        .group_by("d").order_by("d")
    ).all()
    trend = [{"date": d.date().isoformat(), "score": float(s or 0)} for d, s in trend_rows]

    suppliers = db.execute(
        select(Supplier).where(Supplier.tenant_id == p.tenant_id)
        .order_by(Supplier.trust_score.asc().nullslast()).limit(5)
    ).scalars().all()

    iban_changes = db.execute(
        select(func.count()).select_from(SupplierIbanHistory)
        .where(SupplierIbanHistory.tenant_id == p.tenant_id)
        .where(SupplierIbanHistory.first_seen_at >= since)
    ).scalar_one()

    return InsightsOverview(
        period_days=days,
        invoices_total=int(total),
        invoices_high_risk=int(high_risk),
        avg_trust_score=float(avg or 0),
        risk_mix=risk_mix,
        trust_trend=trend,
        top_suppliers=[
            SupplierBrief(
                id=s.id, name=s.name, vat=s.vat, primary_domain=s.primary_domain,
                trust_score=s.trust_score, trust_band=s.trust_band, status=s.status,  # type: ignore[arg-type]
            ) for s in suppliers
        ],
        iban_changes_count=int(iban_changes),
    )
