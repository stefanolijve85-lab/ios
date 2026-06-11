/**
 * Glass Bridge — Provably Fair reference verifier (Node, ZERO dependencies).
 * The exact algorithm used by the server and the browser client. A player can
 * paste the revealed serverSeed, their clientSeed and the round's nonce to
 * reproduce every rigged tile and confirm the outcome.
 *
 *   node verify-fairness.mjs <serverSeed> <clientSeed> <nonce>
 *   node verify-fairness.mjs            # runs a self-test + RTP simulation
 */
import { createHmac, createHash, randomBytes } from 'node:crypto';

const DEFAULT_MULTIPLIERS = [1.03, 1.08, 1.15, 1.24, 1.36, 1.51, 1.7, 1.95, 2.3, 2.8, 3.5, 4.5];
const HOUSE_EDGE = 0.02;

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const rowHmac = (serverSeed, clientSeed, nonce, row) =>
  createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}:${row}`).digest('hex');

export function float53(hex) {
  return parseInt(hex.slice(1, 14), 16) / Math.pow(2, 52);
}

export function deriveBreakProbabilities(multipliers, houseEdge) {
  const out = [];
  let prev = 1;
  for (const m of multipliers) {
    const survival = (prev / m) * (1 - houseEdge);
    out.push(Math.min(0.999, Math.max(0, 1 - survival)));
    prev = m;
  }
  return out;
}

export function computeRound(serverSeed, clientSeed, nonce, multipliers = DEFAULT_MULTIPLIERS, houseEdge = HOUSE_EDGE) {
  const breakProbs = deriveBreakProbabilities(multipliers, houseEdge);
  return multipliers.map((multiplier, i) => {
    const hex = rowHmac(serverSeed, clientSeed, nonce, i + 1);
    const armProb = Math.min(1, 2 * breakProbs[i]);
    const roll = float53(hex);
    return {
      row: i + 1,
      trapSide: (parseInt(hex[0], 16) & 1) === 1 ? 'RIGHT' : 'LEFT',
      roll: Number(roll.toFixed(6)),
      armProb: Number(armProb.toFixed(4)),
      armed: roll < armProb,
      multiplier,
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [serverSeed, clientSeed, nonceArg] = process.argv.slice(2);
  if (serverSeed && clientSeed && nonceArg) {
    const nonce = Number(nonceArg);
    console.log('serverSeed hash:', sha256(serverSeed));
    console.table(computeRound(serverSeed, clientSeed, nonce));
    process.exit(0);
  }

  // Self-test + RTP simulation.
  const seed = randomBytes(32).toString('hex');
  const client = 'player-seed-123';
  console.log('serverSeed:     ', seed);
  console.log('serverSeed hash:', sha256(seed), '(published before the round)');
  console.log('clientSeed:     ', client, '\n');
  console.table(computeRound(seed, client, 1));

  const N = 200000;
  const cashRow = 5;
  let ret = 0;
  for (let nonce = 1; nonce <= N; nonce++) {
    const layout = computeRound(seed, client, nonce);
    let alive = true;
    for (let i = 0; i < cashRow && alive; i++) {
      const pick = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
      if (layout[i].armed && pick === layout[i].trapSide) alive = false;
    }
    if (alive) ret += DEFAULT_MULTIPLIERS[cashRow - 1];
  }
  console.log(`\nSimulated ${N.toLocaleString()} rounds, cashing out at row ${cashRow}:`);
  console.log(`  Observed RTP: ${(ret / N * 100).toFixed(2)}%`);
  console.log(`  Target RTP:   ${(Math.pow(1 - HOUSE_EDGE, cashRow) * 100).toFixed(2)}%  ((1 - houseEdge)^row)`);
}
