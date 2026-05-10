from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import Principal, current_principal, db_for, require_role
from ..models import Supplier, SupplierIbanHistory
from ..schemas import SupplierBrief
from ..security.audit import append as audit_append

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierBrief])
def list_suppliers(
    limit: int = 100,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> list[SupplierBrief]:
    rows = db.execute(
        select(Supplier).where(Supplier.tenant_id == p.tenant_id)
        .order_by(Supplier.trust_score.asc().nullslast())
        .limit(min(limit, 500))
    ).scalars().all()
    return [SupplierBrief(
        id=s.id, name=s.name, vat=s.vat, primary_domain=s.primary_domain,
        trust_score=s.trust_score, trust_band=s.trust_band, status=s.status,  # type: ignore[arg-type]
    ) for s in rows]


@router.get("/{supplier_id}")
def get_supplier(
    supplier_id: str,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> dict:
    s = db.get(Supplier, supplier_id)
    if not s or s.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    history = db.execute(
        select(SupplierIbanHistory)
        .where(SupplierIbanHistory.supplier_id == s.id)
        .order_by(SupplierIbanHistory.last_seen_at.desc())
    ).scalars().all()
    return {
        "id": s.id, "name": s.name, "vat": s.vat,
        "primary_domain": s.primary_domain,
        "trust_score": s.trust_score, "trust_band": s.trust_band,
        "status": s.status, "notes": s.notes,
        "iban_history": [
            {"iban": h.iban, "country": h.iban_country,
             "first_seen_at": h.first_seen_at, "last_seen_at": h.last_seen_at,
             "use_count": h.use_count, "is_blocked": h.is_blocked}
            for h in history
        ],
    }


@router.post("/{supplier_id}/lock")
def lock_supplier(
    supplier_id: str,
    p: Principal = Depends(require_role("admin", "cfo")),
    db: Session = Depends(db_for),
) -> dict:
    s = db.get(Supplier, supplier_id)
    if not s or s.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    s.status = "locked"
    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="supplier.locked", resource_kind="supplier",
                 resource_id=s.id)
    return {"id": s.id, "status": s.status}


@router.post("/{supplier_id}/unlock")
def unlock_supplier(
    supplier_id: str,
    p: Principal = Depends(require_role("admin", "cfo")),
    db: Session = Depends(db_for),
) -> dict:
    s = db.get(Supplier, supplier_id)
    if not s or s.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    s.status = "active"
    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="supplier.unlocked", resource_kind="supplier",
                 resource_id=s.id)
    return {"id": s.id, "status": s.status}
