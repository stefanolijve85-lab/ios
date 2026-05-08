# AI / ML pipeline

The platform combines deterministic rules, classical ML, and LLM reasoning.
Each layer has a different role and a different latency / cost / trust
profile.

## Layers

### 1. Document understanding (OCR + layout)
- **Provider interface**: `OCRProvider.parse(file_bytes) -> ParsedInvoice`
- **Default**: Azure Document Intelligence prebuilt-invoice model.
- **Alt**: Google Document AI Invoice Parser.
- **Why an interface**: lets us A/B providers per tenant and avoids
  vendor lock-in. The output schema is the only public contract:
  `supplier_name`, `supplier_address`, `iban`, `vat`, `currency`,
  `subtotal_cents`, `tax_cents`, `total_cents`, `due_date`,
  `invoice_number`, `line_items[]`, `language`, `pages[].text`,
  `pages[].layout` (block bounding boxes).

### 2. Forensics (deterministic)
- PDF object-tree walk, font enumeration, `/JS` and `/AA`
  detection, metadata mismatch (PDF `ModDate` after `CreationDate` only,
  no `Adobe Photoshop` in `Producer` for an invoice template, etc.).
- Image-render comparison: rasterize the PDF and compare against the
  text layer to detect overlaid text in image form (a classic fraud
  vector — pasting a fake IBAN over the original).
- Output: `{score: 0..100, signals: [...], severity: low|med|high}`.

### 3. Supplier trust (deterministic + 3rd-party)
- VIES VAT validation with mod-97 + checksum and live VIES query.
- KvK (NL chamber of commerce) lookup (paid API, cached 24h).
- WHOIS for domain age, MX for mail presence, SPF/DMARC presence.
- Sanctions match against OFAC SDN, EU consolidated, UN consolidated
  (refreshed daily into a local denormalized table for fast lookup).
- Output: trust score, list of failing checks.

### 4. IBAN / payment security (deterministic + historical)
- IBAN structure + mod-97 checksum.
- Country-risk score from FATF + tenant policy.
- Match against this supplier's known IBAN history; flag if new IBAN +
  short relationship + change within last 14 days.
- Velocity: flag if more than N IBAN changes for one supplier in a
  rolling window.

### 5. Email security (deterministic)
- Parse RFC822 headers; check SPF + DKIM + DMARC.
- `From` vs `Reply-To` mismatch. Display-name spoofing
  (`"Acme Inc <attacker@evil.tld>"`).
- Lookalike domain detection via Damerau-Levenshtein and homoglyph
  normalization against the supplier's primary domain.
- Body language signals (urgency, "new bank account", "wire today")
  via small classifier.

### 6. Behavioral anomaly (ML)
- **v1 (cold-start)**: Isolation Forest on per-tenant features
  `(amount_z, day_of_week, hour, supplier_freq, currency_freq, …)`.
- **v2**: Gradient-boosted classifier (LightGBM) once a tenant has
  ≥5 000 labeled invoices. Trained nightly. Class imbalance handled
  with `scale_pos_weight`.
- **Embeddings**: invoice text embeddings stored in `pgvector` for
  near-duplicate detection and for retrieval-augmented LLM reasoning.

### 7. Vision (template fingerprinting)
- Perceptual hash (`pHash`) of the rendered first page → fast
  duplicate / template-clone search.
- Layout embedding via a small CNN (CLIP-style fine-tune) for fuzzy
  template match.
- Compares against the tenant's known supplier templates; flags
  invoices that *look* like supplier X but were sent from a domain
  unrelated to supplier X.

### 8. LLM reasoning
- **Default model**: Anthropic Claude (Sonnet for routine narration,
  Opus for high-risk explanations). Configurable per tenant.
- Used for:
  - Generating natural-language reason narratives
    ("Two indicators stand out…").
  - Reviewer Q&A ("why is this flagged?").
  - Summarizing email threads attached to an invoice.
- **Never used to compute the Trust Score directly** — the score is
  always the deterministic weighted sum, so it stays auditable.
- **Prompt-injection defense**: extracted invoice text is always wrapped
  in `<DOCUMENT>…</DOCUMENT>` markers, with a system-message
  reaffirmation after the document, and JSON-mode where the provider
  supports it.
- **PII**: by default, IBAN/email/VAT/phone are redacted before the
  prompt. Tenants on a Zero-Retention DPA can opt in to send raw values.

## Feedback loop

Every analyst decision writes a `feedback_events` row:
```
feedback_events(invoice_id, decision, reason_code, reviewer_id, weight)
```
Nightly job retrains the anomaly model with the new data and updates
per-tenant supplier statistics. False positives reduce future weight
for the offending signal; confirmed frauds add the supplier/IBAN to a
tenant-local blocklist (and, with consent, the cross-tenant signal
network).
