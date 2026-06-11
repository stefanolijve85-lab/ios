# 🌉 Glass Bridge — Cross. Choose. Cash Out.

A **provably-fair multiplier casino game** set on a futuristic glass air-bridge
above a neon city. Place a bet, then jump **left or right** across a bridge of
glass tiles. Every safe step raises your multiplier; one wrong step on armed
glass and it shatters. Cash out whenever you dare.

> **Original IP only.** The theme, the little explorer bot "Aero", the art and
> all copy are original — no third-party characters, logos, music or other
> protected material are used.

| | |
|---|---|
| **Stack** | React + TypeScript + Vite + Tailwind + Zustand + Framer Motion · Node + Express + Socket.IO + PostgreSQL + JWT · Vitest + Playwright |
| **Fairness** | SHA-256 commitment + HMAC-SHA256 per row, verifiable in-browser and via a zero-dependency CLI |
| **Deploy** | Docker / Docker Compose · Render Blueprint · GitHub Actions CI/CD |

---

## ⚡ Quick start (zero config)

The game runs with **no database** out of the box (in-memory store, data resets
on restart) so you can play in two terminals immediately:

```bash
cd glass-bridge
npm run install:all          # installs server + client deps

# terminal 1 — backend (Express + Socket.IO) on :4000
npm run dev:server

# terminal 2 — frontend (Vite) on :5173 (proxies /api + /socket.io to :4000)
npm run dev:client
```

Open **http://localhost:5173**, sign up (you get a demo balance) and play.

### With PostgreSQL persistence

```bash
cp server/.env.example server/.env       # then set DATABASE_URL + secrets
cd server && npm run migrate && npm run seed   # schema + admin/demo accounts
npm run dev
```

### One-command production-like stack (Docker)

```bash
cd glass-bridge
docker compose up --build      # Postgres + single-origin app on :4000
```

Open **http://localhost:4000** (the backend serves the built client).

---

## 🎮 How it plays

1. **Bet** — enter a stake and press *BET*. The server commits a hashed server
   seed and debits your stake.
2. **Jump** — pick **LEFT** or **RIGHT** each row. Safe glass advances you and
   raises the multiplier; armed glass shatters and ends the round.
3. **Cash out** — bank `stake × current multiplier` any time before your next
   jump. Reach the final row and you auto-cash at the top multiplier.

Default ladder (fully configurable in the admin panel):

`1.03× 1.08× 1.15× 1.24× 1.36× 1.51× 1.70× 1.95× 2.30× 2.80× 3.50× 4.50×`

---

## 🔐 Provably Fair

Each round is committed before you play and revealed after, so you can prove it
was not altered:

- **Server seed** — random, its **SHA-256 hash is shown up front**, the seed is
  revealed when the round ends.
- **Client seed** — yours to set (auto-generated if blank).
- **Nonce** — increments every round.

Per row: `HMAC-SHA256(serverSeed, clientSeed:nonce:row)` fixes the rigged side
and whether the trap is armed. Verify any round three ways:

- in the browser on the **/verify** page (Web Crypto, trust nothing),
- via the API: `POST /api/verify` or `GET /api/verify/:roundId`,
- on the CLI: `cd server && node verify-fairness.mjs <serverSeed> <clientSeed> <nonce>`.

The model and RTP math are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🧪 Tests

```bash
cd server && npm test        # Vitest: provably-fair + engine (14 tests)
cd server && npm run verify  # provably-fair self-test + RTP simulation
cd client && npm run build   # type-check + production bundle
npm run e2e                  # Playwright smoke tests (build the client first)
```

CI runs the server tests, the fairness self-test and the client build on every
push/PR (`.github/workflows/ci.yml`).

---

## 🚀 Deploy to Render

This repo ships a **Render Blueprint** (`render.yaml`): a managed PostgreSQL
database + one single-origin Docker web service (API + Socket.IO + client).

1. Push to GitHub.
2. Render → **New → Blueprint** → select the repo (root dir `glass-bridge`).
3. Set the `sync: false` env vars in the dashboard: **`ADMIN_USERNAME`**,
   **`ADMIN_PASSWORD`** (`JWT_SECRET` and `DATABASE_URL` are generated/linked
   automatically).
4. Deploy. The `preDeployCommand` runs migrations + the idempotent seed, so the
   admin account exists and the app is **immediately playable** at the public
   HTTPS URL Render assigns.

HTTPS/SSL is automatic on Render. For a custom domain, add it in the service's
**Settings → Custom Domains** and Render provisions the certificate; force-SSL
is on by default.

**CI/CD:** add a Render *Deploy Hook* URL as the `RENDER_DEPLOY_HOOK_URL` repo
secret and the `deploy` job triggers a deploy after tests pass on `main` (Render
`autoDeploy` also redeploys on push).

> **Scaling Socket.IO:** a single instance is fine here. To run several, add a
> Redis instance + `@socket.io/redis-adapter` (see `docs/ARCHITECTURE.md`).

---

## 🔧 Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `PORT` | server | `4000` | HTTP port |
| `NODE_ENV` | server | `development` | `production` serves the built client |
| `JWT_SECRET` | server | dev default | **Change in production** (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | server | `7d` | Token lifetime |
| `CORS_ORIGIN` | server | `*` | Comma-separated allowed origins |
| `DATABASE_URL` | server | _unset_ | Postgres connection; unset → in-memory |
| `PGSSL` | server | `true` | `false` for local Postgres |
| `STARTING_BALANCE` | server | `1000` | New-account demo balance |
| `MIN_BET` / `MAX_BET` / `MAX_PAYOUT` | server | `0.1` / `1000` / `100000` | Limits |
| `HOUSE_EDGE` | server | `0.02` | Per-step edge folded into break odds |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` | seed | `admin` / `change-me-now` | Seeded admin account |
| `CLIENT_DIR` | server | `../../client/dist` | Static client path (Docker uses `public`) |
| `VITE_API_PROXY` | client | `http://localhost:4000` | Dev/preview proxy target |

---

## 📁 Project structure

```
glass-bridge/
├── client/                 React + Vite + Tailwind frontend
│   └── src/
│       ├── components/     BridgeBoard, Character, BetPanel, SocialPanel, …
│       ├── pages/          GamePage, VerifyPage, AdminPage
│       ├── store/          Zustand store
│       └── lib/            api, socket, provablyFair (Web Crypto mirror), sound
├── server/                 Express + Socket.IO backend
│   ├── src/
│   │   ├── game/           provablyFair, engine, service, config
│   │   ├── routes/         auth, game, social, admin
│   │   ├── socket/         chat + live feed
│   │   ├── db/             store (postgres | memory), migrate, seed
│   │   ├── lib/ middleware/ auth, env, validation, rate limiting
│   │   └── index.ts        single-origin entry
│   ├── migrations/         SQL migrations
│   ├── tests/              Vitest unit/integration tests
│   └── verify-fairness.mjs zero-dependency reference verifier
├── e2e/                    Playwright smoke tests
├── docs/                   API.md, ER-DIAGRAM.md, ARCHITECTURE.md
├── Dockerfile · docker-compose.yml · render.yaml
└── .github/workflows/ci.yml
```

---

## 🛡️ Security

JWT auth (bcrypt password hashing) · Zod input validation · `helmet` headers ·
per-route rate limiting · chat anti-spam + temporary mutes · parameterised SQL
(no injection) · output sanitisation (no XSS in chat) · audit log of admin
actions and registrations. Set a strong `JWT_SECRET` and real `ADMIN_PASSWORD`
before any public deployment.

## 📜 Responsible play

This is an entertainment project with demo balances. If you adapt it for real
funds, comply with your jurisdiction's licensing and responsible-gambling
requirements.
