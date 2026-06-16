# RGS — Remote Gaming Server (wallet + ledger)

This is the money/integration layer that turns the games from a demo into a
product that aggregators and operators can plug into. It lives in `server/rgs/`
and is **independent of the game loop** (wiring into the live engine is the next
step — see "Status" below).

## Two modes

| Mode | Wallet | Use |
|------|--------|-----|
| `demo` (default) | built-in local wallet, seeded balance, no real money | fun-play / showcase / sandbox |
| `seamless` | the operator's wallet API (debit/credit/rollback) | real-money play via an operator/aggregator |

Switching is **config only** (`RGS_MODE`). The game logic and provably-fair RNG
are identical in both.

> All money is handled in **integer minor units** (cents). Floats are never used
> for balances — only converted to major units at the UI boundary.

## Pieces

```
server/rgs/
  config.js        env-driven config (mode, store, secret, wallet url, …)
  tokens.js        signed launch tokens (operator → game handoff)
  index.js         RGS facade — sessions, rounds, bet lifecycle (the ledger)
  schema.sql       PostgreSQL schema (operators, players, sessions, rounds,
                   bets, transactions, wallet_accounts)
  store/           memory (default) | postgres  (interchangeable)
  wallet/          demo (default)   | seamless   (interchangeable)
  selftest.js      full lifecycle test (run: node server/rgs/selftest.js)
```

## Launch flow (real money)

1. The operator generates a **launch token** server-to-server with the shared
   secret (`RGS_SECRET`), carrying the player handoff:
   ```js
   const tokens = require('./server/rgs/tokens');
   const gt = tokens.create(
     { operatorId, playerId, currency: 'EUR', gameKey: 'liftoffx', mode: 'seamless' },
     RGS_SECRET, 3600);
   ```
2. The operator opens the game at `https://<host>/<gameKey>?gt=<token>`.
3. The game server verifies the token and opens a session:
   ```js
   const { session, balanceMinor } = await rgs.openSessionFromToken(gt);
   ```
   The token is opaque to the browser and cannot be forged without the secret.

Demo play needs no token — `rgs.openDemoSession({ gameKey })` seeds a local
balance.

## Seamless wallet contract

In `seamless` mode the game calls the operator's wallet for every money move.
Implement these (reference shapes in `wallet/seamless.js`; adapt per aggregator).
All amounts are minor units; `ref` is the **idempotency key**.

```
POST {base}/balance   { operatorId, playerId, currency }                 -> { balanceMinor }
POST {base}/bet       { ...ids, amountMinor, ref, roundId, betId }       -> { balanceMinor }   (debit stake)
POST {base}/win       { ...ids, amountMinor, ref, roundId, betId }       -> { balanceMinor }   (credit payout)
POST {base}/rollback  { ...ids, amountMinor, ref, originalRef, … }       -> { balanceMinor }   (void a bet)
```
Reject with HTTP 4xx and `{ code }` (e.g. `INSUFFICIENT_FUNDS`).

## Bet lifecycle (the ledger)

```
placeBet   -> wallet DEBIT (stake)         + bet 'placed'   + tx 'bet'
settleWin  -> wallet CREDIT (stake × mult) + bet 'won'      + tx 'win'
settleLoss ->                              + bet 'lost'
cancelBet  -> wallet ROLLBACK (refund)     + bet 'cancelled'+ tx 'rollback'
```

Every wallet move writes a `transactions` row keyed by a deterministic `ref`
(`bet:<session>:<round>:<slot>`, `win:<bet>`, `cancel:<bet>`). The unique `ref`
guarantees that retries, reconnects and double-clicks can **never** double-charge
or double-pay — proven in the self-test.

## Provably-fair audit

Every round is persisted in `rounds`: the committed `server_seed_hash` and
`crash_point` are written **before** bets; the `server_seed` is revealed after
the bust. This is the auditable trail certifiers and operators require, on top of
the in-app player verification.

## Configuration (env)

| Var | Default | Meaning |
|-----|---------|---------|
| `RGS_MODE` | `demo` | `demo` \| `seamless` |
| `RGS_STORE` | `memory` | `memory` \| `postgres` |
| `DATABASE_URL` | — | Postgres connection (when `store=postgres`) |
| `RGS_SECRET` | dev default | HMAC secret for launch tokens — **set in prod** |
| `RGS_WALLET_URL` | — | operator wallet base URL (seamless) |
| `RGS_WALLET_KEY` | — | bearer token for the wallet API |
| `RGS_CURRENCY` | `EUR` | default currency |
| `RGS_DEMO_BALANCE_MINOR` | `245321` | demo opening balance (€2453.21) |

## Postgres setup (real money)

```bash
npm install pg                       # only needed for store=postgres
psql "$DATABASE_URL" -f server/rgs/schema.sql
RGS_STORE=postgres RGS_MODE=seamless RGS_WALLET_URL=… RGS_SECRET=… npm start
```
`pg` is lazy-loaded; if it's absent the store falls back to memory with a warning.

## Status

- ✅ **A1 (done):** ledger core — wallet/store contracts, demo + memory
  implementations, seamless + postgres targets, launch tokens, round audit,
  idempotent bet lifecycle, self-test (17/17).
- ⏳ **A2 (next):** wire this into the live game loop (`server/game.js`): route
  `placeBet` / `stash` / auto-cashout / crash settlement through the RGS, open a
  session per socket (token or demo), and persist every round. Then we move to
  **B** (responsible gaming + compliance UI).

Run the test suite any time:
```bash
npm run test:rgs
```
