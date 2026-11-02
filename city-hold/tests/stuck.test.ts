import { describe, expect, it } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';

describe('no walking on the spot', () => {
  it('defenders sent to an occupied spot settle instead of pushing forever', () => {
    const g = new Game(PARIS, 'defence', { seed: 3 });
    g.buyUnit('security'); g.buyUnit('security'); g.buyUnit('security');
    const sec = g.defenders().filter((d) => d.kind === 'security').slice(0, 3);
    // one guard stands on the spot, then the other two are each sent to exactly that spot
    g.moveUnits([sec[0].id], 4, 2);
    for (let i = 0; i < 30 * 12; i++) g.step(1 / 30);
    const spot = { x: sec[0].x, z: sec[0].z };
    g.moveUnits([sec[1].id], spot.x, spot.z); g.moveUnits([sec[2].id], spot.x, spot.z);
    for (let i = 0; i < 30 * 15; i++) g.step(1 / 30);
    for (const u of sec) {
      expect(u.moving, `unit ${u.id} still stepping in state ${u.state}`).toBe(false);
      expect(Math.hypot(u.x - spot.x, u.z - spot.z)).toBeLessThan(3);
    }
  });
});
