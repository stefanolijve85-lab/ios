-- Trustline initial schema
-- Postgres 16+; requires pgcrypto and pgvector extensions.
--
-- Conventions:
--   * Every tenant-owned table has tenant_id NOT NULL with RLS enabled.
--   * Every PK is a ULID-shaped TEXT (`prefix_<26 char base32>`) generated
--     in app code. Using TEXT keeps logs grep-friendly and avoids exposing
--     row counts via sequential ids.
--   * `created_at`/`updated_at` are populated by triggers.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Helpers ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- ─── Tenancy ──────────────────────────────────────────────────────────────

CREATE TABLE tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  isolation_mode  text NOT NULL DEFAULT 'logical'
                       CHECK (isolation_mode IN ('logical','dedicated_schema','dedicated_db')),
  plan            text NOT NULL DEFAULT 'starter'
                       CHECK (plan IN ('starter','professional','enterprise')),
  policy          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- thresholds, weights overrides
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE users (
  id              text PRIMARY KEY,
  email           citext UNIQUE NOT NULL,
  password_hash   text,                  -- nullable when SSO-only
  full_name       text NOT NULL,
  mfa_enabled     boolean NOT NULL DEFAULT false,
  mfa_secret      text,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('admin','cfo','finance','reviewer','auditor','read_only')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE api_keys (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  prefix          text NOT NULL,
  last4           text NOT NULL,
  hash            text NOT NULL,                   -- sha256
  scopes          text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_by      text REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz,
  revoked_at      timestamptz
);
CREATE INDEX api_keys_tenant_idx ON api_keys(tenant_id);

-- ─── Suppliers ───────────────────────────────────────────────────────────

CREATE TABLE suppliers (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  legal_name      text,
  vat             text,
  registration_no text,
  country         char(2),
  primary_domain  text,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','locked','archived')),
  trust_score     integer,                          -- last computed 0..100
  trust_band      text,                             -- trusted/low/medium/suspicious/high/critical
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX suppliers_tenant_idx ON suppliers(tenant_id);
CREATE INDEX suppliers_vat_idx    ON suppliers(tenant_id, vat);
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE supplier_iban_history (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id     text NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  iban            text NOT NULL,
  iban_country    char(2),
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  use_count       integer NOT NULL DEFAULT 1,
  is_blocked      boolean NOT NULL DEFAULT false
);
CREATE INDEX siban_supplier_idx ON supplier_iban_history(tenant_id, supplier_id);
CREATE UNIQUE INDEX siban_supplier_iban_uk
  ON supplier_iban_history(tenant_id, supplier_id, iban);

CREATE TABLE supplier_signals (
  supplier_id     text PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vat_valid       boolean,
  vat_checked_at  timestamptz,
  domain_age_days integer,
  mx_present      boolean,
  spf_present     boolean,
  dmarc_present   boolean,
  sanctions_match boolean NOT NULL DEFAULT false,
  sanctions_lists text[],
  registry_match  boolean,
  raw             jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Documents & invoices ────────────────────────────────────────────────

CREATE TABLE documents (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source          text NOT NULL CHECK (source IN ('upload','email','erp','api')),
  filename        text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      bigint NOT NULL,
  storage_key     text NOT NULL,                    -- s3://… key
  sha256          text NOT NULL,
  uploaded_by     text REFERENCES users(id),
  status          text NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received','parsing','parsed','failed')),
  ocr_provider    text,
  ocr_raw_key     text,                              -- S3 key of full OCR JSON
  parsed_at       timestamptz,
  failure_reason  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_tenant_status_idx ON documents(tenant_id, status, created_at DESC);

CREATE TABLE invoices (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id     text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  supplier_id     text REFERENCES suppliers(id),
  external_ref    text,                              -- customer's own reference

  invoice_number  text,
  issue_date      date,
  due_date        date,

  currency        char(3),
  subtotal_cents  bigint,
  tax_cents       bigint,
  total_cents     bigint,

  iban            text,
  iban_country    char(2),
  bank_account_holder text,

  language        text,
  raw_text_excerpt text,                              -- first 4 KB for search/preview
  text_embedding  vector(1536),

  status          text NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing','scored','approved','rejected','on_hold')),
  trust_score     integer,
  risk_band       text,
  scored_at       timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoices_tenant_status_idx ON invoices(tenant_id, status, created_at DESC);
CREATE INDEX invoices_tenant_supplier_idx ON invoices(tenant_id, supplier_id);
CREATE INDEX invoices_tenant_band_idx ON invoices(tenant_id, risk_band);
CREATE INDEX invoices_embedding_ivfflat
  ON invoices USING ivfflat (text_embedding vector_cosine_ops) WITH (lists = 100);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE invoice_line_items (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position        integer NOT NULL,
  description     text,
  quantity        numeric(18,4),
  unit_price_cents bigint,
  amount_cents    bigint,
  tax_rate_pct    numeric(5,2)
);
CREATE INDEX line_items_invoice_idx ON invoice_line_items(invoice_id, position);

-- ─── Risk / signals ──────────────────────────────────────────────────────

CREATE TABLE risk_assessments (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  trust_score     integer NOT NULL,
  risk_band       text NOT NULL,
  hard_penalty    integer NOT NULL DEFAULT 0,
  recommended_action text NOT NULL,
  contributors    jsonb NOT NULL,                    -- top-k {signal,weight,score,delta,reason}
  weights_version text NOT NULL,
  model_version   text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX risk_assess_tenant_invoice_idx
  ON risk_assessments(tenant_id, invoice_id, created_at DESC);

CREATE TABLE forensic_reports (
  invoice_id      text PRIMARY KEY REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  score           integer NOT NULL,
  has_javascript  boolean NOT NULL DEFAULT false,
  metadata_score  integer,
  font_score      integer,
  rendering_score integer,
  signals         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_artifacts (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id     text REFERENCES documents(id) ON DELETE CASCADE,
  invoice_id      text REFERENCES invoices(id) ON DELETE SET NULL,
  message_id      text,
  from_addr       text,
  reply_to_addr   text,
  display_name    text,
  spf_pass        boolean,
  dkim_pass       boolean,
  dmarc_pass      boolean,
  lookalike_score integer,
  signals         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Workflow ────────────────────────────────────────────────────────────

CREATE TABLE cases (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  state           text NOT NULL DEFAULT 'open'
                  CHECK (state IN ('open','reviewing','escalated','approved','rejected','expired')),
  severity        text NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  assignee        text REFERENCES users(id),
  due_at          timestamptz,
  closed_at       timestamptz,
  closed_by       text REFERENCES users(id),
  closure_reason  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cases_tenant_state_idx ON cases(tenant_id, state, severity);
CREATE TRIGGER trg_cases_updated BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE case_events (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id         text NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id        text REFERENCES users(id),
  kind            text NOT NULL,                      -- comment, state_change, assignment, override
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX case_events_case_idx ON case_events(case_id, created_at);

-- ─── Alerts ──────────────────────────────────────────────────────────────

CREATE TABLE alerts (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      text REFERENCES invoices(id) ON DELETE CASCADE,
  supplier_id     text REFERENCES suppliers(id) ON DELETE CASCADE,
  kind            text NOT NULL,                       -- iban_changed, sanctions_hit, …
  severity        text NOT NULL,
  state           text NOT NULL DEFAULT 'open'
                  CHECK (state IN ('open','acknowledged','dismissed')),
  title           text NOT NULL,
  detail          text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);
CREATE INDEX alerts_tenant_state_idx ON alerts(tenant_id, state, created_at DESC);

-- ─── Audit log ───────────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id              bigserial PRIMARY KEY,
  tenant_id       uuid REFERENCES tenants(id) ON DELETE SET NULL,
  actor_id        text,
  actor_kind      text NOT NULL CHECK (actor_kind IN ('user','api_key','system')),
  action          text NOT NULL,
  resource_kind   text,
  resource_id     text,
  ip              inet,
  user_agent      text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash       text,
  hash            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_tenant_idx ON audit_log(tenant_id, created_at DESC);

-- ─── Webhooks ────────────────────────────────────────────────────────────

CREATE TABLE webhook_endpoints (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url             text NOT NULL,
  secret          text NOT NULL,                       -- HMAC signing key
  events          text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id     text NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event           text NOT NULL,
  payload         jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','delivered','failed','dead')),
  attempts        integer NOT NULL DEFAULT 0,
  last_status_code integer,
  last_error      text,
  next_attempt_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webhook_deliveries_due_idx
  ON webhook_deliveries(tenant_id, status, next_attempt_at);

-- ─── Feedback (closes the ML loop) ───────────────────────────────────────

CREATE TABLE feedback_events (
  id              text PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reviewer_id     text REFERENCES users(id),
  decision        text NOT NULL CHECK (decision IN ('approved','rejected_fraud','rejected_other')),
  reason_code     text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feedback_invoice_idx ON feedback_events(invoice_id);

-- ─── Row-level security ──────────────────────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname='public'
      AND tablename IN (
        'memberships','api_keys','suppliers','supplier_iban_history',
        'supplier_signals','documents','invoices','invoice_line_items',
        'risk_assessments','forensic_reports','email_artifacts','cases',
        'case_events','alerts','webhook_endpoints','webhook_deliveries',
        'feedback_events')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_tenant())',
      r.tablename);
  END LOOP;
END $$;
