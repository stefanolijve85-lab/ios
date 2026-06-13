# 🏦 STASH — the next-evolution crash game

> Fill the vault. **Lock your winnings.** Or lose it all when the thieves break in.

STASH takes the proven *crash* mechanic and disguises it inside a universally
understood fantasy: **a vault is rapidly filling with money — secure it now, or
risk everything for more.** Understandable in 3 seconds, impossible to put down.

Built **mobile-first**, **multiplayer by default**, **server-authoritative**, and
**white-label / RGS-ready** from day one.

---

## ✨ What's in the MVP

- **Server-authoritative crash engine** — provably-fair-style crash points, a
  single shared multiplier curve, anti-cheat by design (clients never decide
  outcomes).
- **Real multiplayer** over **Socket.io** — live online count, live "still
  holding" counter, live chat, live activity feed, all synced across players.
- **The vault** — circular brass/gunmetal door, a money pile that grows in real
  time, neon-green cash glow, gold reflections, the multiplier ladder.
- **The STASH button** — massive, green, pulsing, context-aware (place bet →
  STASH → result), with an optional **second bet panel**.
- **Thief timer** that turns red, alarms that fire, and a fast **heist crash
  animation**.
- **Adaptive tension audio** (Web Audio API, no asset files) — one electronic
  motif that climbs in pitch + tempo with the multiplier, glitches on crash.
- **60fps** local animation driven from a server-synced clock (the server
  doesn't stream every frame — it streams the truth, the client interpolates).
- **iPhone Safari–first** layout: safe-area aware, one-thumb usable, no zoom.

---

## 🏗 Architecture (single origin)

```
Browser (Next.js / React / TS)  ──HTTP──┐
                                        ├──►  server.js  (one Node process, one port)
Browser  ◄──WebSocket (Socket.io)───────┘        ├── Next.js request handler
                                                  └── Socket.io  + Game engine
```

The **same Node server** (`server.js`) serves the web app **and** the realtime
socket layer. One origin, one port → trivial to deploy and zero cross-origin
websocket pain on iOS Safari.

```
stash/
├─ server.js              # custom server: Next.js + Socket.io on one port
├─ server/
│  ├─ game.js             # server-authoritative round lifecycle + crash math
│  ├─ bots.js             # crowd sim: live chat + activity feed
│  └─ config.js           # single source of game tuning
├─ src/
│  ├─ app/                # Next.js App Router (layout, page, globals.css)
│  ├─ components/         # Vault, BetPanel (STASH), ThiefTimer, chat, etc.
│  ├─ hooks/useGame.tsx   # socket wiring, server-clock sync, 60fps multiplier
│  └─ lib/                # types, constants (shared curve), audio, formatting
├─ Dockerfile / .dockerignore
└─ render.yaml
```

### Game loop
1. **Vault open (betting, 5s)** — place one or two bets.
2. **Vault closes, cash climbs** — multiplier accelerates (`m(t) = e^{0.21·t}`).
3. **STASH** to lock `stake × multiplier`.
4. Wait too long → **THIEVES BREAK IN** and everything in the vault is gone.
5. New round starts within ~2.5s.

Crash points use a `(1 − houseEdge) / (1 − r)` heavy-tailed distribution with a
~3% instant-bust chance, capped to the 15s round window. Tune everything in
`server/config.js`.

---

## 🚀 Run locally

```bash
cd stash
npm install
npm run dev          # http://localhost:3000  (dev: Next + Socket.io)
```

Production mode:

```bash
npm run build
npm start            # serves the built app + sockets on $PORT (default 3000)
```

Open the URL on your phone (same Wi-Fi: `http://<your-ip>:3000`) to feel it on
real glass.

---

## ☁️ Deploy to Render (recommended)

The repo ships a **`render.yaml` Blueprint**.

1. Push this code to GitHub.
2. Render → **New +** → **Blueprint** → select the repo.
   - If `stash/` is a subfolder, set **Root Directory** to `stash` (and
     uncomment `rootDir: stash` in `render.yaml`).
3. Render runs `npm install && npm run build`, then `npm start`.
4. Done — your public URL (e.g. `https://stash-crash-game.onrender.com`) is
   playable on iPhone Safari immediately.

> Render injects `PORT`; `server.js` already binds `0.0.0.0:$PORT`.
> Websockets work out of the box on Render web services.

### Railway

1. New Project → Deploy from GitHub repo.
2. Root directory `stash` (if monorepo). Build `npm install && npm run build`,
   start `npm start`. Railway provides `PORT` automatically.

### Docker (anywhere)

```bash
cd stash
docker build -t stash .
docker run -p 3000:3000 stash
# → http://localhost:3000
```

---

## 🗺 Roadmap

| Phase | Scope |
|------|-------|
| 1 | **Demo (this MVP)** — playable, multiplayer, public URL |
| 2 | Accounts + persistence |
| 3 | RGS architecture (bet/settle, audit, provably-fair seeds exposed) |
| 4 | Operator dashboard |
| 5 | Aggregator integrations |
| 6 | Certification |

White-labelling: theme tokens live in `src/app/globals.css` (`:root`), game
tuning in `server/config.js` — an operator can reskin without touching logic.

---

## ⚠️ Note

This is a **demo / entertainment build** using play-money balances held in
memory. It is **not** a real-money gambling product and ships without accounts,
KYC, RNG certification, or responsible-gaming controls — all of which are
required (and scoped in the roadmap) before any real-money use.
