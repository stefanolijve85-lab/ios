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
cp api/.env.example api/.env       # tweak SECRET_KEY before any real use
docker compose up --build
```

Then in a second terminal:

```bash
# End-to-end smoke test: signup → upload → poll → print Trust Score
python3 scripts/demo.py
# Or with your own PDF:
python3 scripts/demo.py /path/to/invoice.pdf
```

Expected output:

```
→ API base: http://localhost:8000

[1/4] POST /v1/auth/signup  (email=demo-…@trustline.local)
      ↳ got access token (exp 900s)

[2/4] POST /v1/invoices    (file=demo.pdf, 234 bytes)
      ↳ invoice_id=inv_…, status=processing

[3/4] GET  /v1/invoices/inv_…  (polling…)
      ↳ Trust Score: 71 (medium)
        Action: Dual approval recommended
        · supplier   raw= 40  Δ= -7.7  — Could not identify supplier from invoice
        · iban       raw=  0  Δ=-16.5  — No IBAN extracted
        · forensics  raw= 95  Δ= +3.6  — PDF structural integrity
        ...

[4/4] GET  /v1/insights/overview
      ↳ 1 invoices, 0 high-risk, avg trust 71.0
```

URLs:
- API + OpenAPI: http://localhost:8000/docs
- Landing page:  http://localhost:3000
- Dashboard:     http://localhost:3000/overview *(currently rendered with sample data — wiring it to the live API is the next phase)*

### Manual flow (curl)

```bash
# 1. Sign up — creates tenant + admin + returns tokens
TOKEN=$(curl -s -X POST http://localhost:8000/v1/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"verysecret-1234","full_name":"Me","tenant_name":"Demo Co"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

# 2. Upload an invoice
curl -X POST http://localhost:8000/v1/invoices \
  -H "authorization: Bearer $TOKEN" \
  -F "file=@invoice.pdf" -F "source=upload"

# 3. List + inspect
curl -s http://localhost:8000/v1/invoices -H "authorization: Bearer $TOKEN" | jq .
curl -s http://localhost:8000/v1/invoices/inv_… -H "authorization: Bearer $TOKEN" | jq .
```

The `mock` OCR + LLM providers are enabled by default so the pipeline runs
end-to-end without external services. To use real Azure Document
Intelligence, set `OCR_PROVIDER=azure` and the Azure env vars in `api/.env`.

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
