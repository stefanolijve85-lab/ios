# Glass Bridge — Architecture

## Overview

```
                         ┌───────────────────────────────────────────┐
   Browser (React)       │  Node server (Express + Socket.IO)         │
 ┌───────────────────┐   │                                            │
 │ Zustand store     │   │  /api/auth      JWT auth (bcrypt)          │
 │ Framer Motion UI  │◄──┤  /api/game      authoritative round engine │
 │ Web Crypto verify │REST│ /api/leaderboards, /api/verify            │
 │ socket.io-client  │◄──┤  /api/admin     RTP / users / moderation   │
 └───────────────────┘ WS │  socket.io      chat + live win feed       │
                          │        │                                   │
                          │        ▼                                   │
                          │  Store (PostgreSQL │ in-memory fallback)   │
                          └───────────────────────────────────────────┘
```

In **production** the server also serves the built client as static files, so
the whole app runs as a **single origin / single web service** — no CORS, no
second port, WebSockets on the same host.

## Why the server is authoritative

The client never decides outcomes or moves money. The server:

1. Generates a random `serverSeed` and publishes only its **SHA-256 hash** when
   a round starts (commitment).
2. Validates the bet against the player's balance and **debits it up front**.
3. Resolves every jump against the committed layout and only credits payouts on
   a successful cash-out.
4. Reveals the `serverSeed` after the round so the player can verify it in their
   own browser (`client/src/lib/provablyFair.ts`) or with the zero-dependency
   `verify-fairness.mjs` CLI.

The same provably-fair algorithm exists in three places that must stay in sync:
`server/src/game/provablyFair.ts`, `client/src/lib/provablyFair.ts`, and
`server/verify-fairness.mjs`.

## The game model

Glass Bridge is **single-player paced** (each player walks their own bridge),
unlike a shared-clock crash game. Per row `n`:

```
h        = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${n}`)
trapSide = (nibble0(h) & 1) ? RIGHT : LEFT
roll     = float in [0,1) from 52 bits of h
armed    = roll < armProb(n),  armProb(n) = min(1, 2 * breakProb(n))
```

A player FALLS only if `armed && pick === trapSide`. Because `trapSide` is
50/50 and unknowable, a uniformly-choosing player's effective per-row break
chance is exactly `breakProb(n)` — so the **left/right choice genuinely changes
the result** (a different pick can save you) yet the long-run RTP is fixed.

`breakProb(n)` is derived from the configurable multiplier ladder so that
`EV(cash out at row n) = (1 - houseEdge)^n`. See `deriveBreakProbabilities()`.

## State management

- **Server:** live rounds live in a `Map<userId, ActiveRound>` (only one active
  round per player). Finalized rounds, users, chat and audit go to the store.
- **Client:** a single Zustand store holds auth, balance, config and round
  state; Socket.IO drives chat, the live win feed and presence.

## Scaling notes

A single web service handles chat + the win feed fine at small/medium scale. To
run multiple server instances, add Redis and the `@socket.io/redis-adapter` so
Socket.IO broadcasts fan out across instances; the game engine itself is
per-player and already horizontally safe once rounds are persisted.
