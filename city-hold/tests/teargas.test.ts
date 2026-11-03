import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

test('tear gas: thrown by an officer, slows and scares rioters, costs budget and has a cooldown', () => {
  const g = new Game(PARIS, 'defence', { seed: 4 });
  g.buyUnit('shield');
  expect(g.tearGas(0, 0).ok).toBe(false); // not before the wave
  g.startWave();
  let a = g.attackers()[0];
  for (let i = 0; i < 30 * 40 && !(a = g.attackers().find((u) => u.state === 'approach')!); i++) g.step(1 / 30);
  for (let i = 0; i < 30 * 20; i++) { g.step(1 / 30); a = g.attackers().find((u) => u.state === 'approach')!; if (a && g.gasThrower(a.x, a.z)) break; }
  const s = g.defenders().find((d) => d.kind === 'shield')!;
  // bring the officer close so the throw is in range
  s.x = a.x + 3; s.z = a.z;
  const budget = g.budget;
  const r = g.tearGas(a.x, a.z);
  expect(r.ok).toBe(true);
  expect(g.budget).toBe(budget - BALANCE.tearGas.cost);
  expect(g.tearGas(a.x, a.z).ok).toBe(false); // cooldown
  const base = g.speedOf(a);
  for (let i = 0; i < 30 * 2.6; i++) g.step(1 / 30);
  const inside = g.attackers().filter((u) => g.inGas(u.x, u.z));
  expect(inside.length).toBeGreaterThan(0);
  expect(g.speedOf(inside[0])).toBeLessThan(base);
  for (let i = 0; i < 30 * 20; i++) g.step(1 / 30);
  expect(g.gas.length).toBe(0); // cloud gone after its life
});
