-- RGS ledger schema (PostgreSQL). Apply with:  psql "$DATABASE_URL" -f server/rgs/schema.sql
-- Money is stored in INTEGER MINOR UNITS (bigint). Never use floats for money.

CREATE TABLE IF NOT EXISTS operators (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  mode        text NOT NULL DEFAULT 'demo',      -- demo | seamless
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id           text PRIMARY KEY,
  operator_id  text NOT NULL REFERENCES operators(id),
  external_id  text NOT NULL,                     -- the operator's player id
  currency     text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_id, external_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id           text PRIMARY KEY,
  operator_id  text NOT NULL REFERENCES operators(id),
  player_id    text NOT NULL REFERENCES players(id),
  currency     text NOT NULL,
  game_key     text NOT NULL,
  mode         text NOT NULL,                     -- demo | seamless
  status       text NOT NULL DEFAULT 'open',      -- open | closed
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Provably-fair round audit trail (one row per round per game).
CREATE TABLE IF NOT EXISTS rounds (
  id                text PRIMARY KEY,
  game_key          text NOT NULL,
  round_no          bigint NOT NULL,
  server_seed       text,                          -- revealed only after the bust
  server_seed_hash  text NOT NULL,                 -- committed before bets
  crash_point       numeric(12,2) NOT NULL,
  rtp               int,
  status            text NOT NULL DEFAULT 'open',  -- open | settled
  created_at        timestamptz NOT NULL DEFAULT now(),
  crashed_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_rounds_game ON rounds (game_key, round_no);

CREATE TABLE IF NOT EXISTS bets (
  id                 text PRIMARY KEY,
  round_id           text NOT NULL REFERENCES rounds(id),
  session_id         text NOT NULL REFERENCES sessions(id),
  player_id          text NOT NULL REFERENCES players(id),
  slot               int NOT NULL,
  stake_minor        bigint NOT NULL,
  currency           text NOT NULL,
  auto_cashout       numeric(12,2),
  status             text NOT NULL DEFAULT 'placed', -- placed|won|lost|cancelled
  cashout_multiplier numeric(12,2),
  payout_minor       bigint NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  settled_at         timestamptz
);
CREATE INDEX IF NOT EXISTS idx_bets_round ON bets (round_id);
CREATE INDEX IF NOT EXISTS idx_bets_player ON bets (player_id);

-- Append-only money ledger. `ref` is the idempotency key (one row per logical
-- wallet action); a UNIQUE constraint guarantees no double-charge on retries.
CREATE TABLE IF NOT EXISTS transactions (
  id                  text PRIMARY KEY,
  ref                 text NOT NULL UNIQUE,
  type                text NOT NULL,                -- bet | win | rollback
  operator_id         text NOT NULL,
  player_id           text NOT NULL,
  session_id          text NOT NULL,
  round_id            text,
  bet_id              text,
  amount_minor        bigint NOT NULL,
  currency            text NOT NULL,
  balance_after_minor bigint,
  provider_ref        text,
  status              text NOT NULL DEFAULT 'ok',
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tx_player ON transactions (player_id, created_at);

-- Demo-mode wallet balances (real money lives in the operator's wallet, not here).
CREATE TABLE IF NOT EXISTS wallet_accounts (
  operator_id   text NOT NULL,
  player_id     text NOT NULL,
  currency      text NOT NULL,
  balance_minor bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (operator_id, player_id, currency)
);
