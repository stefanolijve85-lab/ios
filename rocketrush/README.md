# 🚀 RocketRush

**The Apple of crash games.** Simple. Fast. Premium. Instantly understandable.

A production-architecture multiplayer crash game. Place a bet → watch the rocket
rise → cash out before it crashes. A new player understands it in 3 seconds.

---

## ▶️ Play the demo right now

The entire game runs in a single file — **no build, no backend, no install.**

```bash
# any of these:
open index.html                 # macOS
xdg-open index.html             # Linux
start index.html                # Windows

# or serve it (recommended, enables PWA install):
npx serve .      # then open http://localhost:3000
```

The demo is fully playable: real round loop, rising multiplier, manual + auto
cashout, live return, recent winners, live chat, players-online, multiplier
history pills, sound, 6 languages, and a working **Provably Fair** verifier
(tap the 🛡️ badge).

> The demo simulates other players client-side so it runs with zero
> infrastructure. In production the exact same UI is driven by the NestJS game
> server over Socket.io — see [`docs/`](docs/).

## ✅ Verify fairness yourself

```bash
node verify-fairness.mjs
```

Runs the **identical** crash algorithm used by the client and server across
200k rounds and prints the distribution + house edge. The browser modal lets
you verify any individual round (server seed, client seed, nonce → HMAC → crash
point).

---

## What's in here

| File | What it is |
|------|------------|
| `index.html` | The complete, playable game (UI + engine + simulated multiplayer) |
| `verify-fairness.mjs` | Reference provably-fair verifier (Node, no deps) |
| `manifest.webmanifest`, `icon.svg` | PWA install support |
| [`docs/`](docs/) | All 15 architecture & design deliverables |

## The 15 deliverables

1. Complete UI Design → `docs/01-design.md`
2. Mobile Design → `docs/01-design.md#mobile`
3. Desktop Design → `docs/01-design.md#desktop`
4. Design System → `docs/01-design.md#design-system`
5. Component Library → `docs/01-design.md#components`
6. Database Schema → `docs/03-data-and-api.md#schema`
7. API Documentation → `docs/03-data-and-api.md#rest-api`
8. WebSocket Architecture → `docs/02-architecture.md#websocket`
9. Folder Structure → `docs/02-architecture.md#folders`
10. MVP Roadmap → `docs/04-roadmap.md#mvp`
11. Production Roadmap → `docs/04-roadmap.md#production`
12. Scalability Plan → `docs/04-roadmap.md#scalability`
13. Security Architecture → `docs/05-security-compliance.md#security`
14. Compliance Architecture → `docs/05-security-compliance.md#compliance`
15. Full Source Code Structure → `docs/02-architecture.md#folders`

Provably Fair deep-dive → `docs/06-provably-fair.md`

---

## Design principles (non-negotiable)

- **KISS.** The multiplier dominates the screen. The Cash Out button is
  impossible to miss. Everything else has less visual weight.
- **Mobile-first**, one-thumb usable, 60 FPS, low-bandwidth mode, PWA-ready.
- **Transparent.** Every round is provably fair and independently verifiable.
- **Not Aviator.** Cleaner layout, calmer motion, more whitespace, own identity.
