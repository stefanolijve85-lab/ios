-- Optional seed data for local development.
-- Note: in normal flow you create your first tenant + admin via
-- POST /v1/auth/signup — that endpoint hashes the password and writes
-- the audit log entry for you. This file is here purely as a sanity
-- check / smoke test that the schema loaded correctly.

SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'invoices')         AS invoices_table_present,
  (SELECT COUNT(*) FROM pg_extension WHERE extname = 'pgcrypto')                          AS pgcrypto_loaded,
  (SELECT COUNT(*) FROM pg_extension WHERE extname = 'citext')                            AS citext_loaded,
  (SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector')                            AS pgvector_loaded;
