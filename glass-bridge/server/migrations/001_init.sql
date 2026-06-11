-- Glass Bridge — initial schema.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT,
  password_hash TEXT NOT NULL,
  balance       NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  is_muted      BOOLEAN NOT NULL DEFAULT FALSE,
  muted_until   BIGINT,
  client_seed   TEXT NOT NULL,
  nonce         BIGINT NOT NULL DEFAULT 1,
  created_at    BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (lower(username));

CREATE TABLE IF NOT EXISTS rounds (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username         TEXT NOT NULL,
  bet              NUMERIC(14,2) NOT NULL,
  multiplier       NUMERIC(10,2) NOT NULL,
  payout           NUMERIC(14,2) NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('cashed_out','busted')),
  rows_cleared     INT NOT NULL,
  server_seed      TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  client_seed      TEXT NOT NULL,
  nonce            BIGINT NOT NULL,
  created_at       BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rounds_created ON rounds (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rounds_user ON rounds (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rounds_payout ON rounds (payout DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor_id   TEXT,
  action     TEXT NOT NULL,
  detail     TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at DESC);

CREATE TABLE IF NOT EXISTS game_config (
  id     INT PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);
