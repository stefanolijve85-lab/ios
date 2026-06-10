# Deploying Liftoff X (public URL)

Liftoff X is **single-origin**: the Next.js app and the Socket.io game run on
one HTTP server / port (`server.mjs`), so the browser connects same-origin. That
makes it a normal single web service to deploy — no separate WebSocket host, no
CORS juggling. WebSockets work on Render and Railway out of the box.

```
Build:  npm install && npm run build
Start:  npm start            # = node server.mjs --prod  (reads $PORT)
Health: GET /
Node:   >= 18 (Dockerfile pins 20)
```

> If your repo root is the parent of `rocketrush/`, set the service **root
> directory** to `rocketrush`.

---

## Option A — Render (recommended, free tier)

**Easiest (Blueprint):**
1. Push this repo to GitHub.
2. Render → **New → Blueprint** → select the repo. It reads `render.yaml`
   (web service, build + start commands, health check).
3. Click **Apply**. First build takes a few minutes; you get a URL like
   `https://rocketrush.onrender.com`.

**Manual (no Blueprint):**
1. Render → **New → Web Service** → connect the repo.
2. Environment **Node**. Root directory `rocketrush` (if applicable).
3. Build `npm install && npm run build` · Start `npm start` · Health check `/`.
4. Create. Done.

> Render's **free** plan sleeps after ~15 min idle, so the first hit after idle
> is a cold start (a few seconds). Fine for a tester build; use a paid instance
> for an always-on demo.

## Option B — Railway

1. Railway → **New Project → Deploy from GitHub repo**.
2. Railway auto-detects Node (Nixpacks) — or it uses the included `Dockerfile`.
   Ensure **Build** = `npm run build` and **Start** = `npm start` (root dir
   `rocketrush` if needed).
3. **Settings → Networking → Generate Domain** to get a public HTTPS URL.

## Option C — any Docker host (Fly.io, a VPS, etc.)

A `Dockerfile` is included:
```bash
docker build -t rocketrush ./rocketrush
docker run -p 3000:3000 -e PORT=3000 rocketrush
```

---

## Environment variables

| Var | Where | Needed for |
|-----|-------|-----------|
| `PORT` | set by the host | the server binds it automatically |
| `NODE_ENV=production` | host | production build/runtime |
| `NEXT_PUBLIC_SUPABASE_URL` | **build + runtime** | accounts (client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **build + runtime** | accounts (client) |
| `SUPABASE_URL` | runtime | accounts (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime (secret) | accounts (server) |
| `CANONICAL_HOST` | runtime (optional) | host the redirect points to (default `www.liftoffx.com`) |
| `REDIRECT_HOSTS` | runtime (optional) | comma list redirected → canonical (default `liftoffx.com,liftoffx.nl,www.liftoffx.nl`) |

## Custom domain (production: www.liftoffx.com)

The production URL is **https://www.liftoffx.com**. Wiring:
1. **Render → Settings → Custom Domains**: add `liftoffx.com` and `www.liftoffx.com`.
   Render auto-redirects the apex to `www`, so **`www` is the canonical host**.
2. **DNS at the registrar (Hostnet)**: `liftoffx.com` → **A** record to Render's IP
   (`216.24.57.1`); `www.liftoffx.com` → **CNAME** to the service's `…onrender.com`
   host. Remove any default A/AAAA record that points the root elsewhere.
3. The server sends the bare `liftoffx.com` (if it reaches the app) and the `.nl`
   variants to `https://www.liftoffx.com` with a 301 (see `server.mjs`; tune via
   `CANONICAL_HOST` / `REDIRECT_HOSTS`). Never list the canonical host itself.

**Without Supabase vars the public build runs in guest mode** — fully playable,
shareable, and great for a tester round. The `NEXT_PUBLIC_*` values are inlined
at **build time**, so they must be present *before* `npm run build` runs.

## Data persistence on hosts

- **Accounts (Supabase):** balances, stats, history and transactions live in
  Supabase Postgres → **persist across restarts and redeploys**. ✅
- **Guest + leaderboard/social JSON** (`server/.data/*`): on the container's
  **ephemeral** filesystem, so they reset on restart/redeploy (and Render free
  has no persistent disk). That's expected for a demo. For durable global data,
  enable Supabase accounts (or attach a persistent disk / move the social tables
  to Postgres — a small future step).

## Share with testers

Send testers the URL — it works on iPhone Safari (Add to Home Screen for a
full-screen PWA). Because rounds are server-authoritative and shared, everyone
who opens it is in the **same live round**, with a shared online count, activity
feed and leaderboard.
