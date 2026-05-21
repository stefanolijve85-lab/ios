from __future__ import annotations

import time
from typing import Any

from jose import JWTError, jwt

from ..config import settings


def _encode(payload: dict[str, Any], ttl: int) -> str:
    now = int(time.time())
    return jwt.encode(
        {**payload, "iat": now, "exp": now + ttl},
        settings.secret_key,
        algorithm=settings.jwt_alg,
    )


def access_token(user_id: str, tenant_id: str, role: str) -> str:
    return _encode(
        {"sub": user_id, "tid": tenant_id, "role": role, "typ": "access"},
        settings.jwt_access_ttl_sec,
    )


def refresh_token(user_id: str, tenant_id: str) -> str:
    return _encode(
        {"sub": user_id, "tid": tenant_id, "typ": "refresh"},
        settings.jwt_refresh_ttl_sec,
    )


def decode(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_alg])
    except JWTError as e:
        raise ValueError("invalid_token") from e
