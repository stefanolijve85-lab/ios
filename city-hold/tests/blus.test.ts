import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

const run = (g: Game, s: number) => { for (let i = 0; i < 30 * s; i++) g.step(1 / 30); };
const burn = (g: Game, x: number, z: number, store = -1) => { const f = { id: 900 + g.fires.length, x, z, store, prop: -1, progress: 0, out: false, t: 0, ttl: 9999 }; g.fires.push(f); return f; };

test('fire tender: drives to the fire, the firefighter puts it out, climbs back in, the tender is free again', () => {
  const g = new Game(PARIS, 'defence', { seed: 2 }); g.budget = 3000;
  expect(g.canBlus().ok).toBe(false); // nothing burns yet
  const f = burn(g, 6, -6);
  expect(g.sendBlus(30, 30).ok).toBe(false); // not near a fire
  const b0 = g.budget;
  expect(g.sendBlus(6.5, -6).ok).toBe(true);
  expect(g.budget).toBe(b0 - BALANCE.defence.costs.blus);
  expect(g.sendBlus(6.5, -6).ok).toBe(false); // busy: a repeated tap does nothing
  let crew = false; for (let i = 0; i < 30 * 40 && !crew; i++) { g.step(1 / 30); crew = g.units.some((u) => u.blusCrew); }
  expect(crew).toBe(true);
  expect(Math.hypot(g.blus!.x - f.x, g.blus!.z - f.z)).toBeLessThan(9);
  run(g, 40);
  expect(f.out).toBe(true);
  expect(g.blus!.state).toBe('ready');
  expect(g.units.some((u) => u.blusCrew)).toBe(false); // back in the truck
});

test('a fire out of reach is refused (no charge); a fire put out does no more damage', () => {
  const g = new Game(PARIS, 'defence', { seed: 2 }); g.budget = 3000;
  burn(g, 500, 500);
  const b0 = g.budget;
  expect(g.sendBlus(500, 500).ok).toBe(false);
  expect(g.budget).toBe(b0);
  const s = g.stores[0]; const f = burn(g, s.door.x, s.door.z, 0);
  expect(g.sendBlus(s.door.x, s.door.z).ok).toBe(true);
  for (let i = 0; i < 30 * 80 && !f.out; i++) g.step(1 / 30);
  expect(f.out).toBe(true);
  const st = s.structure, stock = s.stock; run(g, 10);
  expect(s.structure).toBe(st); expect(s.stock).toBe(stock);
});
