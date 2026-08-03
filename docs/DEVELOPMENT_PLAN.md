# QUANTUM SPIN — phased development plan (MVP → Beta → Release → Live Ops)

This plan takes QUANTUM SPIN from the working MVP in this repo to a certified,
scalable, multi-theme live product. Each phase lists **scope, tests, security,
performance and deployment** exit criteria. The MVP is done; later phases are
scoped so they can be delivered incrementally without a rewrite — the module
boundaries in the codebase (engine / session / pools / theme / renderer) are the
seams along which we scale.

---

## Phase 0 — MVP ✅ (shipped in this repo)

**Scope.** Server-authoritative 5×3 / 25-line slot; weighted reels; wilds;
Quantum Portal free spins; Quantum Reactor tumbles + multiplier ladder; four-tier
progressive Quantum Vault jackpot; buy-feature; provably-fair commit–reveal with
a trustless in-browser verifier; adaptive Web Audio; AssetManager; Theme Engine
(2 skins); mobile-first premium UI; XP/levels, daily reward, missions/rewards.

**Tests.** `npm run test:slot` (13 engine + fairness tests). `npm run sim` RTP
Monte-Carlo. Client↔server parity harness (80/80 rounds reproduced exactly).
`npm run build` green; `tsc --noEmit` clean.

**Security.** Outcomes and balances are server-only; client sends intent, never
results. Bets snap to the allowed ladder (tamper-proof). Body-size guard on the
API. Per-spin max-win cap. No secrets in the client bundle.

**Performance.** DOM/CSS/GPU-composited reels (transforms + opacity only), no
layout thrash; deterministic SSR background (no hydration jump); route-split
`/quantum` (~12 kB) and `/quantum/verify` (~7 kB) first-load JS.

**Deploy.** Single-origin Node server (already Docker/Render/Railway-ready).

---

## Phase 1 — Beta (production data + admin + renderer)

**Goal:** persistence, an operator CMS, and the AAA renderer, without changing
the certified math.

### 1.1 Persistence — Postgres + Prisma + Redis
- Replace the in-memory session/pools stores with:
  - **Postgres (Prisma):** `players`, `sessions`, `rounds` (append-only ledger:
    nonce, seeds hashes, bet, win, outcome hash), `jackpot_wins`, `seed_epochs`.
  - **Redis:** live balances (write-through), progressive pools (atomic
    `INCRBYFLOAT` per bet so pools are correct across multiple app instances),
    rate-limit counters.
- The interfaces (`session.js`, `pools.js`) are already narrow (create/get,
  contribute/award/snapshot) — swap the backing store behind them; game code is
  untouched. Every round is written to the ledger for audit + the verify page.

### 1.2 Admin CMS (`/admin`)
- Auth (role-based: admin / analyst / support), audit log on every change.
- **Symbols:** upload PNG/SVG/WEBP/AVIF → CDN; the AssetManager picks them up.
- **Math:** edit paytable, reel weights, RTP band, free-spins awards, jackpot
  seeds/rates/trigger — writes a new versioned config; **every save runs the RTP
  simulator server-side** and blocks publishing outside the target band.
- **Content:** paytable copy, feature names, sounds, themes; A/B test buckets.
- **Ops:** jackpot pool controls, session/round lookup, manual round re-verify.

### 1.3 Renderer swap — PixiJS/WebGL
- Introduce a `renderer/` boundary: the current DOM reels become the fallback;
  a **PixiJS** WebGL renderer becomes primary (texture atlas from the
  AssetManager, object pooling for symbols/particles, GPU particle systems for
  wins/portal, spritesheet animations). `useSlot` already emits a resolved,
  step-by-step result — the renderer just consumes it, so the swap is isolated.
- GSAP for the cinematic feature intros / big-win sequences.

**Tests.** Prisma migration tests; ledger round-trip; multi-instance pool
concurrency test (Redis); renderer visual regression (Playwright screenshots);
admin RBAC + audit tests; "config change re-simulates RTP" gate test.

**Security.** Admin behind SSO + 2FA; server-side validation of every config
field; signed asset uploads; parametrised queries (Prisma); CSRF on admin;
secrets in a vault; per-IP + per-session rate limits on the spin API.

**Performance.** 60fps on mid-range mobile under the WebGL renderer; texture
atlas + lazy theme loading; Redis pool reads cached with short TTL.

**Deploy.** `docker-compose` (app + Postgres + Redis) for local/staging; managed
Postgres/Redis in staging.

---

## Phase 2 — Release (certification, RGS, i18n, compliance)

**Goal:** a launchable, certifiable product integrated with a real-money
platform.

- **RGS / platform integration:** wallet API (debit/credit/rollback), session
  tokens, game-round reconciliation, regulator reporting hooks. The
  server-authoritative design already matches RGS expectations.
- **Certification pack:** RTP evidence (billions of simulated + logged rounds),
  RNG documentation, max-win proof, rules of play, disconnection/resume policy,
  provably-fair whitepaper. Hooks for a third-party RNG certificate.
- **Responsible gaming:** reality checks, session limits, loss/deposit limits,
  self-exclusion, autoplay loss/stop limits, clocks, jurisdiction gating.
- **i18n / L10n:** full string catalogue, RTL support, **multi-currency**
  (server-side minor units, per-currency bet ladders), locale number/date
  formatting. (Currency formatting util already in `src/game/format.ts`.)
- **Layouts & content:** enable 5×4 and the 6×5 "ways" layout; ship 2–3 more
  themes through the Theme Engine to prove content velocity.

**Tests.** Certification simulation runs in CI (nightly, 1B+ spins sharded);
wallet integration contract tests; RG-limit enforcement tests; i18n snapshot
tests; disconnection/resume replay tests.

**Security.** Full pen-test; threat model; wallet-call idempotency keys;
tamper-evident round ledger (hash-chained); WAF; DDoS protection; PII handling
per GDPR; encrypted secrets + key rotation.

**Performance.** Load test to target concurrency; p99 spin latency budget
(< 150 ms server); CDN for assets; autoscaling policy validated.

**Deploy.** CI/CD with staged rollout, blue/green, DB migrations gated, canary +
automatic rollback on RTP/latency alarms.

---

## Phase 3 — Live Operations

**Goal:** run, grow and safely evolve the game.

- **Realtime analytics dashboard:** rounds, active players, avg session length,
  bonus activations, jackpot hits, popular bets, funnels, retention, RTP drift
  monitoring (live measured RTP vs certified band with alerting).
- **Live-ops content:** seasons, battle pass, leaderboards/races (the Race panel
  is stubbed), daily missions, tournaments, network progressives across titles.
- **Experimentation:** A/B framework for UI/feature tuning (never touches
  certified math versions), feature flags.
- **Reliability:** SLOs, on-call runbooks, chaos tests, backups + restore drills,
  incident review of every jackpot win over a threshold.
- **Fairness transparency:** public per-round verification portal + downloadable
  seed-epoch archives so third parties can audit historically.

---

## Cross-cutting: testing strategy

| Layer | Tooling | Gate |
|-------|---------|------|
| Engine math | `server/slot/test.js` (node) | required in CI |
| RTP / volatility | `server/slot/simulate.js` (Monte-Carlo) | nightly + on math change |
| Client↔server fairness parity | compile `src/game/*` + diff vs live rounds | required in CI |
| Types / lint | `tsc --noEmit`, ESLint | required in CI |
| Build | `next build` | required in CI |
| E2E / visual | Playwright (spin, feature, verify, mobile viewports) | Phase 1+ |
| Load | k6 / Artillery against the spin API | Phase 2+ |

## Cross-cutting: security checklist

- Server-authoritative outcomes & balances (done) · bet validation (done) ·
  per-spin max-win cap (done) · body-size guard (done).
- Add: authn/authz + RBAC (admin/RGS), rate limiting, idempotent wallet calls,
  hash-chained round ledger, input validation everywhere, secret vault + rotation,
  dependency scanning (Dependabot/Snyk), CSP + security headers, pen-test, WAF.

## Cross-cutting: performance budget

- 60fps on mid-range mobile · first-load JS < 150 kB per route · spin p99 < 150 ms
  server · texture atlas + lazy theme/asset loading · object pooling · code
  splitting · GPU-composited animation only · Redis-cached pool reads.

---

## Deployment — Docker & CI/CD

**Docker (single-origin app).** A production `Dockerfile` already exists.
`docker-compose.yml` (added with this plan) brings up **app + Postgres + Redis**
for local/staging so Phase 1 persistence drops in without infra churn:

```bash
docker compose up --build        # app on :3000, postgres:5432, redis:6379
```

**CI/CD (`.github/workflows/ci.yml`, added).** On every push/PR:
`install → tsc --noEmit → test:slot → sim (smoke) → next build`. Extend per phase
with Playwright E2E, the parity check, nightly certification sims, and staged
deploy (build image → push registry → migrate → canary → promote/rollback).
