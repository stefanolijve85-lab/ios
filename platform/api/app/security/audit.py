"""Append-only, hash-chained audit log writer."""
from __future__ import annotations

import hashlib
import json
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ..models import AuditLog


def _canonical(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def append(
    session: Session,
    *,
    tenant_id: str | None,
    actor_id: str | None,
    actor_kind: str,
    action: str,
    resource_kind: str | None = None,
    resource_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    payload = payload or {}
    prev = session.execute(
        select(AuditLog.hash)
        .where(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.id.desc())
        .limit(1)
    ).scalar_one_or_none()

    canonical = _canonical(
        {
            "tenant_id": tenant_id,
            "actor_id": actor_id,
            "actor_kind": actor_kind,
            "action": action,
            "resource_kind": resource_kind,
            "resource_id": resource_id,
            "payload": payload,
        }
    )
    h = hashlib.sha256(((prev or "") + canonical).encode()).hexdigest()

    row = AuditLog(
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_kind=actor_kind,
        action=action,
        resource_kind=resource_kind,
        resource_id=resource_id,
        payload=payload,
        prev_hash=prev,
        hash=h,
    )
    session.add(row)
    session.flush()
    return row
