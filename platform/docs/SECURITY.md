# Security Architecture

This document describes Trustline's security posture. It is the source of
truth for SOC2 evidence collection, GDPR data-subject responses, and threat
modeling.

---

## 1. Threat model

| Actor | Capability | Mitigations |
|---|---|---|
| External attacker (internet) | Network ingress, brute force | WAF, TLS 1.3, rate limit, MFA, account lockout, secret scanning |
| Compromised customer mailbox | Sends spoofed invoices | Email auth checks (SPF/DKIM/DMARC), domain age, IBAN-change detection, `email_signals.score` |
| Malicious supplier | Sends fraudulent invoices | Forensics, anomaly model, supplier history, Trust Score |
| Insider (tenant user) | Approves their own fraud | Dual approval, segregation of duties, immutable audit log |
| Insider (Trustline employee) | Backend access | Least privilege IAM, just-in-time access, query audit, customer-managed keys (CMK) for enterprise |
| Lost device | Stolen session | Short-lived JWTs (15m) + rotating refresh, MFA, device binding, remote sign-out |
| Supply-chain | Compromised dep | Pinned `requirements.txt`, `pip-audit`, Dependabot, SBOM on every release |

---

## 2. Identity & access

### Users
- OIDC SSO (Okta, Microsoft Entra ID, Google Workspace) — enterprise default.
- Email + password fallback with Argon2id hashing, 12-char minimum,
  haveibeenpwned check at signup, MFA via TOTP or WebAuthn.
- MFA **required** for roles `admin` and `cfo`.

### API
- API keys prefixed `tlk_live_` / `tlk_test_`. Stored as SHA-256, only
  prefix + last-4 are recoverable. Per-key scopes (`invoices:read`,
  `invoices:write`, `webhooks:manage`, ...). Rotation enforced every 365 days.
- Per-key + per-tenant rate limits (token bucket in Redis).

### RBAC
| Role | Read invoices | Approve | Manage suppliers | Manage users | Manage policy | Audit |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `admin` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `cfo` | ✓ | ✓ (high-value) | ✓ | – | ✓ | ✓ |
| `finance` | ✓ | ✓ (within limit) | – | – | – | – |
| `reviewer` | ✓ | – (review only) | – | – | – | – |
| `auditor` | ✓ | – | – | – | – | ✓ |
| `read_only` | ✓ | – | – | – | – | – |

---

## 3. Data protection

- **In transit**: TLS 1.3, HSTS, strict CSP, internal mTLS between API and
  workers.
- **At rest**:
  - Database: AES-256 (cloud-provider managed) plus column-level
    encryption (`pgcrypto`) for `iban`, `vat`, `email`, `phone`,
    `bank_account_holder` columns.
  - Object storage: SSE-KMS with a per-tenant KMS data key
    (envelope encryption). Files referenced via short-lived signed URLs.
  - Backups encrypted, retention 30 days for daily snapshots, 7 years for
    audit-log archives.
- **Key management**: AWS KMS / Azure Key Vault. Customer-managed keys
  available on Enterprise tier (BYOK).

---

## 4. Tenant isolation

1. **Default tier — logical isolation**
   Every row is stamped with `tenant_id`. Postgres RLS policies match
   `current_setting('app.current_tenant')::uuid`. Application sets the GUC
   at the start of every request (see `api/app/db.py`).

2. **Enterprise tier — physical isolation**
   `tenants.isolation_mode = 'dedicated_schema'` provisions a separate
   schema and search_path. `'dedicated_db'` provisions a separate database
   instance, addressed via tenant→DSN routing.

3. **Object storage**
   Prefix `tenants/{tenant_id}/...` with bucket policy denying cross-tenant
   prefix access. Signed URL TTL = 5 minutes by default.

---

## 5. Audit log

- Append-only `audit_log` table.
- Every row is hash-chained: `hash = sha256(prev_hash || canonical_json(row))`,
  stored alongside the row. Periodic notarization to an external write-once
  store (e.g. S3 Object Lock / Azure Immutable Blob) prevents silent
  tampering.
- Captured events: auth, RBAC changes, policy changes, invoice state
  changes, score overrides, payment exports, API key operations, data
  exports, deletes.
- Auditor role can read but never delete.

---

## 6. Secure development

- Branch protection on `main`. Two-person review for security-sensitive
  paths (`/security/`, `/migrations/`).
- Secrets never in repo. Pre-commit `gitleaks` hook. CI runs:
  `bandit`, `pip-audit`, `npm audit`, `semgrep`, container `trivy` scan.
- Dependencies pinned. Renovate weekly PRs.
- SBOM (CycloneDX) generated on every release.

---

## 7. Logging, monitoring, IR

- Structured JSON logs to centralized SIEM (Datadog / Sumo / Splunk).
- Sensitive fields redacted at the logger boundary (allowlist of safe
  fields per logger).
- Alerts: failed-login spike, RBAC change burst, mass-export, anomaly in
  audit hash chain, unsigned policy edits.
- Incident response runbook in `docs/RUNBOOK.md` (TBD). On-call rotation
  via PagerDuty. RTO 1h, RPO 15m.

---

## 8. Compliance posture

| Control | Status | Evidence |
|---|---|---|
| SOC2 Type II | Gap-assess in MVP, audit in Year 1 | audit_log, change mgmt, IAM |
| GDPR | Built-in: DSR endpoints, processor agreement, EU regions | `/v1/privacy/export`, `/v1/privacy/delete` |
| ISO 27001 | Year 2 | |
| PCI DSS | Out of scope (no card data) | — |
| Sanctions screening | OFAC/EU/UN lists, refreshed daily | `supplier_signals.sanctions_match` |

---

## 9. AI safety guardrails

- **No fraud assertions**. Prompts and UI strings forbid "this invoice is
  fraudulent". Validated by a unit test that scans output for the banned
  phrase set.
- **PII redaction** before sending to third-party LLMs unless the tenant
  has opted in to a Zero-Retention DPA. We strip `iban`, `email`, `phone`,
  `vat` and substitute placeholders.
- **Prompt injection defense** — extracted invoice text is treated as
  *data*, never as system prompt; we sandwich extracted content between
  `<DOCUMENT>` and `</DOCUMENT>` markers and add a final reaffirmation
  of the system instructions.
- **Model output validation** — JSON-mode where supported, strict pydantic
  parsing, schema retry once on failure, fallback to deterministic rule.
