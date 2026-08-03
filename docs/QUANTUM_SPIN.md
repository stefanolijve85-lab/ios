# QUANTUM SPIN — a next-generation, provably-fair cyberpunk video slot

QUANTUM SPIN is a premium, mobile-first online video slot built on the same
single-origin Next.js + Node/Socket.io server that powers the crash titles in
this repo. It is **server-authoritative** and **provably fair** end to end: the
client never decides an outcome or edits a balance, and any player can re-derive
any round in their own browser with zero trust in the server.

Play it at **`/quantum`**. Verify any round at **`/quantum/verify`**.

---

## 1. What's built and working

| Area | Status |
|------|--------|
| Server-authoritative spin engine (5×3, 25 lines) | ✅ tuned to **96% RTP** (measured 96.3% over 2M spins) |
| Weighted "random-symbol-generator" reels, configurable RTP bands (92/94/96/97) | ✅ |
| Wilds (mid-reel weighted) + Quantum Portal **scatter → free spins** | ✅ |
| **Quantum Reactor** tumbles/cascades with a rising multiplier ladder | ✅ |
| **Quantum Vault** four-tier progressive jackpot (Mini/Minor/Major/Grand) | ✅ live pools over websockets |
| **Buy Feature** (Quantum Portal) | ✅ |
| Provably-fair **commit–reveal** + client-side verifier + REST verify | ✅ 80/80 client↔server parity test |
| Web Audio adaptive sound engine (fully synthesised, zero audio files) | ✅ |
| **AssetManager** (avif/webp/png/svg + neon-glyph fallback) | ✅ drop art in, no code change |
| **Theme Engine** (skins are pure config; ships Quantum Spin + Neon Samurai) | ✅ |
| Mobile-first premium UI (Framer-ready CSS, 60fps DOM/GPU compositing) | ✅ |
| RTP simulator + engine test suite (13 tests) | ✅ `npm run sim` / `npm run test:slot` |
| Play-money balance, XP/levels, daily reward, missions/rewards/race panels | ✅ |

Everything above is real, tested code — no placeholders, no mock outcomes.
See §7 for what the phased plan (`DEVELOPMENT_PLAN.md`) migrates next (PixiJS
renderer, Postgres/Prisma, Redis progressives, admin CMS, CI/CD hardening).

---

## 2. Architecture

```
Browser (Next.js / React)                      Node single-origin server
────────────────────────────                   ─────────────────────────────
/quantum  ── SlotProvider ─┐                    server.js
   useSlot (choreography)  │  HTTP  /api/slot/* ─► server/slot/api.js
   renders server results  │  ───────────────►    ├─ session.js  (balance, seeds,
   NEVER computes money     │                      │   nonce, free spins, history)
                            │                      ├─ engine.js   (pure spin maths)
/quantum/verify ───────────┘                      ├─ rng.js      (HMAC stream)
   src/game/engine.ts (port)   WS /quantum-       ├─ fairness.js (commit–reveal)
   re-derives rounds locally   jackpots  ◄──────  ├─ pools.js    (progressives)
                               (ticker only)      └─ config.js   (symbols, paytable,
                                                       reels, RTP bands, jackpots)
```

- **Spins are HTTP** request/response transactions (a slot spin is discrete).
- **Websockets are used only** to push the live progressive-jackpot ticker —
  exactly the "websockets for UI/status sync only" rule in the brief.
- The **money maths lives in one place** (`server/slot/`) and is mirrored, for
  verification only, in `src/game/` (TypeScript). The parity test keeps them
  byte-for-byte identical.

### File map

```
server/slot/
  config.js      game config: symbols, paytable, reels, RTP bands, jackpots, bet
  rng.js         ProvablyFairRNG — deterministic HMAC-SHA256 byte stream
  fairness.js    commit–reveal helpers (SHA-256)
  engine.js      spin(): grid → lines → tumbles → scatter/FS → jackpot (pure)
  session.js     per-player state; the ONLY place balances change
  pools.js       shared progressive jackpot pools
  api.js         HTTP router (mounted in server.js before Next.js)
  simulate.js    RTP/volatility Monte-Carlo (npm run sim)
  test.js        engine test suite (npm run test:slot)

src/game/        client mirror + presentation
  config.ts engine.ts rng.ts fairness.ts   (verification port — see §4)
  types.ts api.ts assets.ts audio.ts format.ts
  theme.ts       Theme Engine (SlotTheme + quantumspin + neonsamurai skins)

src/hooks/useSlot.tsx           game controller (choreography, autoplay, feature)
src/components/slot/*           HUD, reels, jackpots, controls, overlays, sheets
src/app/quantum/page.tsx        the game
src/app/quantum/verify/page.tsx trustless verifier
```

---

## 3. Game math

- **Layout:** 5 reels × 3 rows, 25 fixed paylines (left→right). 5×4 and a 6×5
  "ways" layout are defined in config and selectable per build.
- **Reels:** each visible cell is an independent weighted draw ("random symbol
  generator" reel), the standard model for modern tumble/reactor slots. Weights
  fix the game's *shape* (hit rate, feature frequency, volatility).
- **RTP band:** the certified return is set by a single **paytable scalar** per
  band (92/94/96/97). Reel weights never change between bands, so a different
  RTP version pays differently but *feels* identical — how studios ship multiple
  certified versions of one game. Base game measured **96.3%** at the 96 band.
- **Wilds** substitute every paying symbol except the Portal; richer on reels
  2–4.
- **Quantum Portal (scatter):** 3/4/5 pay 1×/5×/20× total bet and award 8/12/15
  free spins; retriggers add 5. The multiplier ladder runs hotter in the feature.
- **Quantum Reactor (tumbles):** winning symbols detonate, survivors fall,
  the grid refills, and each tumble climbs the multiplier ladder
  (base `1,2,3,5`; free spins `2,3,5,8,12`).
- **Quantum Vault (jackpots):** a **separately-funded progressive** layer (not
  part of the 96%). Each bet contributes a small fraction to four shared pools;
  a bet-scaled mystery roll on any paid spin can award Mini/Minor/Major/Grand.
  Contributions in ≈ payouts out over time — the standard progressive model.
- **Max win** is capped at `12000× total bet` for the base+feature game, so the
  exposure is bounded and certifiable. Jackpots are exempt (separate pool).

Re-tune anything and re-measure:

```bash
npm run sim            # 500k spins, 96 band
npm run sim 2000000 94 # 2M spins, 94 band
npm run test:slot      # 13 correctness + fairness tests
```

---

## 4. Provably fair — how a player verifies a round

The scheme is textbook **commit–reveal** using only standard primitives
(SHA-256 / HMAC-SHA256 — no home-grown cryptography):

1. **Commit.** When your session starts (a "fairness epoch"), the server
   generates a 32-byte `serverSeed` and publishes only its **SHA-256 hash** (the
   commitment) — *before* you spin. You also get a `clientSeed` you can change.
2. **Play.** Each spin `n` draws from a deterministic byte stream:
   `HMAC-SHA256(serverSeed, "clientSeed:n:cursor")`. The entire outcome — reels,
   tumbles, multiplier, jackpot roll — is a **pure function** of
   `(serverSeed, clientSeed, n)`. The server records an outcome hash per round.
3. **Reveal.** When you rotate your seed (Menu → *Reveal & rotate server seed*),
   the server discloses the old `serverSeed`. You then check:
   - `sha256(serverSeed) === commitment` you were shown, **and**
   - re-run every spin locally (`/quantum/verify`) and confirm the board and win
     match what you were paid.

Because the server was bound to the seed *before* you bet, it could not have
chosen your result after seeing your stake. The in-browser verifier
(`src/game/engine.ts`) reproduces the server engine (`server/slot/engine.js`)
byte-for-byte — the repo's parity test proved **80/80** real rounds reproduce
exactly. If the mirror ever drifts, verification of a real round fails, which is
the intended tripwire.

> Jackpot **progressive amounts** depend on the live shared pool at award time,
> so those are confirmed against server round records; the grid/line/scatter
> outcome and the jackpot *trigger + tier* reproduce locally.

---

## 5. Adding art (AssetManager)

Symbols render as crafted neon glyphs until real art lands. Drop files into:

```
public/themes/quantumspin/symbols/HERO_F.webp   (or .avif/.png/.svg)
                                   HERO_M.*  GEM.*  PLANET.*  ORB_B.*  ORB_O.*
                                   WILD.*  SCATTER.*  A.*  K.*  Q.*  J.*
```

The AssetManager probes `avif → webp → png → svg`, caches the result, and swaps
the glyph for the image automatically. No code change, no redeploy of logic.

---

## 6. Adding a theme (Theme Engine)

A theme is **pure presentation** — colours, per-symbol skins, background layers,
copy. It never touches math/RTP/fairness, so a new skin can't change the odds.
Add one object to `src/game/theme.ts`:

```ts
export const egypt: SlotTheme = { ...quantumspin, key: 'egypt', name: 'SOLAR DYNASTY', /* colours, symbols, copy */ };
SLOT_THEMES.egypt = egypt;
```

Ship it at `/quantum?theme=egypt` (or wire a host/route). `neonsamurai` is
included as a working second skin on the identical engine.

---

## 7. What's next

See **`docs/DEVELOPMENT_PLAN.md`** for the phased roadmap (MVP → Beta → Release →
Live Ops), including the PixiJS/WebGL renderer swap, Postgres/Prisma persistence,
Redis-backed multi-instance progressives, the admin CMS, i18n/multi-currency,
RGS integration, security review, performance budget and Docker/CI-CD deployment.
