# Trustline · platform

> The AI trust layer for business payments.
> A production-grade SaaS that scores invoices for fraud risk before payment.

This directory contains the full Trustline stack:

```
platform/
├── api/        FastAPI backend + Celery worker
├── web/        Next.js dashboard + landing page
├── docs/       Architecture, security, roadmap, ML, API
├── infra/      Local seed data
└── docker-compose.yml
```

The pre-existing Expo project at the repository root (`/app`, `/components`,
etc.) is preserved as the future **mobile companion** — reviewers approving
invoices on the go.

## Quick start (local)

```bash
cd platform
cp api/.env.example api/.env       # tweak SECRET_KEY etc.
docker compose up --build
```

Then:
- API: http://localhost:8000  (`/health`, `/docs` for OpenAPI)
- Web: http://localhost:3000  (landing) and http://localhost:3000/overview (dashboard)

The `mock` OCR + LLM providers are enabled by default so you can run the
pipeline end-to-end without external services.

## What's implemented (MVP)

| Module | Status | File |
|---|---|---|
| Multi-tenant Postgres + RLS | ✅ | `api/migrations/001_init.sql` |
| Auth (email + JWT) | ✅ | `api/app/api/auth.py` |
| Invoice upload + queue | ✅ | `api/app/api/invoices.py` |
| Worker pipeline | ✅ | `api/app/workers.py` |
| PDF forensics | ✅ | `api/app/services/forensics.py` |
| Supplier trust | ✅ | `api/app/services/supplier_trust.py` |
| IBAN security | ✅ | `api/app/services/iban_security.py` |
| Email security | ✅ | `api/app/services/email_security.py` |
| Behavioral anomaly | ✅ | `api/app/services/anomaly.py` |
| Vision template | ✅ (scaffold) | `api/app/services/vision.py` |
| Risk scoring engine | ✅ | `api/app/services/risk_scoring.py` |
| Explainability | ✅ | `api/app/services/explainability.py` |
| Audit log (hash-chained) | ✅ | `api/app/security/audit.py` |
| Webhooks | ✅ | `api/app/api/webhooks.py` |
| Insights | ✅ | `api/app/api/insights.py` |
| Landing page | ✅ | `web/app/page.tsx` |
| Dashboard (Overview, Invoices, Detail, Suppliers, Alerts, Insights, Audit, Settings) | ✅ | `web/app/(dashboard)/...` |

## What's intentionally a scaffold

- **OCR provider integrations** — Azure Document Intelligence and Google
  Document AI clients are stubbed. The interface (`OCRProvider`) is the only
  contract; the worker pipeline runs end-to-end with a mock.
- **LLM provider integrations** — explainability narrative is deterministic
  by default. Hook up Anthropic/OpenAI at `services/explainability.py`.
- **ERP connectors** — Exact, AFAS, Twinfield, SAP, QuickBooks, Xero are
  on the v1 roadmap. The webhook + REST API surface is already in place.
- **SSO / OIDC** — password auth is implemented; OIDC enrolment is on the
  v1 roadmap.

## Read these next

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — the system end-to-end
- [`docs/SECURITY.md`](./docs/SECURITY.md) — threat model + compliance posture
- [`docs/API.md`](./docs/API.md) — REST API reference
- [`docs/ML.md`](./docs/ML.md) — AI/ML pipeline design
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — MVP → enterprise

## License

Proprietary. All rights reserved.
