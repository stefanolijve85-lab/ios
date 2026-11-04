import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

const C = BALANCE.defence.cannon;
const run = (g: Game, s: number) => { for (let i = 0; i < 30 * s; i++) g.step(1 / 30); };

test('water cannon: drives in once, then knocks rioters at the target off their feet and away', () => {
  const g = new Game(PARIS, 'defence', { seed: 5 });
  g.budget = 5000; g.startWave();
  let a = g.attackers()[0]; for (let i = 0; i < 30 * 60 && !(a && Math.hypot(a.x - 20.6, a.z + 19.5) < 25 && Math.hypot(a.x - 20.6, a.z + 19.5) > 8); i++) { g.step(1 / 30); a = g.attackers().find((u) => Math.hypot(u.x - 20.6, u.z + 19.5) < 25 && Math.hypot(u.x - 20.6, u.z + 19.5) > 8)!; }
  expect(a).toBeDefined();
  const r = g.fireCannon(a.x, a.z);
  expect(r.ok).toBe(true);
  expect(g.cannon!.state).toBe('driving');
  expect(g.fireCannon(a.x, a.z).ok).toBe(false); // busy: a second tap does nothing
  let down = false;
  for (let i = 0; i < 30 * (C.drive + C.spray + 1) && !down; i++) { g.cannon!.tx = a.x; g.cannon!.tz = a.z; g.step(1 / 30); down = g.attackers().some((u) => (u.downUntil ?? 0) > g.time); }
  expect(down).toBe(true);
  run(g, C.spray + C.drive + 1);
  expect(g.cannon!.state).toBe('home'); // it backed up the street again, out of the crowd's way
  expect(Math.hypot(g.cannon!.x - PARIS.waterCannon!.home.x, g.cannon!.z - PARIS.waterCannon!.home.z)).toBeLessThan(0.1);
});

test('water cannon: out of reach and too close are refused without charge; cooldown after a spray', () => {
  const g = new Game(PARIS, 'defence', { seed: 5 }); g.budget = 5000; const b = g.budget;
  expect(g.fireCannon(-30, 15).ok).toBe(false);
  expect(g.fireCannon(20.6, -19).ok).toBe(false);
  expect(g.budget).toBe(b);
  expect(g.fireCannon(5, -8).ok).toBe(true);
  run(g, C.drive + C.spray + 1);
  expect(g.canCannon().ok).toBe(false); // still busy backing out / cooling down
  run(g, C.cooldown);
  expect(g.canCannon().ok).toBe(true);
});

test('the water cannon puts out a fire where it lands', () => {
  const g = new Game(PARIS, 'defence', { seed: 5 }); g.budget = 5000;
  g.fires.push({ id: 999, x: 5, z: -8, store: -1, prop: -1, progress: 0, out: false, t: 0, ttl: 999 });
  g.fireCannon(5, -8); run(g, C.drive + C.spray + 0.5);
  expect(g.fires.find((f) => f.id === 999)?.out ?? true).toBe(true);
});

test('no water cannon on the looting side or in cities without one', () => {
  expect(new Game(PARIS, 'looters', { seed: 1 }).canCannon().ok).toBe(false);
});
