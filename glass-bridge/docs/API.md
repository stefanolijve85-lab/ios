# Glass Bridge — API Reference

Base URL: `/api`. All responses are JSON. Authenticated routes require an
`Authorization: Bearer <jwt>` header (obtained from `/auth/login` or
`/auth/register`).

## Auth

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | – | `{ username, password, email? }` | Create an account, returns `{ token, user }`. |
| POST | `/auth/login` | – | `{ username, password }` | Returns `{ token, user }`. |
| GET | `/auth/me` | ✓ | – | Current user. |

`user` shape: `{ id, username, email, balance, isAdmin, clientSeed, nonce }`.

## Game

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/game/config` | ✓ | – | `{ rows, multipliers, minBet, maxBet, maxPayout }`. |
| GET | `/game/state` | ✓ | – | `{ round, user }` — the active round (if any). |
| POST | `/game/start` | ✓ | `{ bet, clientSeed? }` | Debits the bet, commits seeds, returns `{ round, user }`. |
| POST | `/game/step` | ✓ | `{ pick: "LEFT" \| "RIGHT" }` | Jump on the current row. `{ result, round, user }`. |
| POST | `/game/cashout` | ✓ | – | Cash out at the current multiplier. `{ result, round, user }`. |
| POST | `/game/client-seed` | ✓ | `{ clientSeed }` | Set the seed used for the next round. |
| POST | `/game/rotate-seed` | ✓ | – | Assign a fresh random client seed. |
| GET | `/game/history` | ✓ | – | `{ rounds }` — last 50 of the player's rounds. |

`round` (public, no secrets): `{ id, bet, serverSeedHash, clientSeed, nonce,
rows, multipliers, currentRow, status, multiplier, potentialPayout }`.

`result` (a step/cashout outcome): `{ safe, trapSide, pick, row, multiplier,
status, reveal? }`. `reveal` is present once the round ends and contains
`{ serverSeed, serverSeedHash, clientSeed, nonce, layout, picks }`.

## Social & Provably Fair (public)

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/leaderboards` | – | `{ topWins, topMultipliers, recent }` for today. |
| GET | `/verify/:roundId` | – | Recompute a stored round's layout + hash check. |
| POST | `/verify` | `{ serverSeed, clientSeed, nonce, multipliers?, houseEdge? }` | Stateless layout recompute. |
| POST | `/simulate` | `{ serverSeed, clientSeed, nonce, picks[] }` | Replay picks to confirm the outcome. |

## Admin (requires `isAdmin`)

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/admin/stats` | – | Totals + recent rounds + current config. |
| GET/PUT | `/admin/config` | `{ multipliers?, houseEdge?, minBet?, maxBet?, maxPayout? }` | Read/update game config (RTP). |
| GET | `/admin/users` | – | List players. |
| POST | `/admin/users/:id/balance` | `{ amount }` | Adjust a balance (+/-). |
| POST | `/admin/users/:id/mute` | `{ minutes }` | Mute a player in chat (0 = unmute). |
| GET | `/admin/audit` | – | Recent audit-log entries. |
| GET | `/admin/export/rounds.csv` | – | CSV export of rounds. |

## Realtime (Socket.IO, path `/socket.io`)

Authenticate by passing the JWT in the handshake: `io({ auth: { token } })`.

**Server → client:** `presence {online}`, `chat:history [msg]`,
`chat:message msg`, `chat:system {body}`, `chat:error {error}`,
`round:result {username, bet, multiplier, payout, status, createdAt}`.

**Client → server:** `chat:send {body}`, `chat:mute {userId, minutes}` (admin).
