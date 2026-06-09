# 8, 9, 15 · WebSocket Architecture, Folder Structure & Full Source Tree

Tech stack (as specified): **Next.js · TypeScript · TailwindCSS · Framer Motion
· Socket.io** (frontend) and **NestJS · PostgreSQL · Redis · Kafka** (backend),
on **Docker · Kubernetes · Cloudflare · AWS**.

---

<a id="websocket"></a>
## WebSocket / Realtime Architecture

### Why authoritative server
The crash point is decided **server-side, before the round**, and the multiplier
is a deterministic function of elapsed time. Clients **render**; they never
decide outcomes. A client only ever sends "I cashed out at T" — the server
validates T against the round clock and the pre-committed crash point. This kills
the entire class of multiplier/cash-out cheats.

### Round state machine (server-owned, one per game shard)
```
            5s                  until crashAt              3s
  BETTING ─────────▶ RUNNING ───────────────────▶ CRASHED ────▶ BETTING
   │ accept bets      │ broadcast tick @ 60Hz       │ settle losers
   │ lock at T-0      │ accept cashouts             │ reveal serverSeed
   └ publish seedHash └ auto-cashout engine         └ push history
```

### Socket.io event contract
**Server → client** (room `game:default`):
| Event | Payload | When |
|-------|---------|------|
| `round:betting` | `{ roundId, serverSeedHash, nonce, startsInMs }` | new betting phase |
| `round:start` | `{ roundId, startedAt }` | rocket launches |
| `round:tick` | `{ multiplier, elapsedMs }` | ~20–30Hz, client interpolates to 60fps |
| `round:crash` | `{ roundId, crashPoint, serverSeed }` | crash + seed reveal |
| `bet:confirmed` | `{ betId, amount, autoCashout }` | your bet accepted |
| `cashout:confirmed` | `{ betId, multiplier, payout }` | your cashout settled |
| `players:online` | `{ count }` | throttled, every ~2s |
| `winner` | `{ name, multiplier, amount }` | someone cashed out (for feed) |
| `chat:msg` | `{ user, text, ts }` | moderated chat |

**Client → server:**
| Event | Payload | Server validation |
|-------|---------|-------------------|
| `bet:place` | `{ amount, autoCashout? }` | phase==betting, balance≥amount, limits ok |
| `bet:cancel` | `{ betId }` | phase==betting only |
| `cashout` | `{ betId }` | phase==running, not crashed, not already cashed |
| `chat:send` | `{ text }` | rate-limited, profanity + spam filtered |

### Tick strategy (60 FPS without flooding the network)
Server emits the **authoritative** multiplier ~20–30×/s. The client knows
`startedAt` and the growth function, so it renders at 60fps by computing
`multiplier = e^(k·elapsed)` locally and **snaps to server ticks** to correct
drift. Result: buttery animation, ~1/3 the bandwidth, no client authority over
outcome.

### Horizontal scale (the realtime tier)
```
                       ┌── Socket.io node 1 ─┐
  Cloudflare ─ ALB ────┼── Socket.io node 2 ─┼── Redis adapter (pub/sub) ── Game Engine (leader)
   (WSS, sticky)       └── Socket.io node N ─┘        ▲                          │
                                                       └── round events fan-out ──┘
```
- **Redis Pub/Sub adapter** broadcasts round events to every Socket.io node, so
  any node can serve any player. Nodes are stateless and autoscale on connection
  count.
- A **single Game Engine** instance per game variant owns the round clock
  (leader-elected via Redis lock); it publishes round events and consumes
  cashouts. This keeps the authoritative timeline singular and simple.
- **Kafka** carries the durable event stream (bets, cashouts, round results) to
  the ledger, analytics, fraud, and operator-dashboard consumers — decoupled
  from the hot path.

---

<a id="folders"></a>
## Full Source Code Structure (production)

Monorepo (Turborepo + pnpm). The `index.html` demo in this repo is the visual +
engine reference that `apps/web` is built to match.

```
rocketrush/
├─ apps/
│  ├─ web/                       # Next.js 14 (App Router) player client
│  │  ├─ app/
│  │  │  ├─ (game)/page.tsx      # main game screen
│  │  │  ├─ fair/page.tsx        # provably-fair verification page
│  │  │  └─ layout.tsx
│  │  ├─ components/             # 1:1 with the Component Library (docs/01)
│  │  │  ├─ stage/{Stage,Rocket,Starfield,HistoryPills}.tsx
│  │  │  ├─ controls/{ActionButton,BetStepper,AutoCashout}.tsx
│  │  │  ├─ social/{WinnersList,Chat,OnlinePill}.tsx
│  │  │  └─ modals/{ProvablyFairModal,SettingsModal}.tsx
│  │  ├─ lib/
│  │  │  ├─ socket.ts            # Socket.io client + reconnect/backoff
│  │  │  ├─ game-store.ts        # Zustand store (phase, mult, bet…)
│  │  │  ├─ fairness.ts          # client-side verifier (shared pkg)
│  │  │  └─ i18n/                # locale bundles
│  │  ├─ public/manifest.webmanifest, sw.ts   # PWA
│  │  └─ tailwind.config.ts      # design tokens from docs/01
│  │
│  ├─ api/                       # NestJS backend
│  │  └─ src/
│  │     ├─ game/                # round engine + state machine
│  │     │  ├─ game.gateway.ts   # Socket.io gateway (event contract above)
│  │     │  ├─ game.engine.ts    # authoritative round loop (leader)
│  │     │  ├─ crash.service.ts  # provably-fair crash generation
│  │     │  └─ cashout.service.ts
│  │     ├─ wallet/              # balances, atomic debit/credit, ledger
│  │     ├─ bets/                # place/cancel/settle, history
│  │     ├─ fairness/            # seed lifecycle, hash publish/reveal, verify
│  │     ├─ auth/                # sessions, 2FA, JWT, device fingerprint
│  │     ├─ chat/                # gateway + moderation
│  │     ├─ rg/                  # responsible gaming (limits, self-exclusion)
│  │     ├─ risk/                # fraud/bot scoring (Kafka consumer)
│  │     └─ common/              # guards, rate-limit, audit interceptor
│  │
│  ├─ operator/                  # Next.js operator dashboard (separate app, RBAC)
│  │  └─ app/{online,bets,ggr,retention,regions,rounds,theme,whitelabel,i18n}/
│  └─ jobs/                      # Kafka consumers: ledger, analytics, fraud, payouts
│
├─ packages/
│  ├─ fairness/                  # the ONE crash algorithm (client+server+verifier)
│  ├─ ui/                        # shared design-system primitives + tokens
│  ├─ contracts/                 # shared TS types + zod schemas for WS/REST
│  └─ config/                    # eslint, tsconfig, tailwind preset
│
├─ infra/
│  ├─ docker/                    # Dockerfiles per app
│  ├─ k8s/                       # Helm charts: web, api(HPA on conns), engine, jobs
│  └─ terraform/                 # AWS: EKS, RDS(PG), ElastiCache(Redis), MSK(Kafka)
│
├─ docs/                         # ← you are here
└─ turbo.json / pnpm-workspace.yaml
```

### Key architectural decisions
- **One fairness package** imported by client, server, and the CLI verifier —
  there is literally one implementation of the crash math, so client and server
  can never disagree. (Mirrored in this repo by `verify-fairness.mjs` matching
  the `index.html` engine.)
- **`packages/contracts`** is the single source of truth for every socket
  payload and REST body (zod-validated at the boundary), shared by both ends.
- **Operator dashboard is a separate app** behind its own auth + RBAC — never
  shipped to or reachable by players.
- **Wallet writes are atomic & idempotent** (DB transaction + ledger row),
  outboxed to Kafka so analytics/fraud never block a cashout.
