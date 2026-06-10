# 10, 11, 12 · MVP Roadmap, Production Roadmap & Scalability Plan

---

<a id="mvp"></a>
## MVP Roadmap (ship a real, fair, single-shard game)

**Goal:** one game shard, real money loop, provably fair, one region. Prove the
core loop is fun and trustworthy before scaling anything.

| Phase | Duration | Deliverables | Done when |
|-------|----------|--------------|-----------|
| **M0 — Core loop** | wk 1–2 | This `index.html` engine → `apps/web`; round state machine in NestJS; Socket.io contract; in-memory rounds | A round runs end-to-end with multiplier + manual cashout on screen |
| **M1 — Provably fair** | wk 2–3 | `packages/fairness`; seed lifecycle (hash→reveal); `/fair/verify`; verification page | A player can independently verify a real round |
| **M2 — Money** | wk 3–4 | Wallet + double-entry ledger; atomic bet debit / cashout credit; idempotency | Balance always equals ledger sum under load tests |
| **M3 — Accounts** | wk 4–5 | Register/login, sessions, JWT, basic 2FA | A user can sign up, play, see history |
| **M4 — Social (minimal)** | wk 5 | Winners feed, online count, chat + moderation | The screen feels alive |
| **M5 — RG + audit** | wk 5–6 | Deposit/session limits, reality check, self-exclusion, audit log | Compliance baseline met |
| **M6 — Harden + PWA** | wk 6–7 | Rate limits, reconnection, low-bandwidth mode, PWA, load test | 60fps on mid-range mobile, survives reconnects |

**MVP exit:** one shard handles ~5k concurrent players, every round verifiable,
balances provably correct, RG + audit in place.

---

<a id="production"></a>
## Production Roadmap (scale, trust, monetize)

| Phase | Theme | Highlights |
|-------|-------|-----------|
| **P1 — Scale the realtime tier** | Multi-node | Redis Socket.io adapter, leader-elected engine, sticky WSS via Cloudflare/ALB, HPA on connection count |
| **P2 — Data backbone** | Kafka + consumers | Outbox → Kafka; ledger, analytics, fraud, payout consumers; warehouse sink |
| **P3 — Operator dashboard** | Visibility | Online, active bets, bet volume, **GGR**, retention, sessions, regional breakdown, round stats |
| **P4 — Risk & integrity** | Trust | Bot/fraud scoring, velocity rules, device fingerprinting, anomaly alerts, DDoS posture |
| **P5 — Payments & KYC** | Real money at scale | PSP integrations, KYC/AML, withdrawal review queue |
| **P6 — White-label & i18n** | Growth | Theme settings, white-label config, full localization, regional compliance packs |
| **P7 — Modular social** | Retention | Friends, clans, tournaments, seasons — **as separate surfaces**, never cluttering the 3-second main screen |

**Modularity rule:** every future feature (friends/clans/tournaments/seasons) is
a self-contained module with its own route and feature flag. The main game screen
is frozen as the simplest possible experience.

---

<a id="scalability"></a>
## Scalability Plan

### Targets
- 100k+ concurrent players, one game variant.
- Round broadcast fan-out latency p99 < 80ms.
- Cashout accept→confirm p99 < 120ms.

### How each tier scales
| Tier | Bottleneck | Strategy |
|------|-----------|----------|
| **Edge** | Connections, DDoS | Cloudflare WSS termination, geo-routing, L3/L7 protection, rate limiting at edge |
| **Socket.io** | FD/CPU per node | Stateless nodes, Redis pub/sub adapter, HPA on active-connection metric; ~10–20k conns/node |
| **Game engine** | Single authoritative clock | One leader per variant (cheap: it only ticks + validates). Scale by **sharding into multiple game variants/rooms**, each with its own leader — not by splitting one round |
| **Postgres** | Write throughput on bets/ledger | Primary + read replicas; partition `bets`/`ledger_entries` by month; the hot path writes are tiny + idempotent; batch settlement |
| **Redis** | Hot state ops | Cluster mode; separate instances for pub/sub vs. counters vs. locks |
| **Kafka** | Event volume | Partition by `userId`/`roundId`; consumers scale independently; replay for rebuilds |

### Why this stays simple under load
The expensive thing in most games — per-player simulation — doesn't exist here.
**One number (the multiplier) is broadcast to everyone.** Fan-out is the only hot
path, and fan-out is exactly what Redis pub/sub + stateless socket nodes do well.
Player actions (bet/cashout) are rare, tiny, idempotent writes. This is why a
crash game can hit very high concurrency on modest infrastructure.

### Capacity sketch
- 100k players × one 25Hz multiplier broadcast = pub/sub fan-out, not per-player
  compute.
- Bets/cashouts ≈ a few thousand small writes per round → comfortably within a
  single well-tuned Postgres primary with batched settlement.
- Add variants/regions to scale linearly: each is an independent shard.

### Observability & resilience
- Prometheus/Grafana: conns, fan-out latency, cashout latency, round duration,
  ledger-balance drift alarm.
- Game engine leader failover via Redis lock TTL; clients auto-reconnect with
  backoff and re-sync from `round:*` snapshot on reconnect.
- Chaos drills: kill a socket node (clients rebalance), kill the engine leader
  (new leader resumes from Redis round state) — no player loses a settled bet.
