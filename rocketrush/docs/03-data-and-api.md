# 6, 7 · Database Schema & API Documentation

---

<a id="schema"></a>
## Database Schema (PostgreSQL)

Money is stored as **integer minor units** (cents) — never floats. Every balance
change is double-entry in `ledger_entries`; `wallets.balance` is a cached
projection that must always equal the sum of its ledger.

```sql
-- ============ IDENTITY ============
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        CITEXT UNIQUE NOT NULL,
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  totp_secret     TEXT,                       -- 2FA (encrypted at rest)
  country         CHAR(2),
  status          TEXT NOT NULL DEFAULT 'active', -- active|self_excluded|suspended
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  device_hash     TEXT,                        -- bot/fraud signal
  ip_inet         INET,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ WALLET (double-entry) ============
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id),
  currency        CHAR(3) NOT NULL DEFAULT 'EUR',
  balance         BIGINT NOT NULL DEFAULT 0    -- cents; = SUM(ledger)
);

CREATE TABLE ledger_entries (
  id              BIGSERIAL PRIMARY KEY,
  wallet_id       UUID NOT NULL REFERENCES wallets(id),
  amount          BIGINT NOT NULL,             -- signed cents (+credit/-debit)
  type            TEXT NOT NULL,               -- bet|win|deposit|withdraw|adjust
  ref_bet_id      UUID,
  idempotency_key TEXT UNIQUE,                 -- exactly-once writes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PROVABLY-FAIR ROUNDS ============
CREATE TABLE rounds (
  id              BIGSERIAL PRIMARY KEY,
  nonce           BIGINT NOT NULL,
  server_seed     TEXT NOT NULL,               -- revealed AFTER crash
  server_seed_hash TEXT NOT NULL,              -- published BEFORE round
  client_seed     TEXT NOT NULL,               -- rotating shared/public seed
  crash_point     NUMERIC(12,2) NOT NULL,
  state           TEXT NOT NULL,               -- betting|running|crashed
  started_at      TIMESTAMPTZ,
  crashed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON rounds (created_at DESC);

-- ============ BETS ============
CREATE TABLE bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id        BIGINT NOT NULL REFERENCES rounds(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  amount          BIGINT NOT NULL,             -- cents
  auto_cashout    NUMERIC(8,2),                -- null = manual only
  cashed_out_at   NUMERIC(12,2),               -- multiplier, null = busted
  payout          BIGINT NOT NULL DEFAULT 0,   -- cents
  status          TEXT NOT NULL DEFAULT 'open',-- open|won|lost|cancelled
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON bets (round_id);
CREATE INDEX ON bets (user_id, created_at DESC);

-- ============ RESPONSIBLE GAMING ============
CREATE TABLE rg_limits (
  user_id         UUID PRIMARY KEY REFERENCES users(id),
  deposit_daily   BIGINT, deposit_weekly BIGINT, deposit_monthly BIGINT,
  loss_daily      BIGINT,
  session_minutes INT,
  reality_check_minutes INT,
  self_excluded_until TIMESTAMPTZ,
  cooloff_until   TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ AUDIT / COMPLIANCE ============
CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  actor_user_id   UUID,
  action          TEXT NOT NULL,               -- login|bet|cashout|limit_change|admin_*
  meta            JSONB NOT NULL DEFAULT '{}',
  ip_inet         INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  body            TEXT NOT NULL,
  hidden          BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Redis** holds the hot state, not durable truth: current round, online count,
live winners feed, rate-limit counters, leader lock. **Kafka** topics:
`bets`, `cashouts`, `rounds`, `wallet`, `risk-events`, `audit`.

---

<a id="rest-api"></a>
## REST API (NestJS) — gameplay is over WebSocket; REST is everything around it

Base: `/api/v1` · Auth: `Authorization: Bearer <jwt>` · All bodies zod-validated.

### Auth
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/auth/register` | `{username,email,password}` | `{userId}` |
| POST | `/auth/login` | `{email,password,totp?}` | `{token,need2fa?}` |
| POST | `/auth/2fa/enable` | — | `{otpauthUrl,secret}` |
| POST | `/auth/logout` | — | `204` |

### Wallet
| Method | Path | Returns |
|--------|------|---------|
| GET | `/wallet` | `{balance,currency}` |
| GET | `/wallet/ledger?cursor=` | paginated entries |
| POST | `/wallet/deposit` | provider redirect (RG limits enforced) |
| POST | `/wallet/withdraw` | `{status}` |

### Game history & fairness
| Method | Path | Returns |
|--------|------|---------|
| GET | `/rounds?cursor=` | recent rounds `{nonce,crashPoint,serverSeedHash, serverSeed?}` |
| GET | `/rounds/:nonce` | full round incl. revealed `serverSeed` |
| GET | `/bets?cursor=` | my bet history |
| GET | `/fair/client-seed` | my current client seed |
| POST | `/fair/client-seed` | `{seed}` → rotate my client seed |
| POST | `/fair/verify` | `{serverSeed,clientSeed,nonce}` → `{crashPoint}` |

**`POST /fair/verify` example**
```http
POST /api/v1/fair/verify
{ "serverSeed":"c31f…", "clientSeed":"player-seed-123", "nonce":1 }

200 OK
{ "hmac":"ce04…629c", "crashPoint": 5.08 }   # reproduce locally, must match round
```

### Responsible gaming
| Method | Path | Body |
|--------|------|------|
| GET | `/rg/limits` | — |
| PUT | `/rg/limits` | `{depositDaily?,sessionMinutes?,realityCheckMinutes?,...}` |
| POST | `/rg/self-exclude` | `{until}` |
| POST | `/rg/cooloff` | `{hours}` |

### Operator (separate host, RBAC: `operator`/`admin` only)
`GET /op/stats/online · /op/stats/ggr · /op/stats/retention · /op/stats/regions
· /op/rounds · /op/players/:id · PUT /op/theme · PUT /op/whitelabel · PUT
/op/i18n`. Every operator write lands in `audit_log`.

### Error envelope (consistent everywhere)
```json
{ "error": { "code": "INSUFFICIENT_BALANCE", "message": "…", "requestId": "…" } }
```
Standard codes: `UNAUTHENTICATED`, `RATE_LIMITED`, `PHASE_CLOSED`,
`INSUFFICIENT_BALANCE`, `LIMIT_EXCEEDED`, `SELF_EXCLUDED`, `ALREADY_CASHED_OUT`.
