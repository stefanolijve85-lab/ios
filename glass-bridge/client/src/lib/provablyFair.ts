/**
 * Browser mirror of the server's provably-fair algorithm
 * (server/src/game/provablyFair.ts). Uses the Web Crypto API so a player can
 * verify any round entirely client-side, trusting no server. Keep in sync with
 * the server implementation.
 */
import type { RowOutcome, Side } from './types.js';

const enc = new TextEncoder();

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function float53(hex: string): number {
  return parseInt(hex.slice(1, 14), 16) / Math.pow(2, 52);
}

export function deriveBreakProbabilities(multipliers: number[], houseEdge: number): number[] {
  const out: number[] = [];
  let prev = 1;
  for (const m of multipliers) {
    const survival = (prev / m) * (1 - houseEdge);
    out.push(Math.min(0.999, Math.max(0, 1 - survival)));
    prev = m;
  }
  return out;
}

export async function computeRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  multipliers: number[],
  houseEdge: number,
): Promise<RowOutcome[]> {
  const breakProbs = deriveBreakProbabilities(multipliers, houseEdge);
  const out: RowOutcome[] = [];
  for (let i = 0; i < multipliers.length; i++) {
    const hex = await hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}:${i + 1}`);
    const armProb = Math.min(1, 2 * breakProbs[i]);
    const roll = float53(hex);
    out.push({
      row: i + 1,
      trapSide: (parseInt(hex[0], 16) & 1) === 1 ? 'RIGHT' : 'LEFT',
      roll,
      armProb,
      armed: roll < armProb,
      multiplier: multipliers[i],
    });
  }
  return out;
}

export function resolveStep(outcome: RowOutcome, pick: Side): boolean {
  return !(outcome.armed && pick === outcome.trapSide);
}
