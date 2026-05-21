"""SQLAlchemy session + RLS-aware request scope."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@contextmanager
def tenant_session(tenant_id: str | None) -> Iterator[Session]:
    """Open a session with `app.current_tenant` set so RLS policies match."""
    session = SessionLocal()
    try:
        if tenant_id:
            session.execute(
                text("SELECT set_config('app.current_tenant', :tid, true)"),
                {"tid": tenant_id},
            )
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
