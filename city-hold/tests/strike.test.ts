import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';

const run = (g: Game, s: number, until?: () => boolean) => { for (let i = 0; i < s * 30 && !(until && until()); i++) g.step(1 / 30); };

test('a shield officer sent at a rioter strikes him with the baton', () => {
  const g = new Game(PARIS, 'defence', { seed: 5 });
  g.buyUnit('shield');
  g.startWave();
  let hit = false;
  for (let i = 0; i < 30 * 90 && !hit; i++) {
    g.step(1 / 30);
    const s = g.defenders().find((d) => d.kind === 'shield')!;
    const a = g.attackers().filter((o) => o.state === 'approach').sort((p, q) => Math.hypot(p.x - s.x, p.z - s.z) - Math.hypot(q.x - s.x, q.z - s.z))[0];
    if (a && i % 15 === 0) g.moveUnits([s.id], a.x, a.z);
    if (s.strikeAt > 0) hit = true;
  }
  expect(hit).toBe(true);
});

test('a guard sent across the square grabs a rioter he passes', () => {
  const g = new Game(PARIS, 'defence', { seed: 5 });
  g.buyUnit('security');
  g.startWave();
  let chased = false; let prev = '';
  for (let i = 0; i < 30 * 90 && !chased; i++) {
    g.step(1 / 30);
    const s = g.defenders().find((d) => d.kind === 'security')!;
    if (s.state === 'chase' && prev === 'move') chased = true; // picked up on the way, not after arriving
    prev = s.state;
    const a = g.attackers().find((o) => o.state === 'approach');
    // send him to a point just past the nearest rioter: he should pick him up on the way
    if (a && s.state !== 'chase' && s.state !== 'restrain' && s.state !== 'escort' && i % 30 === 0) g.moveUnits([s.id], a.x + (a.x - s.x) * 0.3, a.z + (a.z - s.z) * 0.3);
  }
  expect(chased).toBe(true);
});

test('a camera that spots an intruder sends guards running at him', () => {
  const g = new Game(PARIS, 'defence', { seed: 7 });
  g.buyUnit('security'); g.buyUnit('security');
  const sock = PARIS.sockets.find((s) => s.size === 'small')!;
  g.place('camera', sock.id);
  g.startWave();
  let alarm = false;
  for (let i = 0; i < 30 * 120 && !alarm; i++) { g.step(1 / 30); alarm = g.events.some((e) => e.type === 'alarm'); }
  expect(alarm).toBe(true);
});
