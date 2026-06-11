import { describe, it, expect } from 'vitest';
import { createRound, step, cashOut, toPublic } from '../src/game/engine.js';

const CLIENT = 'test-client-seed';

/** Play a round following the safe side every time (we can read the layout). */
function pickSafe(round: ReturnType<typeof createRound>, row: number) {
  const trap = round.layout[row].trapSide;
  return trap === 'LEFT' ? 'RIGHT' : 'LEFT';
}

describe('round engine', () => {
  it('commits a server seed hash and never leaks the seed in the public view', () => {
    const r = createRound('u1', 10, CLIENT, 1);
    const pub = toPublic(r);
    expect(pub.serverSeedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(pub)).not.toContain(r.serverSeed);
  });

  it('advances the multiplier on safe jumps and reveals proof at the end', () => {
    const r = createRound('u1', 10, CLIENT, 1);
    // Walk the whole bridge always choosing the non-trap side -> reaches the end.
    let lastMult = 1;
    for (let i = 0; i < r.config.rows; i++) {
      const res = step(r, pickSafe(r, i) as 'LEFT' | 'RIGHT');
      expect(res.safe).toBe(true);
      if (res.status === 'active') {
        expect(res.multiplier).toBeGreaterThan(lastMult);
        lastMult = res.multiplier;
      }
    }
    expect(r.status).toBe('cashed_out');
    expect(r.payout).toBeCloseTo(10 * r.config.multipliers[r.config.rows - 1], 2);
  });

  it('busts when picking the trap side on an armed row', () => {
    // Find a nonce whose first row is armed.
    let r = createRound('u1', 10, CLIENT, 1);
    let nonce = 1;
    while (!r.layout[0].armed && nonce < 200) {
      nonce += 1;
      r = createRound('u1', 10, CLIENT, nonce);
    }
    expect(r.layout[0].armed).toBe(true);
    const res = step(r, r.layout[0].trapSide);
    expect(res.safe).toBe(false);
    expect(r.status).toBe('busted');
    expect(r.payout).toBe(0);
    expect(res.reveal?.serverSeed).toBe(r.serverSeed);
  });

  it('cashes out at the current multiplier', () => {
    const r = createRound('u1', 20, CLIENT, 1);
    step(r, pickSafe(r, 0) as 'LEFT' | 'RIGHT');
    step(r, pickSafe(r, 1) as 'LEFT' | 'RIGHT');
    const res = cashOut(r);
    expect(res.status).toBe('cashed_out');
    expect(r.payout).toBeCloseTo(20 * r.config.multipliers[1], 2);
  });

  it('refuses to cash out before the first jump', () => {
    const r = createRound('u1', 20, CLIENT, 1);
    expect(() => cashOut(r)).toThrow();
  });
});
