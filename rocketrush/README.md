# 🚀 RocketRush

**The Apple of crash games.** Simple. Fast. Premium. Instantly understandable.

A mobile-first multiplayer crash game prototype. Place a bet → watch the rocket
rise → cash out before it crashes. A new player understands it in 3 seconds.

This is a **real, runnable Next.js app** — not a design concept. Two commands and
you're playing it on your iPhone.

---

## ⚡ Quick start (2 commands)

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** on your computer.
Rounds are generated client-side — **no backend, no database, no API keys.**

> Already have it open and just want to glance at it without installing anything?
> Open `index.html` directly in a browser — it's the exact same game in one file.

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
| macOS firewall prompt | Allow incoming connections for `node` |
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

The game **simulates real rounds** (5s betting → launch → rising → crash → repeat)
with simulated other players, so it feels multiplayer with zero infrastructure.

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
- **No heavy libraries** — just Next + React. No animation framework, no socket
  client, no UI kit. First load ≈ **96 kB**, page chunk ≈ **9 kB**.
- Low-bandwidth mode drops star/particle counts for older devices.

---

## 🗂 Folder structure

```
rocketrush/
├─ app/
│  ├─ layout.tsx          # html shell, mobile viewport + PWA metadata
│  ├─ page.tsx            # the game screen (static JSX, rendered once)
│  ├─ game-engine.ts      # round loop, provably-fair, simulated multiplayer
│  └─ globals.css         # design system + responsive layout (one file)
├─ public/
│  ├─ manifest.webmanifest, icon.svg   # PWA install
├─ index.html             # the same game as a zero-install single file
├─ verify-fairness.mjs    # provably-fair verifier (run: npm run verify)
├─ docs/                  # full architecture & design deliverables
├─ package.json           # scripts: dev / build / start / verify
├─ next.config.js
└─ tsconfig.json
```

---

## 🧪 Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install deps (Next + React only) |
| `npm run dev` | Dev server on `0.0.0.0:3000` (LAN-accessible) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on `0.0.0.0:3000` |
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
| **Now — Prototype** | Feel & fairness | This app: real loop, provably fair, mobile-first, PWA |
| **P1 — Real backend** | Authoritative rounds | NestJS game server owns the crash point + clock; client renders. Socket.io contract in `docs/02` |
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
