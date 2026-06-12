/**
 * Liftoff X — Provably Fair reference verifier (Node, no deps).
 * This is the SAME algorithm the browser client and the game server use.
 * Run:  node verify-fairness.mjs
 *
 * A player can independently verify any round:
 *   crashPoint(serverSeed, clientSeed, nonce) must equal the published result.
 */
import { createHmac, createHash, randomBytes } from 'node:crypto';

const HOUSE_EDGE = 0.02; // 2%

export function hmacHex(serverSeed, clientSeed, nonce) {
  return createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
}

export function crashFromHmac(hex, cap = 0) {
  // Instant-crash slice implements the house edge.
  const hInt = parseInt(hex.slice(0, 8), 16);
  if (hInt % Math.round(1 / HOUSE_EDGE) === 0) return 1.0;
  const h = parseInt(hex.slice(0, 13), 16);
  const e = Math.pow(2, 52);
  let result = Math.max(1.0, Math.floor((100 * e - h) / (e - h)) / 100);
  // Operator-configurable max-win cap, applied transparently AFTER the provably-fair
  // value so it still verifies (computed = min(raw, cap)). cap = 0 → uncapped.
  if (cap && cap > 1 && result > cap) result = cap;
  return result;
}

export function crashPoint(serverSeed, clientSeed, nonce, cap = 0) {
  return crashFromHmac(hmacHex(serverSeed, clientSeed, nonce), cap);
}

export const sha256 = s => createHash('sha256').update(s).digest('hex');

// ---- self test: distribution & house edge sanity ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const serverSeed = randomBytes(16).toString('hex');
  const clientSeed = 'player-seed-123';
  console.log('Server seed:      ', serverSeed);
  console.log('Server seed hash: ', sha256(serverSeed), '(published before round)');
  console.log('Client seed:      ', clientSeed);
  console.log('');

  const N = 200000;
  let sum = 0, instant = 0, ge2 = 0, ge10 = 0, max = 0;
  for (let nonce = 1; nonce <= N; nonce++) {
    const c = crashPoint(serverSeed, clientSeed, nonce);
    sum += c;
    if (c === 1.0) instant++;
    if (c >= 2) ge2++;
    if (c >= 10) ge10++;
    if (c > max) max = c;
  }
  console.log(`Rounds simulated:     ${N.toLocaleString()}`);
  console.log(`Instant crash (1.00): ${(instant / N * 100).toFixed(2)}%  (target ~${(HOUSE_EDGE*100).toFixed(0)}%)`);
  console.log(`>= 2.00x:             ${(ge2 / N * 100).toFixed(2)}%  (fair target ~49%)`);
  console.log(`>= 10.00x:            ${(ge10 / N * 100).toFixed(2)}%  (fair target ~9.8%)`);
  console.log(`Max seen:             ${max.toFixed(2)}x`);
  console.log('');
  // Example single-round verification
  const c = crashPoint(serverSeed, clientSeed, 1);
  console.log(`Round #1 -> ${c.toFixed(2)}x`);
  console.log(`HMAC: ${hmacHex(serverSeed, clientSeed, 1)}`);
}
