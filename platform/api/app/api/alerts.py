from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import Principal, current_principal, db_for
from ..models import Alert
from ..schemas import AlertOut
from ..security.audit import append as audit_append

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(
    state: str = "open",
    severity: str | None = None,
    limit: int = 100,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> list[AlertOut]:
    q = select(Alert).where(Alert.tenant_id == p.tenant_id)
    if state:
        q = q.where(Alert.state == state)
    if severity:
        q = q.where(Alert.severity == severity)
    q = q.order_by(Alert.created_at.desc()).limit(min(limit, 500))
    rows = db.execute(q).scalars().all()
    return [AlertOut(
        id=a.id, kind=a.kind, severity=a.severity,  # type: ignore[arg-type]
        state=a.state,  # type: ignore[arg-type]
        title=a.title, detail=a.detail,
        invoice_id=a.invoice_id, supplier_id=a.supplier_id,
        created_at=a.created_at,
    ) for a in rows]


@router.post("/{alert_id}/acknowledge")
def acknowledge(
    alert_id: str,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> dict:
    a = db.get(Alert, alert_id)
    if not a or a.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    a.state = "acknowledged"
    a.resolved_at = datetime.now(timezone.utc)
    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="alert.acknowledged", resource_kind="alert",
                 resource_id=a.id)
    return {"id": a.id, "state": a.state}


@router.post("/{alert_id}/dismiss")
def dismiss(
    alert_id: str,
    reason: str | None = None,
    p: Principal = Depends(current_principal),
    db: Session = Depends(db_for),
) -> dict:
    a = db.get(Alert, alert_id)
    if not a or a.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    a.state = "dismissed"
    a.resolved_at = datetime.now(timezone.utc)
    audit_append(db, tenant_id=p.tenant_id, actor_id=p.user_id, actor_kind="user",
                 action="alert.dismissed", resource_kind="alert",
                 resource_id=a.id, payload={"reason": reason})
    return {"id": a.id, "state": a.state}
