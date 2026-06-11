/**
 * Glass Bridge — Provably Fair core.
 * ----------------------------------------------------------------------------
 * This module is the single source of truth for round outcomes. The exact same
 * algorithm is mirrored in the browser (client/src/lib/provablyFair.ts) and in
 * the dependency-free CLI verifier (verify-fairness.mjs), so any player can
 * independently reproduce every row of every round.
 *
 * COMMITMENT SCHEME
 *   1. The server generates a random `serverSeed` and publishes only its
 *      SHA-256 hash BEFORE the round starts (the player cannot predict it).
 *   2. The player supplies (or is auto-assigned) a `clientSeed`.
 *   3. A per-(player,seed) `nonce` increments by one each round.
 *   After the round the server reveals `serverSeed`; the player re-hashes it to
 *   confirm it matches the pre-published hash, then recomputes every row below.
 *
 * PER-ROW OUTCOME (row index n = 1..rows)
 *   h        = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${n}`)  (hex)
 *   trapSide = (nibble0(h) & 1) ? 'RIGHT' : 'LEFT'   // which glass tile is rigged
 *   f        = float53(h)                            // uniform in [0,1)
 *   armed    = f < armProb(n)                         // is the trap live this row?
 *
 *   The player picks LEFT or RIGHT. They FALL iff `armed && pick === trapSide`.
 *   armProb(n) = min(1, 2 * breakProb(n)), so for a player choosing uniformly
 *   the effective break probability per row is exactly breakProb(n) — the value
 *   encoded by the multiplier table. The choice is therefore genuinely
 *   meaningful (a different pick can change the result) yet unexploitable
 *   (trapSide is unknowable until the serverSeed is revealed).
 *
 * RTP / HOUSE EDGE
 *   breakProb(n) is derived from the configurable multiplier table so that the
 *   return-to-player for cashing out at any row equals (1 - houseEdge)^n.
 *   See deriveBreakProbabilities().
 */
import { createHmac, createHash, randomBytes } from 'node:crypto';

export type Side = 'LEFT' | 'RIGHT';

export interface RowOutcome {
  /** 1-based row index. */
  row: number;
  /** Which physical tile is rigged this row. */
  trapSide: Side;
  /** Uniform float in [0,1) derived from the HMAC. */
  roll: number;
  /** Probability the trap was live this row (2 * breakProb, clamped). */
  armProb: number;
  /** Whether the trap was live this row. */
  armed: boolean;
  /** Multiplier awarded for safely standing on this row. */
  multiplier: number;
}

/** SHA-256 hex digest. */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${row}`) as hex. */
export function rowHmac(serverSeed: string, clientSeed: string, nonce: number, row: number): string {
  return createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}:${row}`).digest('hex');
}

/** Cryptographically strong random hex string (default 32 bytes / 64 hex chars). */
export function randomSeed(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Convert a hex HMAC into a uniform float in [0,1) using 52 bits of entropy.
 * Identical technique used by major provably-fair operators.
 */
export function float53(hex: string): number {
  // Use 13 hex chars (52 bits) starting at index 1 (index 0 feeds trapSide).
  const slice = hex.slice(1, 14);
  const int = parseInt(slice, 16);
  return int / Math.pow(2, 52);
}

/** First nibble of the hex string, used to pick the trap side. */
export function trapSideFromHmac(hex: string): Side {
  return (parseInt(hex[0], 16) & 1) === 1 ? 'RIGHT' : 'LEFT';
}

/**
 * Derive per-row break probabilities from the multiplier table and house edge
 * so that EV (cash out at row n) = (1 - houseEdge)^n.
 *
 * With m_0 = 1, a zero-edge game has survival s_n = m_{n-1} / m_n and
 * P(reach n) = 1/m_n, giving RTP = 1. Folding in a per-step edge:
 *     s_n = (m_{n-1} / m_n) * (1 - houseEdge)
 *     breakProb_n = 1 - s_n
 */
export function deriveBreakProbabilities(multipliers: number[], houseEdge: number): number[] {
  const probs: number[] = [];
  let prev = 1;
  for (const m of multipliers) {
    const survival = (prev / m) * (1 - houseEdge);
    const clamped = Math.min(0.999, Math.max(0, 1 - survival));
    probs.push(clamped);
    prev = m;
  }
  return probs;
}

export interface RoundConfig {
  multipliers: number[];
  houseEdge: number;
}

/**
 * Compute the full deterministic outcome of every row in a round. The result
 * does NOT depend on the player's choices — it is the rigged-tile layout that
 * the seeds commit to. Whether the player falls is decided at play time by
 * comparing their pick against trapSide for armed rows.
 */
export function computeRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  config: RoundConfig,
): RowOutcome[] {
  const breakProbs = deriveBreakProbabilities(config.multipliers, config.houseEdge);
  return config.multipliers.map((multiplier, i) => {
    const row = i + 1;
    const hex = rowHmac(serverSeed, clientSeed, nonce, row);
    const armProb = Math.min(1, 2 * breakProbs[i]);
    const roll = float53(hex);
    return {
      row,
      trapSide: trapSideFromHmac(hex),
      roll,
      armProb,
      armed: roll < armProb,
      multiplier,
    };
  });
}

/**
 * Given the committed layout and a player's pick for a specific row, decide the
 * step result. Pure function — used by the authoritative server and the
 * client-side verifier alike.
 */
export function resolveStep(outcome: RowOutcome, pick: Side): { safe: boolean } {
  return { safe: !(outcome.armed && pick === outcome.trapSide) };
}
