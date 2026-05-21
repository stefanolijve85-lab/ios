from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import alerts, auth, insights, invoices, suppliers, webhooks
from .config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Trustline API",
        version="0.1.0",
        description="AI Financial Security Layer for Accounts Payable",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict:
        return {"ok": True, "version": "0.1.0", "env": settings.env}

    api_prefix = "/v1"
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(invoices.router, prefix=api_prefix)
    app.include_router(suppliers.router, prefix=api_prefix)
    app.include_router(alerts.router, prefix=api_prefix)
    app.include_router(insights.router, prefix=api_prefix)
    app.include_router(webhooks.router, prefix=api_prefix)

    return app


app = create_app()
