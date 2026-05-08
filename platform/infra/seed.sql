-- Optional seed data for local development.
-- Run after migrations: psql ... -f infra/seed.sql

INSERT INTO tenants (id, slug, name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'acme', 'Acme Holding', 'professional')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name)
VALUES (
  'usr_demo_admin',
  'admin@acme.test',
  '$argon2id$v=19$m=65536,t=3,p=4$placeholder$placeholder',  -- replace with hash_password()
  'Demo Admin'
) ON CONFLICT DO NOTHING;

INSERT INTO memberships (tenant_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'usr_demo_admin', 'admin')
ON CONFLICT DO NOTHING;
