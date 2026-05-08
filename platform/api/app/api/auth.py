"""Authentication endpoints. Email/password + JWT refresh."""
from __future__ import annotations

import ulid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal
from ..deps import current_principal, Principal
from ..models import Membership, Tenant, User
from ..schemas import LoginIn, TokenOut, UserOut
from ..security import passwords, tokens
from ..security.audit import append as audit_append

router = APIRouter(prefix="/auth", tags=["auth"])


def _open_session() -> Session:
    return SessionLocal()


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn) -> TokenOut:
    s = _open_session()
    try:
        user = s.execute(
            select(User).where(User.email == body.email.lower())
        ).scalar_one_or_none()
        if not user or not user.password_hash \
                or not passwords.verify_password(body.password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid_credentials")

        membership = s.execute(
            select(Membership).where(Membership.user_id == user.id).limit(1)
        ).scalar_one_or_none()
        if not membership:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "no_tenant")

        audit_append(s, tenant_id=membership.tenant_id, actor_id=user.id,
                     actor_kind="user", action="auth.login")

        return TokenOut(
            access_token=tokens.access_token(user.id, membership.tenant_id, membership.role),
            refresh_token=tokens.refresh_token(user.id, membership.tenant_id),
            expires_in=settings.jwt_access_ttl_sec,
        )
    finally:
        s.commit(); s.close()


@router.get("/me", response_model=UserOut)
def me(p: Principal = Depends(current_principal)) -> UserOut:
    s = _open_session()
    try:
        user = s.get(User, p.user_id)
        tenant = s.get(Tenant, p.tenant_id)
        if not user or not tenant:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
        return UserOut(
            id=user.id, email=user.email, full_name=user.full_name,
            role=p.role,  # type: ignore[arg-type]
            tenant={
                "id": tenant.id, "slug": tenant.slug,
                "name": tenant.name, "plan": tenant.plan,
            },  # type: ignore[arg-type]
        )
    finally:
        s.close()
