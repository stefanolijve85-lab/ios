# Roadmap

## MVP (0 → 90 days)

**Goal**: a single tenant can upload an invoice and receive a defensible
Trust Score with reason codes, and an analyst can approve/reject from the
queue.

- [x] Multi-tenant Postgres schema with RLS
- [x] FastAPI scaffold (auth, invoices, suppliers, alerts, scoring,
      webhooks, insights)
- [x] Next.js dashboard (Overview, Invoices, Invoice detail, Suppliers,
      Alerts, Insights, Audit) + landing page
- [x] Risk scoring engine v1 (weighted aggregation + hard penalties)
- [x] Forensics v1 (PDF metadata, /JS detection, font/object inspection)
- [x] Supplier trust v1 (VIES VAT mod-97 check, domain age via WHOIS,
      MX/SPF/DMARC presence)
- [x] IBAN security v1 (mod-97, country risk, supplier-IBAN history,
      change-velocity)
- [x] Email security v1 (header parse, SPF/DKIM/DMARC alignment,
      lookalike-domain detection)
- [x] Anomaly v1 (z-score on amount, frequency, weekday/hour)
- [x] Vision v1 (perceptual hash + structural similarity vs known templates)
- [x] Explainability v1 (top-k contributing signals + recommended action)
- [x] Audit log (append-only, hash-chained)
- [x] Webhook deliveries with HMAC signing + retries
- [ ] OCR provider integration (Azure Document Intelligence)
- [ ] Stripe billing (per-invoice metering)
- [ ] Email-forwarding ingestion (`tenant-{slug}@inbound.trustline.app`)

## v1 (90 → 180 days)

- ERP connectors: Exact, AFAS, Twinfield, QuickBooks, Xero
- SSO (OIDC) with Okta + Entra ID
- Anomaly model v2 (gradient boosted, per-tenant retraining)
- Visual template library + cross-tenant fraud signature sharing (opt-in)
- Reviewer mobile app (existing Expo project) for on-the-go approvals
- White-label mode (tenant-controlled brand)
- API SDKs (Python, TypeScript)

## v2 (180 → 365 days)

- Real-time payment hold integration (banking partners)
- Cross-tenant supplier reputation network (privacy-preserving via
  hashed identifiers)
- Outbound payment monitoring (egress side, not just AP)
- Behavioral biometrics for reviewer accounts
- ISO 27001 certification

## v3 (year 2+)

- Trustline Exchange — opt-in shared fraud signal database
- Embedded mode for ERP vendors (white-label OEM)
- Region expansion: APAC, LATAM, MENA registries
- Voice/phone-call invoice verification flow
