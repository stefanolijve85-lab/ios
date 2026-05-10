# Architecture — AI Financial Security Layer for Accounts Payable

> Codename: **Trustline**
> Tagline: *The AI trust layer for business payments.*

---

## 1. System overview

Trustline is a multi-tenant SaaS that ingests invoices and the surrounding
communication, runs them through a layered AI + forensics pipeline, and emits a
**Trust Score** (0–100) plus an explainable risk decision.

```
                          ┌──────────────────────────────────────────────┐
                          │                  Tenants                      │
                          │  Finance teams · CFOs · Auditors · Bookkeepers│
                          └────────────────┬─────────────────────────────┘
                                           │
        Web dashboard (Next.js)   ◀────────┼────────▶   Mobile (Expo)
                                           │
                                  ┌────────▼─────────┐
                                  │   API Gateway    │ (Auth, RL, Tenancy)
                                  └────────┬─────────┘
                                           │
   ┌─────────────────────────┬─────────────┼─────────────┬─────────────────────────┐
   ▼                         ▼             ▼             ▼                         ▼
┌────────┐            ┌────────────┐  ┌─────────┐  ┌────────────┐          ┌──────────────┐
│Ingest  │  ─PDF/EML─▶│  Forensics │  │Supplier │  │   Email    │          │Anomaly + ML  │
│OCR/Parse│           │  Engine    │  │  Trust  │  │  Security  │          │  + Vision    │
└────┬───┘            └─────┬──────┘  └────┬────┘  └─────┬──────┘          └──────┬───────┘
     │                       │              │              │                        │
     └────────────────┬──────┴──────────────┴──────────────┴────────────────────────┘
                      ▼
              ┌──────────────────┐
              │ Risk Scoring     │  ──▶ Trust Score · Reason codes · Recommended action
              │ (weighted +ML)   │
              └────────┬─────────┘
                       │
               ┌───────▼────────┐
               │  Workflow /    │  Approval queue · Reviewer · Escalation · Audit
               │  Case engine   │
               └───────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ERP sync       Webhooks        Notifications
 (Exact, AFAS,    (REST/WS)       (Slack/Teams/Email)
  SAP, Xero…)
```

---

## 2. Bounded contexts (DDD)

| Context | Responsibility | Owns |
|---|---|---|
| **Identity** | Tenants, users, RBAC, SSO, MFA | `tenants`, `users`, `memberships`, `api_keys` |
| **Ingestion** | File intake, OCR, parsing, normalization | `documents`, `extractions` |
| **Invoice** | Invoice domain model, lifecycle | `invoices`, `line_items` |
| **Supplier** | Supplier registry + intelligence | `suppliers`, `supplier_signals`, `supplier_iban_history` |
| **Forensics** | PDF/structural integrity | `forensic_reports` |
| **Email security** | Header analysis, domain trust | `email_artifacts`, `email_signals` |
| **Anomaly/ML** | Behavioral models, embeddings | `embeddings`, `anomaly_scores` |
| **Risk** | Aggregation, Trust Score, reason codes | `risk_assessments`, `risk_signals` |
| **Workflow** | Approval/review/escalation | `cases`, `case_events`, `approvals` |
| **Audit** | Immutable trail, evidence | `audit_log` |
| **Integrations** | ERP/email/Slack connectors | `connections`, `webhook_endpoints`, `webhook_deliveries` |
| **Billing** | Plans, usage metering | `subscriptions`, `usage_events` |

Each context exposes a service module behind a stable interface; cross-context
calls go through service functions, never raw model access. This keeps a
future split into microservices cheap.

---

## 3. Request lifecycle (happy path)

1. **Ingest** — PDF arrives via upload / forwarded mailbox / ERP sync.
   The API stores the raw bytes in object storage (S3/Azure Blob), creates a
   `documents` row, enqueues an `ingest.process` Celery task, and returns a
   document id.
2. **Parse** — Worker streams the document to OCR (Azure Document Intelligence
   or Google Document AI), extracts structured fields (`supplier_name`, `iban`,
   `vat`, `total`, `currency`, `due_date`, `line_items[]`) and persists an
   `extractions` row.
3. **Forensics fan-out** — On a successful parse, the worker schedules parallel
   tasks: `forensics.pdf`, `supplier.lookup`, `iban.security`,
   `email.analyze` (if EML), `vision.fingerprint`, `anomaly.score`.
4. **Aggregate** — When all signals report (or a 30s soft-deadline elapses),
   `risk.score` runs, persisting a `risk_assessments` row with the Trust Score,
   reason codes, contributing signals, and a recommended action.
5. **Workflow** — Based on the score and tenant policy, the case engine creates
   a `cases` row routed to the right reviewer queue, fires webhooks, and posts
   to Slack/Teams/email if configured.
6. **Decision** — Reviewer approves / rejects / escalates. Decisions and
   evidence are appended to the immutable `audit_log` and fed back to the
   anomaly model as training signal.

---

## 4. Risk scoring engine

The Trust Score is **not** a black box. It is a weighted aggregation of seven
sub-scores, each in `[0,100]` where higher = more trustworthy. The default
weights are tenant-tunable (subject to admin RBAC):

| Signal | Default weight | Source |
|---|---:|---|
| PDF forensics | 18% | `forensics_report.score` |
| Supplier trust | 22% | `supplier_signals.score` |
| IBAN/payment security | 22% | `iban_signals.score` |
| Email authenticity | 12% | `email_signals.score` |
| Behavioral anomaly | 14% | `anomaly_score.score` |
| Visual template match | 7% | `vision_score.score` |
| Historical relationship | 5% | aggregate of past trusted invoices |

```
trust = Σ(wᵢ · sᵢ) − Σ(hard_penalties)
```

**Hard penalties** (each can deduct up to 40 pts and force a band):

- IBAN country in sanctions list (`OFAC`, `EU`, `UN`)
- Supplier domain age < 30 days **and** new IBAN never seen
- DKIM/SPF both fail **and** display-name spoof detected
- Embedded JavaScript in PDF
- Confirmed-fraud match on supplier or IBAN (tenant-local feedback loop)

**Bands**:

| Band | Range | Default action |
|---|---|---|
| Trusted | 90–100 | Auto-approve (if policy enabled) |
| Low | 75–89 | Single approver |
| Medium | 55–74 | Dual approval |
| Suspicious | 35–54 | Send to fraud queue |
| High | 15–34 | Block payment + notify CFO |
| Critical | 0–14 | Block + lock supplier + alert |

**Explainability** — every assessment stores the top 5 contributing signals
(with their weighted contribution to the final score) so that auditors and
reviewers see *why* a decision was made, never just *what*. Wording is
hedged on purpose: we say *“high-risk indicators detected”*, never
*“this invoice is fraudulent”*.

---

## 5. Multi-tenant isolation

- **Logical isolation** by default: every tenant-owned table carries a
  non-null `tenant_id` column with a `(tenant_id, …)` composite index, and
  Postgres **row-level security** policies enforce the boundary.
  Application code sets `app.current_tenant` at the start of every request
  so RLS policies match.
- **Hard isolation** for enterprise tier: dedicated schema-per-tenant or
  database-per-tenant, selectable via `tenants.isolation_mode`.
- **Object storage** is partitioned with a `tenants/{tenant_id}/...` prefix
  and signed URLs are scoped per-request.
- **Encryption** — per-tenant data keys wrapped by a KMS-managed root key
  (envelope encryption) for invoice files and PII columns.

---

## 6. Data flow & storage

| Layer | Tech | Notes |
|---|---|---|
| Ingress | Cloudflare / ALB | TLS 1.3, WAF, rate limit |
| API | FastAPI on ECS/AKS | Stateless, autoscaling 2..100 |
| Workers | Celery on Redis | Separate fast/slow queues |
| OLTP | PostgreSQL 16 | RLS + pgcrypto |
| Vector | pgvector (default) / Pinecone | invoice + template embeddings |
| Object | S3 (or Azure Blob) | server-side encryption + lifecycle rules |
| Cache | Redis | session + idempotency keys |
| Search | Postgres FTS → OpenSearch (later) | for invoice search |
| Stream | Kafka (Phase 3) | event sourcing for audit + ML training |

---

## 7. AI / ML pipeline

See [`ML.md`](./ML.md) for the full design. Highlights:

- **OCR & layout** — Azure Document Intelligence (default) or Google
  Document AI, abstracted behind an `OCRProvider` interface.
- **Reasoning** — Anthropic Claude (default) for forensic narrative,
  reason-code generation, and analyst Q&A. OpenAI as a swap-in.
- **Embeddings** — `text-embedding-3-large` for invoice text +
  template embeddings via a small in-house CV model (CLIP-style).
- **Anomaly detection** — Isolation Forest baseline on per-tenant
  invoice tables, upgraded to gradient-boosted classifier once a tenant
  has ≥5k labeled invoices.
- **Feedback loop** — every analyst decision (`approved` /
  `rejected_fraud` / `rejected_other`) is written to `feedback_events`
  and used to retrain weekly.

---

## 8. Security architecture

Detailed in [`SECURITY.md`](./SECURITY.md). At a glance:

- SOC2-ready audit log (append-only, hash-chained)
- GDPR data subject endpoints + retention policies
- AES-256-GCM at rest, TLS 1.3 in transit
- Per-tenant envelope encryption for files + PII
- RBAC with the roles `admin`, `cfo`, `finance`, `reviewer`, `auditor`, `read_only`
- SSO via OIDC (Okta, Entra ID, Google), MFA enforced for `admin`/`cfo`
- API keys with prefix + last-4 stored, rotated, scoped per-permission
- Rate limiting (token bucket per `api_key` and per `tenant`)
- Secrets in AWS Secrets Manager / Azure Key Vault, never in env files in prod

---

## 9. Folder structure

```
platform/
├── api/                    FastAPI backend
│   ├── app/
│   │   ├── main.py         app factory
│   │   ├── config.py       pydantic settings
│   │   ├── db.py           SQLAlchemy + RLS session
│   │   ├── deps.py         auth, tenancy, rbac dependencies
│   │   ├── models.py       SQLAlchemy ORM
│   │   ├── schemas.py      pydantic IO models
│   │   ├── api/            HTTP routers (one per resource)
│   │   ├── services/       domain services (forensics, scoring, …)
│   │   ├── security/       auth, signing, encryption helpers
│   │   └── workers.py      celery tasks
│   ├── migrations/         SQL migrations
│   ├── requirements.txt
│   └── Dockerfile
├── web/                    Next.js (App Router) frontend
│   ├── app/
│   │   ├── page.tsx        landing
│   │   ├── (marketing)/    marketing pages
│   │   └── (dashboard)/    authenticated dashboard
│   ├── components/         design system + feature widgets
│   ├── lib/                api client, types, utils
│   └── styles/
├── docs/                   architecture, security, roadmap, ML, API
├── infra/                  docker-compose + init.sql
└── README.md
```

---

## 10. Deployment

- **Dev**: `docker compose up` boots Postgres, Redis, API, worker, and web.
- **Staging/Prod**: API + worker as separate ECS services (or AKS
  deployments). Aurora Postgres or Azure Database for PostgreSQL Flexible
  Server. ElastiCache/Redis. CloudFront/Front Door in front of the web app.
- **CI/CD**: GitHub Actions → build & push images → ArgoCD/CodeDeploy.
  Migrations gated behind a manual approval. Feature flags via
  ConfigCat/LaunchDarkly.

---

## 11. Why this shape

- **Boring, proven storage** (Postgres) for OLTP; pgvector keeps the AI
  side single-database for as long as possible — *do not split until you
  must*.
- **Separation of services from API routes** — every endpoint is a thin
  shell over a domain service so the same logic is reachable from
  Celery tasks, internal scripts, and tests.
- **Explainable by construction** — Trust Score is a transparent weighted
  sum, not a single end-to-end model. ML augments scoring, never
  replaces it. Auditors can trace every point of every score.
- **Hedged language by policy** — the platform refuses to assert fraud;
  it surfaces *indicators* and *recommendations*. This is encoded in the
  prompt templates and the UI copy library.
