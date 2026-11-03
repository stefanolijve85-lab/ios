import { expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

const setup = () => {
  const g = new Game(PARIS, 'defence', { seed: 4 });
  g.buyUnit('shield'); g.startWave();
  let a = g.attackers().find((u) => u.state === 'approach');
  for (let i = 0; i < 30 * 40 && !a; i++) { g.step(1 / 30); a = g.attackers().find((u) => u.state === 'approach'); }
  const s = g.defenders().find((d) => d.kind === 'shield')!; s.x = a!.x + 6; s.z = a!.z;
  return { g, a: a!, s };
};

test('flashbang: thrown by an officer, goes off after its fuse and stuns the rioters around it', () => {
  const keep = BALANCE.flashBang.throwBackChance, keepT = BALANCE.flashBang.throwerThrowBack;
  BALANCE.flashBang.throwBackChance = 0; BALANCE.flashBang.throwerThrowBack = 0;
  try {
    const { g, a } = setup();
    expect(g.flashBang(a.x, a.z).ok).toBe(true);
    expect(g.flashBang(a.x, a.z).ok).toBe(false); // cooldown
    let bang = false;
    for (let i = 0; i < 30 * 3 && !bang; i++) { g.step(1 / 30); bang = g.events.some((e) => e.type === 'flashBang'); }
    expect(bang).toBe(true);
    const stunned = g.attackers().filter((u) => u.staggerUntil > g.time);
    expect(stunned.length).toBeGreaterThan(0);
    expect(g.gas.length).toBe(0);
  } finally { BALANCE.flashBang.throwBackChance = keep; BALANCE.flashBang.throwerThrowBack = keepT; }
});

test('a rioter can throw a grenade back: it then lands at the police and hurts them', () => {
  const keep = BALANCE.flashBang.throwBackChance;
  BALANCE.flashBang.throwBackChance = 1; BALANCE.flashBang.throwerThrowBack = 1;
  try {
    const { g, a, s } = setup();
    expect(g.flashBang(a.x, a.z).ok).toBe(true);
    let back = false, bang = false;
    for (let i = 0; i < 30 * 5 && !bang; i++) { g.step(1 / 30); back ||= g.events.some((e) => e.type === 'throwBack'); bang = g.events.some((e) => e.type === 'flashBang'); }
    expect(back).toBe(true);
    expect(bang).toBe(true);
    expect(s.staggerUntil).toBeGreaterThan(g.time - 0.1); // the officer was blinded by his own flashbang
  } finally { BALANCE.flashBang.throwBackChance = keep; BALANCE.flashBang.throwerThrowBack = 0.55; }
});
