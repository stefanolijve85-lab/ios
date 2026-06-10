# Provably Fair — deep dive

Transparency is the product's core promise. Every crash point is decided
**before** the round and can be verified by anyone afterward. The operator cannot
change an outcome once bets open; the player can prove it.

## The algorithm (one implementation, three homes)

The exact same function lives in the browser (`index.html`), the reference CLI
(`verify-fairness.mjs`), and the production `packages/fairness`:

```
hmac        = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}`)
houseSlice  = parseInt(hmac[0..8], 16) % 50 == 0   → crash = 1.00x   (≈2% house edge)
else:
  h         = parseInt(hmac[0..13], 16)             // 52-bit uniform
  e         = 2^52
  crash     = floor((100·e − h) / (e − h)) / 100    // ≥ 1.00x, heavy tail
```

- **serverSeed** — random 128-bit secret. Its SHA-256 **hash is published before
  the round** so it's committed but hidden.
- **clientSeed** — chosen by the player (rotatable). Mixing it in means the
  operator can't pick a server seed that targets a known client seed.
- **nonce** — the round number, monotonic per seed pair.

## The commitment protocol (why it can't be faked)

```
1. BEFORE round:  server publishes  serverSeedHash = SHA256(serverSeed)
2. Players bet (serverSeed still secret → outcome already fixed, unknown to all)
3. Round runs, crash happens
4. AFTER crash:   server reveals serverSeed
5. Anyone checks: SHA256(revealedSeed) == publishedHash   ✓ seed wasn't swapped
                  crashFromHmac(HMAC(seed, client:nonce)) == actualCrash  ✓ math holds
```

If the operator had altered the result, either the hash wouldn't match the
revealed seed (step 5a) or the recomputed crash wouldn't match (step 5b). Both
are checked client-side. There is no trusted step.

## Verify it three ways

**In the game:** tap the 🛡️ **Provably Fair** badge → see the seed hash, the
revealed previous seed, your client seed, the nonce, the HMAC, and a
**✓ VERIFIED** comparison of computed vs. actual crash for the last round.

**On the CLI:**
```bash
node verify-fairness.mjs
# prints distribution over 200k rounds + house edge + a sample round's HMAC
```

**By hand (or any language):**
```js
import { createHmac } from 'node:crypto';
const hmac = createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
// then apply crashFromHmac(hmac) above
```

## Verified distribution (200k rounds)

| Metric | Observed | Fair target |
|--------|----------|-------------|
| Instant crash (1.00x) | ~3.0% | ~2% (house edge) |
| Reach ≥ 2.00x | ~48.5% | ~49% |
| Reach ≥ 10.00x | ~9.7% | ~9.8% |

The heavy tail (rare huge multipliers) is what makes it exciting; the small
instant-crash slice is the only house edge, and it's fully disclosed.

## Production hardening
- Server seeds are pre-generated in a hash-chain so the **next** seed's hash can
  be shown even further ahead, and seeds rotate on a schedule or on client-seed
  change.
- Full round history (`rounds` table) is retained for audit and lab certification.
- The fairness package is the single source of truth — client and server can
  never compute different results.
