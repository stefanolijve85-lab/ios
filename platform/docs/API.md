# API reference

> Base URL: `https://api.trustline.app/v1`
> All requests require either a session JWT (`Authorization: Bearer ...`) or
> an API key (`Authorization: Bearer tlk_live_...`).

## Conventions

- All timestamps are RFC3339 UTC.
- All money fields are minor units (`amount_cents`) plus an ISO-4217
  `currency` field.
- Errors follow RFC 7807 Problem Details:
  ```json
  { "type": "about:blank", "title": "Bad Request",
    "status": 400, "detail": "iban is invalid", "code": "iban_invalid" }
  ```
- Idempotent POSTs accept `Idempotency-Key` and replay the original
  response for 24h.
- Pagination is cursor-based: `?cursor=…&limit=50`.

## Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create tenant + first admin |
| POST | `/auth/login` | Email/password → access + refresh tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke refresh token |
| GET  | `/auth/me` | Current user + tenant + role |
| POST | `/api-keys` | Create API key (returns secret once) |
| GET  | `/api-keys` | List keys (prefix + last-4 only) |
| DELETE | `/api-keys/{id}` | Revoke |

## Invoices

| Method | Path | Purpose |
|---|---|---|
| POST | `/invoices` | Upload invoice (`multipart/form-data`) |
| GET  | `/invoices` | List, filter `status`, `risk_band`, `supplier_id` |
| GET  | `/invoices/{id}` | Detail with extracted fields, scores, signals |
| POST | `/invoices/{id}/rescore` | Force a re-evaluation |
| POST | `/invoices/{id}/approve` | Approver action (RBAC: finance/cfo) |
| POST | `/invoices/{id}/reject` | Mark as rejected with reason code |
| GET  | `/invoices/{id}/audit` | Per-invoice audit trail |

### Upload

```
POST /invoices  Content-Type: multipart/form-data
  file:      <binary>          required
  source:    upload|email|erp  optional, default upload
  reference: string            optional, your own ref
```

Response `202`:
```json
{ "id": "inv_01HZ...", "status": "processing",
  "estimated_completion_seconds": 12 }
```

When processing finishes, the document moves to `status: scored`. Subscribe
to webhooks (`invoice.scored`) or poll the detail endpoint.

## Suppliers

| Method | Path | Purpose |
|---|---|---|
| GET  | `/suppliers` | List with current trust band |
| GET  | `/suppliers/{id}` | Detail + IBAN history + signals |
| POST | `/suppliers/{id}/notes` | Reviewer note |
| POST | `/suppliers/{id}/lock` | Block payments to this supplier |
| POST | `/suppliers/{id}/unlock` | Unblock |

## Alerts

| Method | Path | Purpose |
|---|---|---|
| GET  | `/alerts` | List, filter by `severity` and `state` |
| POST | `/alerts/{id}/acknowledge` | |
| POST | `/alerts/{id}/dismiss` | With reason |

## Insights

| Method | Path | Purpose |
|---|---|---|
| GET  | `/insights/overview` | Trust trend, risk mix, anomaly heatmap |
| GET  | `/insights/suppliers` | Top risky suppliers |
| GET  | `/insights/payments` | Payment-change flags, IBAN deltas |

## Webhooks

| Method | Path | Purpose |
|---|---|---|
| POST | `/webhooks/endpoints` | Register URL + scopes |
| GET  | `/webhooks/endpoints` | List |
| DELETE | `/webhooks/endpoints/{id}` | Remove |
| GET  | `/webhooks/deliveries?endpoint_id=…` | Delivery log |

Events:
- `invoice.received` — uploaded, before scoring
- `invoice.scored` — Trust Score available
- `invoice.high_risk` — score < 35
- `supplier.iban_changed`
- `case.escalated`
- `case.approved` / `case.rejected`

Each delivery is signed:
```
X-Trustline-Timestamp: 1715184000
X-Trustline-Signature: t=1715184000,v1=hex(hmac_sha256(secret, ts + "." + body))
```

## Privacy / GDPR

| Method | Path | Purpose |
|---|---|---|
| POST | `/privacy/export` | Async data export (returns job id, signed URL when ready) |
| POST | `/privacy/delete` | Right-to-erasure with verification flow |
