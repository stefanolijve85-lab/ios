# 🚀 RocketRush

**The Apple of crash games.** Simple. Fast. Premium. Instantly understandable.

A mobile-first **multiplayer** crash game. Place a bet → watch the rocket rise →
cash out before it crashes. A new player understands it in 3 seconds.

This is a **real, runnable app with a real backend** — not a design concept.
An authoritative Node + Socket.io server runs one shared round clock for every
player; the Next.js client renders it. Two commands and you're playing it on
your iPhone.

---

## ⚡ Quick start (2 commands)

```bash
npm install
npm run dev          # starts BOTH the game server (:3001) and the web app (:3000)
```

Then open **http://localhost:3000** on your computer. `npm run dev` runs the
game server and the web app together — **no database, no API keys, no config.**

**It's truly multiplayer:** open the URL on your **phone and your laptop at the
same time** (same WiFi) and you'll share the exact same rocket, round, and crash —
with a live online count, shared winners feed and chat.

> **Always playable.** If the game server isn't reachable, the client
> automatically falls back to a local simulation so the game never gets stuck.
> The single-file `index.html` is a pure-local version you can open with no
> install at all.

### How it looks (iPhone 16 Pro)

| Betting / countdown | Rocket rising | Provably fair |
|---|---|---|
| ![betting](screens/01-betting.png) | ![running](screens/02-running.png) | ![fair](screens/03-fair.png) |

**Live multiplayer** — note `2 PLAYERS ONLINE` (the real shared count) and a
server-paid cashout. These are two separate browsers in one round:

| Player A (live) | Player B (same round) |
|---|---|
| ![player A](screens/05-live.png) | ![player B](screens/06-live-b.png) |

Built to match the product mockup: `ROCKET🚀RUSH` lockup, players-online pill,
space stage with planets, dominant multiplier + "FLY HIGHER, CASH OUT SOONER!",
preset bet chips, the big orange **Cash Out**, split Winners/Chat panels, and a
bottom tab bar (Game · History · Bet · Stats · Menu).

---

## 📱 Test on your iPhone (same WiFi) — the whole point

Your phone and your computer must be on the **same WiFi network**. The dev server
already listens on every network interface (`-H 0.0.0.0`), so you only need your
computer's local IP address.

### On macOS — find your local IP
- **Quickest:** hold **⌥ Option** and click the **WiFi icon** in the menu bar →
  it shows `IP Address: 192.168.x.x`.
- **Or Terminal:**
  ```bash
  ipconfig getifaddr en0     # WiFi
  # if that's empty, try: ipconfig getifaddr en1
  ```

### On Windows — find your local IP
- **Command Prompt / PowerShell:**
  ```powershell
  ipconfig
  ```
  Look under your WiFi adapter for **IPv4 Address** → `192.168.x.x`.
- One-liner (PowerShell):
  ```powershell
  (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -eq 'Dhcp'}).IPAddress
  ```

### Then, on your iPhone
Open **Safari** and go to:

```
http://YOUR_IP:3000
```

**Example:** `http://192.168.1.100:3000`

You'll see the full game. **Tap the Share button → Add to Home Screen** to install
it as a PWA — it launches full-screen like a real App Store app.

> **Provably-fair works over LAN too.** WebCrypto (`crypto.subtle`) is blocked on
> plain `http://` outside localhost, so the game ships a pure-JS SHA-256 + HMAC
> fallback that's byte-identical to WebCrypto. Verified against Node's crypto in
> `verify-fairness.mjs`.

### Troubleshooting LAN access
| Symptom | Fix |
|---------|-----|
| Page won't load on iPhone | Same WiFi? Some routers enable "AP/client isolation" — disable it, or use a phone hotspot for both devices |
| macOS firewall prompt | Allow incoming connections for `node` (you may be asked once for the web app and once for the game server) |
| Shows "Offline mode" in chat | The client couldn't reach the game server on `:3001`. Make sure `npm run dev` is running (it starts both) and that port 3001 isn't blocked by your firewall |
| Windows can't connect | Set the WiFi network to **Private**, or allow Node.js through Windows Defender Firewall |
| Wrong IP | Pick the `192.168.*` / `10.*` address, not `127.0.0.1` |

---

## ✨ What's in the prototype

Everything below works right now, client-side:

- 🚀 **Animated rocket** on a live starfield with an exhaust trail + crash explosion
- 📈 **Increasing multiplier** — the largest element on screen, color-escalates
  white → orange → purple → green as it climbs
- 🎯 **Place bet** with − / amount / + and ½ · 2× · MAX quick-picks
- 💸 **Cash Out button** — full-width, breathing glow, shows your **live return**
- 🤖 **Auto cashout** at a target multiplier (OFF · 2x · 10x presets)
- 🕒 **Recent multipliers** as color-tiered pills
- 🏆 **Recent winners** (max 10, your wins highlighted)
- 👥 **Online players** counter
- 💬 **Live chat** mockup (collapses into a tab on mobile)
- 🛡️ **Provably Fair** verifier — tap the badge to verify any round
- 🔊 Procedural sound, 🌐 6 languages, ♿ low-bandwidth mode, 📲 PWA install

Rounds are **driven by the authoritative server** (5s betting → launch → rising →
crash → repeat) and shared by everyone connected. Bots keep the room lively when
you're the only human. If the server is unreachable, the same loop runs locally.

---

## 📐 Mobile-first design (85% mobile / 15% desktop)

Designed for **iPhone 15 Pro · 16 Pro · 16 Pro Max** first. Everything fits on one
screen with **no zoom** (`viewport-fit=cover`, safe-area insets, `user-scalable=no`).

The three things that matter own the screen:

```
1. ROCKET        (hero animation)
2. MULTIPLIER    (dominant, center)
3. CASH OUT      (impossible to miss, thumb zone)
```

On mobile, Winners and Chat collapse into bottom tabs so the stage never shrinks.
On desktop (≥901px) they expand into side panels — same code, no redesign.

### Performance
- **60 FPS** via a single `requestAnimationFrame` canvas loop; the React tree
  renders **once** and never re-renders (the engine updates the DOM imperatively).
- **No heavy libraries** — Next + React + Socket.io only. No animation framework,
  no UI kit. First load ≈ **110 kB**. The 60fps loop is hand-rolled canvas.
- Low-bandwidth mode drops star/particle counts for older devices.

---

## 🗂 Folder structure

```
rocketrush/
├─ app/
│  ├─ layout.tsx          # html shell, mobile viewport + PWA metadata
│  ├─ page.tsx            # the game screen (static JSX, rendered once)
│  ├─ game-engine.ts      # client: rendering, controls, net client + local fallback
│  └─ globals.css         # design system + responsive layout (one file)
├─ server/
│  └─ game-server.mjs     # authoritative Socket.io game server (shared rounds)
├─ public/
│  ├─ manifest.webmanifest, icon.svg   # PWA install
├─ index.html             # the same game as a zero-install single file (local-only)
├─ verify-fairness.mjs    # provably-fair verifier (run: npm run verify)
├─ docs/                  # full architecture & design deliverables
├─ package.json           # scripts: dev / build / start / verify
├─ next.config.js
└─ tsconfig.json
```

### How multiplayer works (MVP)

The server (`server/game-server.mjs`) owns one round clock for everyone:
decides the crash point **before** each round (provably fair), broadcasts
`betting → start → crash`, validates every bet/cashout, and owns each player's
balance. The client connects to `http://<same-host>:3001` automatically (so your
phone reaches the server on your Mac with no config). This is the real product
loop — it maps 1:1 to the NestJS `GameGateway` in [`docs/02`](docs/02-architecture.md);
kept as plain Node + Socket.io so the whole thing runs with one command.

**Verified end-to-end** with two real browsers in one room: shared online count,
a server-paid cashout, and the client verifying a live round's crash point
against the server seed (`✓ VERIFIED`).

---

## 🧪 Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install deps |
| `npm run dev` | Start game server (:3001) **and** web app (:3000), LAN-accessible |
| `npm run dev:web` / `npm run dev:server` | Start just one side |
| `npm run build` | Production build of the web app |
| `npm run start` | Serve production web app + game server |
| `npm run verify` | Run the provably-fair verifier over 200k rounds |

## ✅ Verify fairness yourself

```bash
npm run verify
```

Runs the **same** crash algorithm the game uses across 200k rounds and prints the
distribution + house edge. In the game, tap the 🛡️ badge to verify any single
round (server seed → client seed → nonce → HMAC → crash point → ✓ VERIFIED).

---

## 🛣 Production Roadmap

This prototype is the **client of record** — the production app keeps this exact
UI and swaps the client-side simulation for an authoritative server.

| Phase | Theme | Highlights |
|-------|-------|-----------|
| **Now — MVP** | Real multiplayer | This app: authoritative Socket.io server, shared rounds, provably fair, mobile-first, PWA |
| **P1 — Harden the backend** | Production server | Port `server/game-server.mjs` to the NestJS `GameGateway` (`docs/02`), add Redis adapter + leader election for multi-node |
| **P2 — Accounts & wallet** | Real money loop | Auth + 2FA, double-entry ledger, atomic idempotent bet/cashout (`docs/03`) |
| **P3 — Scale realtime** | Concurrency | Redis Socket.io adapter, leader-elected engine, sticky WSS, HPA (`docs/04`) |
| **P4 — Data backbone** | Analytics & risk | Kafka stream → ledger, analytics, fraud, payout consumers |
| **P5 — Operator dashboard** | Ops & compliance | Online, GGR, retention, regions, round stats, white-label, i18n |
| **P6 — Trust & safety** | Integrity | Bot/fraud detection, rate limits, DDoS posture, audit logging (`docs/05`) |
| **P7 — Responsible gaming** | Compliance | Deposit/session limits, reality checks, self-exclusion, cooling-off (`docs/05`) |
| **P8 — Modular social** | Retention | Friends, clans, tournaments, seasons — **separate surfaces**, never cluttering the 3-second main screen |

Full architecture (DB schema, REST + WebSocket APIs, security, compliance,
scalability, design system, component library) lives in [`docs/`](docs/).

---

## Design principles (non-negotiable)
- **KISS.** Multiplier dominates. Cash Out is impossible to miss. Everything else
  is quieter. A new player gets it in 3 seconds.
- **Mobile-first**, one-thumb, 60 FPS, no-zoom, PWA-ready.
- **Transparent.** Every round is provably fair and independently verifiable.
- **Not Aviator.** Calmer motion, more whitespace, its own identity.
