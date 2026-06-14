const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Provably-fair crash point (shared engine — identical for every Olive Games
// title, never touched by a theme).
//
// Scheme: per-round commit–reveal.
//   1. At the start of the betting phase the server picks a random `serverSeed`
//      and publishes only its SHA-256 hash (the commitment) — BEFORE anyone
//      bets. The server cannot change the outcome after seeing the bets,
//      because the crash point is bound to that committed seed.
//   2. The crash point is derived deterministically from the seed:
//        HMAC-SHA256(key = serverSeed, msg = roundId)  → two uniforms → curve.
//   3. After the round busts the server reveals `serverSeed`. Anyone can check
//        SHA256(serverSeed) === commitment   AND
//        crashPointFromSeed(serverSeed, roundId) === crashPoint
//
// The same maths is reproduced client-side in src/lib/fairness.ts so a player
// can verify every round in their own browser.
// ---------------------------------------------------------------------------

function generateServerSeed() {
  return crypto.randomBytes(32).toString('hex');
}

// commitment shown before the round (hash of the hex seed string, utf-8)
function commitment(serverSeed) {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

// Deterministic crash point. `cfg` carries the single transparent house edge
// and the cap. Two independent uniforms come out of one HMAC:
//   u1 → instant-bust chance (house edge)
//   u2 → heavy-tailed multiplier
function crashPointFromSeed(serverSeed, roundId, cfg) {
  const h = crypto.createHmac('sha256', serverSeed).update(String(roundId)).digest();
  const u1 = h.readUInt32BE(0) / 0x100000000; // [0,1)
  const u2 = h.readUInt32BE(4) / 0x100000000; // [0,1)
  const E = cfg.HOUSE_EDGE;
  if (u1 < E) return 1.0;
  let cp = (1 - E) / (1 - u2);
  cp = Math.max(1.01, Math.min(cp, cfg.MAX_MULTIPLIER));
  return Math.floor(cp * 100) / 100;
}

module.exports = { generateServerSeed, commitment, crashPointFromSeed };
