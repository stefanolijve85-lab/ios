import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

const romeos = (g: Game) => g.defenders().filter((d) => d.role === 'romeo');

test('Romeo team through the crowd: a duo walks in from the nearest street and costs once', () => {
  const g = new Game(PARIS, 'defence', { seed: 3 });
  const b0 = g.budget;
  expect(g.deployRomeo('public', 0, -6).ok).toBe(true);
  expect(romeos(g).length).toBe(2);
  expect(g.budget).toBe(b0 - BALANCE.defence.costs.romeo);
  for (let i = 0; i < 30 * 20; i++) g.step(1 / 30);
  for (const r of romeos(g)) expect(Math.hypot(r.x - 0, r.z + 6)).toBeLessThan(3.5);
});

test('Romeo team out of the police van: they step out one after the other at the van door', () => {
  const g = new Game(PARIS, 'defence', { seed: 3 });
  expect(g.deployRomeo('bus', -8, -4).ok).toBe(true);
  const [a, b] = romeos(g); const v = PARIS.van;
  expect(Math.hypot(a.x - (v.x - 2.2), a.z - (v.z + 1.5))).toBeLessThan(3);
  g.step(0.3);
  expect(b.staggerUntil).toBeGreaterThan(g.time); // the second still waits at the door
  for (let i = 0; i < 30 * 20; i++) g.step(1 / 30);
  for (const r of romeos(g)) expect(Math.hypot(r.x + 8, r.z + 4)).toBeLessThan(3.5);
});

test('a repeated tap does not send a second team (cooldown), a blocked van door is refused, at most two teams', () => {
  const g = new Game(PARIS, 'defence', { seed: 3 });
  g.budget = 5000;
  expect(g.deployRomeo('public', 0, -6).ok).toBe(true);
  expect(g.deployRomeo('public', 0, -6).ok).toBe(false);
  expect(romeos(g).length).toBe(2);
  // block the van door with a unit standing on it
  g.time = g.romeoReadyAt + 1;
  const v = PARIS.van; const blocker = g.spawnDefender('shield', { x: v.x - 2.2, z: v.z + 1.5 }); blocker.x = v.x - 2.2; blocker.z = v.z + 1.5;
  const ex = g.nav.nearestWalkable(v.x - 2.2, v.z + 1.5, 3)!; blocker.x = ex.x; blocker.z = ex.z;
  expect(g.canRomeo('bus').ok).toBe(false);
  expect(g.canRomeo('public').ok).toBe(true);
  expect(g.deployRomeo('public', 5, -6).ok).toBe(true);
  g.time = g.romeoReadyAt + 1;
  expect(g.canRomeo('public').reason).toMatch(/At most/);
});

test('a Romeo team intercepts looters like security (they work as security officers)', () => {
  const g = new Game(PARIS, 'defence', { seed: 4 });
  expect(g.deployRomeo('public', 0, -8).ok).toBe(true);
  g.startWave();
  let engaged = false;
  for (let i = 0; i < 30 * 120 && !engaged; i++) { g.step(1 / 30); engaged = romeos(g).some((r) => r.state === 'chase' || r.state === 'restrain' || r.state === 'escort'); }
  expect(engaged).toBe(true);
});
