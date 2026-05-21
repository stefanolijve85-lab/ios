"""FastAPI dependencies: auth, tenancy, RBAC, db session."""
from __future__ import annotations

from typing import Iterator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import SessionLocal
from .schemas import Role
from .security import tokens


class Principal:
    """Authenticated caller — user or API key."""
    def __init__(self, user_id: str, tenant_id: str, role: Role, kind: str):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.role = role
        self.kind = kind  # 'user' | 'api_key'

    def require(self, *roles: Role) -> None:
        if self.role not in roles and self.role != "admin":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "insufficient_role")


def _bearer(auth: str | None) -> str:
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing_token")
    return auth.split(" ", 1)[1].strip()


def current_principal(
    authorization: str | None = Header(default=None),
) -> Principal:
    token = _bearer(authorization)
    # API keys have a clear prefix and are looked up directly; here we just
    # decode JWTs. (API-key resolution happens in api/auth.py for brevity.)
    try:
        claims = tokens.decode(token)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid_token")
    if claims.get("typ") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "wrong_token_type")
    return Principal(
        user_id=claims["sub"],
        tenant_id=claims["tid"],
        role=claims.get("role", "read_only"),
        kind="user",
    )


def db_for(principal: Principal = Depends(current_principal)) -> Iterator[Session]:
    s = SessionLocal()
    try:
        s.execute(
            text("SELECT set_config('app.current_tenant', :tid, true)"),
            {"tid": principal.tenant_id},
        )
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def require_role(*roles: Role):
    def _dep(p: Principal = Depends(current_principal)) -> Principal:
        p.require(*roles)
        return p
    return _dep
