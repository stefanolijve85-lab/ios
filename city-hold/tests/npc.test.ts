import { describe, expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';

const dt = 1 / 30;

describe('neutral people', () => {
  test('shopkeepers and a helper exist; civilians are capped (mobile lower)', () => {
    const g = new Game(PARIS, 'defence', { seed: 1, mobile: true });
    expect(g.npcs.filter((n) => n.role === 'shopkeeper').length).toBe(3);
    expect(g.npcs.filter((n) => n.role === 'helper').length).toBe(1);
    for (let i = 0; i < 30 * 120; i++) { g.step(dt); expect(g.npcs.filter((n) => n.role === 'civilian' && n.state !== 'gone').length).toBeLessThanOrEqual(BALANCE.npc.civilians.mobile); }
  });

  test('a shopkeeper flees from a nearby attacker and returns when the street is calm; no effect on stock', () => {
    const g = new Game(PARIS, 'defence', { seed: 2 });
    g.units = []; g.phase = 'wave';
    const keeper = g.npcs.find((n) => n.role === 'shopkeeper' && n.store === 0)!;
    const a = g.spawnAttacker('carrier', 'nw', 0); a.x = keeper.x + 2; a.z = keeper.z + 1; a.path = null; a.state = 'held';
    g.step(dt);
    expect(keeper.state).toBe('flee');
    expect(keeper.carrying).toBe(true);
    const helper = g.npcs.find((n) => n.role === 'helper')!;
    for (let i = 0; i < 30 * 30; i++) g.step(dt);
    expect(['guide', 'stroll', 'idle']).toContain(helper.state);
    for (const n of g.npcs) expect(g.nav.walkable(n.x, n.z)).toBe(true);
    g.units = []; g.phase = 'prep';
    for (let i = 0; i < 30 * 40 && keeper.state !== 'idle'; i++) g.step(dt);
    expect(keeper.state).toBe('idle');
    expect(g.stores[0].stock).toBe(100);
  });

  test('people never block or change the game: interceptions and waves still resolve', () => {
    const g = new Game(PARIS, 'defence', { seed: 3 });
    g.startWave();
    for (let i = 0; i < 30 * 300 && g.phase === 'wave'; i++) g.step(dt);
    expect(g.phase === 'prep' || g.phase === 'lost').toBe(true);
    expect(g.units.some((u) => (u as { role?: string }).role)).toBe(false);
  });

  test('café guests and the police line are ambient only; guests flee and come back, police stay', () => {
    const g = new Game(PARIS, 'defence', { seed: 4 });
    const patrons = g.npcs.filter((n) => n.role === 'patron'), police = g.npcs.filter((n) => n.role === 'police');
    expect(patrons.length).toBe(BALANCE.npc.patrons.desktop);
    expect(police.length).toBe(3);
    expect(new Game(PARIS, 'defence', { seed: 4, mobile: true }).npcs.filter((n) => n.role === 'patron').length).toBe(BALANCE.npc.patrons.mobile);
    for (const n of [...patrons, ...police]) expect(g.nav.walkable(n.x, n.z)).toBe(true);
    const guest = patrons[0];
    g.units = []; g.phase = 'wave';
    const a = g.spawnAttacker('carrier', 'nw', 0); a.x = guest.x + 1.5; a.z = guest.z; a.path = null; a.state = 'held';
    const cop = police[0]; const copPos = { x: cop.x, z: cop.z };
    g.step(dt);
    expect(guest.state).toBe('flee');
    for (let i = 0; i < 30 * 30; i++) g.step(dt);
    expect(cop.state).toBe('idle'); expect(cop.x).toBe(copPos.x); expect(cop.z).toBe(copPos.z);
    g.units = []; g.phase = 'prep';
    for (let i = 0; i < 30 * 40 && guest.state !== 'idle'; i++) g.step(dt);
    expect(guest.state).toBe('idle');
    expect(Math.hypot(guest.x - guest.home!.x, guest.z - guest.home!.z)).toBeLessThan(0.01);
  });

  test('the square starts lively and passers-by stop to look before leaving', () => {
    const g = new Game(PARIS, 'defence', { seed: 6 });
    expect(g.npcs.filter((n) => n.role === 'civilian').length).toBeGreaterThanOrEqual(Math.floor(BALANCE.npc.civilians.desktop / 2));
    let browsed = 0;
    for (let i = 0; i < 30 * 90; i++) { g.step(dt); browsed = Math.max(browsed, g.npcs.filter((n) => n.state === 'browse').length); }
    expect(browsed).toBeGreaterThan(0);
    expect(g.npcs.filter((n) => n.role === 'civilian' && n.state !== 'gone').length).toBeLessThanOrEqual(BALANCE.npc.civilians.desktop);
  });
});
