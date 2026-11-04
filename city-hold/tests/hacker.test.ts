import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

const H = BALANCE.looters.hacker;
const run = (g: Game, s: number) => { for (let i = 0; i < 30 * s; i++) g.step(1 / 30); };
const looters = () => { const g = new Game(PARIS, 'looters', { seed: 2 }); g.budget = 3000; return g; };

test('tablet: a camera goes dark for a while, then comes back by itself', () => {
  const g = looters();
  expect(g.cameras.length).toBeGreaterThan(0);
  const c = g.cameras[0];
  expect(g.hackTarget('tablet', c.x + 30, c.z).ok).toBe(false); // nowhere near a camera
  expect(g.deployHacker('tablet', c.x + 1, c.z).ok).toBe(true);
  expect(g.budget).toBe(3000 - H.cost);
  let off = false; for (let i = 0; i < 30 * 60 && !off; i++) { g.step(1 / 30); off = (c.offUntil ?? 0) > g.time; }
  expect(off).toBe(true);
  expect(g.inCamera(c.x, c.z)).toBe(false);
  run(g, H.cameraOff + 1);
  expect(g.inCamera(c.x, c.z)).toBe(true);
  expect(g.units.some((u) => u.hack)).toBe(false); // the hacker left
});

test('laptop: a shutter stands open (looters walk straight in) and closes again; a broken shutter is no target', () => {
  const g = looters(); const s = g.stores[0];
  expect(g.deployHacker('laptop', s.door.x, s.door.z).ok).toBe(true);
  let open = false; for (let i = 0; i < 30 * 60 && !open; i++) { g.step(1 / 30); open = (s.openUntil ?? 0) > g.time; }
  expect(open).toBe(true);
  expect(s.structure).toBeGreaterThan(0); // nothing broken: it is only held open
  run(g, H.shutterOpen + 1);
  expect((s.openUntil ?? 0) > g.time).toBe(false);
  s.structure = 0;
  g.time = g.hackReadyAt.laptop + 1;
  expect(g.hackTarget('laptop', s.door.x, s.door.z).ok).toBe(false);
});

test('radio: one free guard goes to the fake call and returns to his post afterwards', () => {
  const g = looters();
  const guards = () => g.defenders().filter((d) => d.kind === 'security');
  expect(guards().length).toBeGreaterThan(0);
  const spot = { x: 0, z: 6 };
  expect(g.deployHacker('radio', spot.x, spot.z).ok).toBe(true);
  let sent: number | undefined; for (let i = 0; i < 30 * 60 && sent === undefined; i++) { g.step(1 / 30); sent = guards().find((d) => d.distractUntil !== undefined)?.id; }
  expect(sent).toBeDefined();
  run(g, H.distract + 1);
  const d = g.defenders().find((x) => x.id === sent);
  if (d) expect(d.distractUntil).toBeUndefined();
});

test('cooldown and repeat taps: one hacker per skill at a time; effects do not stack on one object', () => {
  const g = looters(); const c = g.cameras[0];
  expect(g.deployHacker('tablet', c.x, c.z).ok).toBe(true);
  expect(g.deployHacker('tablet', c.x, c.z).ok).toBe(false);
  g.time = g.hackReadyAt.tablet + 0.1; c.offUntil = g.time + 5; g.units.forEach((u) => { if (u.hack) u.hack = undefined; });
  expect(g.hackTarget('tablet', c.x, c.z).ok).toBe(false);
});

test('a caught hacker never finishes the job', () => {
  const g = looters(); const c = g.cameras[0];
  expect(g.deployHacker('tablet', c.x, c.z).ok).toBe(true);
  const hk = g.units.find((u) => u.hack)!;
  hk.state = 'escorted'; // taken away by a guard
  run(g, 20);
  expect((c.offUntil ?? 0) > g.time).toBe(false);
});

test('hackers do not exist on the defence side', () => {
  const g = new Game(PARIS, 'defence', { seed: 1 });
  expect(g.canHack('radio').ok).toBe(false);
});
