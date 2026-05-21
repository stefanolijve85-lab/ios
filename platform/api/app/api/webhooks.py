from __future__ import annotations

import secrets
from datetime import datetime, timezone

import ulid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import Principal, db_for, require_role
from ..models import WebhookEndpoint
from ..schemas import WebhookEndpointIn, WebhookEndpointOut

router = APIRouter(prefix="/webhooks/endpoints", tags=["webhooks"])


@router.post("", response_model=WebhookEndpointOut)
def create_endpoint(
    body: WebhookEndpointIn,
    p: Principal = Depends(require_role("admin")),
    db: Session = Depends(db_for),
) -> WebhookEndpointOut:
    if not body.url.startswith("https://"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "https_required")
    ep = WebhookEndpoint(
        id=f"whe_{ulid.new().str}",
        tenant_id=p.tenant_id,
        url=body.url,
        secret=secrets.token_urlsafe(32),
        events=body.events,
        is_active=True,
    )
    db.add(ep); db.flush()
    return WebhookEndpointOut(
        id=ep.id, url=ep.url, events=ep.events,
        is_active=ep.is_active, created_at=ep.created_at,
    )


@router.get("", response_model=list[WebhookEndpointOut])
def list_endpoints(
    p: Principal = Depends(require_role("admin")),
    db: Session = Depends(db_for),
) -> list[WebhookEndpointOut]:
    rows = db.execute(
        select(WebhookEndpoint).where(WebhookEndpoint.tenant_id == p.tenant_id)
    ).scalars().all()
    return [WebhookEndpointOut(
        id=e.id, url=e.url, events=e.events,
        is_active=e.is_active, created_at=e.created_at,
    ) for e in rows]


@router.delete("/{endpoint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_endpoint(
    endpoint_id: str,
    p: Principal = Depends(require_role("admin")),
    db: Session = Depends(db_for),
) -> None:
    ep = db.get(WebhookEndpoint, endpoint_id)
    if not ep or ep.tenant_id != p.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    db.delete(ep)
