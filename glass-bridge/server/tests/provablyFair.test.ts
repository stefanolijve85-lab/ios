import { describe, it, expect } from 'vitest';
import {
  sha256,
  rowHmac,
  float53,
  trapSideFromHmac,
  deriveBreakProbabilities,
  computeRound,
  resolveStep,
} from '../src/game/provablyFair.js';
import { DEFAULT_MULTIPLIERS } from '../src/game/config.js';

const SERVER_SEED = 'a'.repeat(64);
const CLIENT_SEED = 'player-seed-123';

describe('provably fair primitives', () => {
  it('sha256 is deterministic and 64 hex chars', () => {
    expect(sha256('hello')).toBe(sha256('hello'));
    expect(sha256('hello')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rowHmac is deterministic for the same inputs and changes with nonce/row', () => {
    const a = rowHmac(SERVER_SEED, CLIENT_SEED, 1, 1);
    const b = rowHmac(SERVER_SEED, CLIENT_SEED, 1, 1);
    const c = rowHmac(SERVER_SEED, CLIENT_SEED, 2, 1);
    const d = rowHmac(SERVER_SEED, CLIENT_SEED, 1, 2);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('float53 stays within [0,1)', () => {
    for (let n = 1; n <= 1000; n++) {
      const f = float53(rowHmac(SERVER_SEED, CLIENT_SEED, n, 1));
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('trapSide is always LEFT or RIGHT', () => {
    const side = trapSideFromHmac(rowHmac(SERVER_SEED, CLIENT_SEED, 1, 1));
    expect(['LEFT', 'RIGHT']).toContain(side);
  });
});

describe('break probability derivation', () => {
  const probs = deriveBreakProbabilities(DEFAULT_MULTIPLIERS, 0.02);

  it('produces one probability per row in [0,1)', () => {
    expect(probs).toHaveLength(DEFAULT_MULTIPLIERS.length);
    for (const p of probs) {
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
  });

  it('risk escalates across rows', () => {
    expect(probs[probs.length - 1]).toBeGreaterThan(probs[0]);
  });

  it('yields the configured RTP (within tolerance) over a large simulation', () => {
    // For a fixed cash-out row, EV/bet should approximate (1 - houseEdge)^row.
    const houseEdge = 0.02;
    const N = 60000;
    const cashRow = 5; // cash out after standing on row 5
    let totalReturn = 0;
    for (let nonce = 1; nonce <= N; nonce++) {
      const layout = computeRound(SERVER_SEED, CLIENT_SEED, nonce, {
        multipliers: DEFAULT_MULTIPLIERS,
        houseEdge,
      });
      let alive = true;
      for (let i = 0; i < cashRow && alive; i++) {
        // simulate a uniform random pick
        const pick = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
        if (!resolveStep(layout[i], pick).safe) alive = false;
      }
      if (alive) totalReturn += DEFAULT_MULTIPLIERS[cashRow - 1];
    }
    const rtp = totalReturn / N;
    const target = Math.pow(1 - houseEdge, cashRow);
    expect(Math.abs(rtp - target)).toBeLessThan(0.05);
  });
});

describe('round determinism', () => {
  it('recomputing a round from the same seeds reproduces the exact layout', () => {
    const cfg = { multipliers: DEFAULT_MULTIPLIERS, houseEdge: 0.02 };
    const a = computeRound(SERVER_SEED, CLIENT_SEED, 7, cfg);
    const b = computeRound(SERVER_SEED, CLIENT_SEED, 7, cfg);
    expect(a).toEqual(b);
  });

  it('picking the non-trap side on an armed row is always safe', () => {
    const cfg = { multipliers: DEFAULT_MULTIPLIERS, houseEdge: 0.02 };
    const layout = computeRound(SERVER_SEED, CLIENT_SEED, 1, cfg);
    for (const row of layout) {
      const safeSide = row.trapSide === 'LEFT' ? 'RIGHT' : 'LEFT';
      expect(resolveStep(row, safeSide).safe).toBe(true);
      // picking the trap side on an armed row falls
      if (row.armed) {
        expect(resolveStep(row, row.trapSide).safe).toBe(false);
      } else {
        expect(resolveStep(row, row.trapSide).safe).toBe(true);
      }
    }
  });
});
