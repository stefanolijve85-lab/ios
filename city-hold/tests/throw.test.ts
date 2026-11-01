import { describe, expect, test } from 'vitest';
import { Game, type GameEvent } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE, waveComposition } from '../src/config/balance';

const dt = 1 / 30;
const frontOf = (i: number) => { const s = PARIS.stores[i]; return { x: s.front.x + s.normal.x * 0.5, z: s.front.z + s.normal.z * 0.5 }; };
function run(g: Game, sec: number, ev: GameEvent[] = []) { for (let i = 0; i < sec * 30 && !g.over; i++) { g.step(dt); ev.push(...g.drainEvents()); } return ev; }

describe('thrower unit', () => {
  test('one release event per throw, one impact per projectile, store catches fire', () => {
    const g = new Game(PARIS, 'defence', { seed: 3 });
    g.units = []; g.phase = 'wave';
    const u = g.spawnAttacker('thrower', 's', 1);
    const f = frontOf(1); u.x = f.x; u.z = f.z + 8; u.path = null; u.throwCd = 0;
    const ev = run(g, 4);
    const rel = ev.filter((e) => e.type === 'release'), imp = ev.filter((e) => e.type === 'impact');
    expect(rel.length).toBe(1);
    expect(imp.length).toBe(1);
    expect(imp[0].id).toBe(rel[0].id);
    expect(g.projectiles.length).toBe(0);
    expect(g.isBurning(1)).toBe(true);
    expect(g.stores[1].stock).toBe(100); // fire never touches stock
  });

  test('throws are limited per unit and never exceed the projectile cap', () => {
    const g = new Game(PARIS, 'defence', { seed: 4, mobile: true });
    g.units = []; g.phase = 'wave';
    for (let i = 0; i < 6; i++) { const u = g.spawnAttacker('thrower', i % 2 ? 'nw' : 'ne', i % 3); u.throwCd = 0; }
    let maxProj = 0; const ev: GameEvent[] = [];
    for (let i = 0; i < 30 * 60; i++) { g.step(dt); ev.push(...g.drainEvents()); maxProj = Math.max(maxProj, g.projectiles.length); }
    expect(maxProj).toBeLessThanOrEqual(BALANCE.throw.maxActive.mobile);
    const rel = ev.filter((e) => e.type === 'release').length, imp = ev.filter((e) => e.type === 'impact').length;
    expect(rel).toBeLessThanOrEqual(6 * BALANCE.throw.throwsPerUnit);
    expect(imp).toBe(rel - g.projectiles.length);
    expect(g.fires.filter((f) => !f.out).length).toBeLessThanOrEqual(BALANCE.fire.max);
  });

  test('a throw interrupted during the wind-up never releases', () => {
    const g = new Game(PARIS, 'defence', { seed: 5 });
    g.units = []; g.phase = 'wave';
    const u = g.spawnAttacker('thrower', 's', 0);
    const f = frontOf(0); u.x = f.x; u.z = f.z + 7; u.path = null; u.throwCd = 0;
    g.step(dt);
    expect(u.state).toBe('throw');
    u.state = 'restrained'; // intercepted by security before the release moment
    const ev = run(g, 2);
    expect(ev.some((e) => e.type === 'release')).toBe(false);
  });

  test('arcs collide with buildings instead of flying through them', () => {
    const g = new Game(PARIS, 'defence', { seed: 6 });
    g.units = []; g.phase = 'wave';
    // from the street behind the shop block (north), aimed at the jewellery front: the block is in the way
    expect(g.arcClear(-10, -45, frontOf(0))).toBe(false);
    g.launchProjectile(-10, -45, { kind: 'store', idx: 0, ...frontOf(0) });
    const ev = run(g, 4);
    const imp = ev.filter((e) => e.type === 'impact');
    expect(imp.length).toBe(1);
    expect(imp[0].text).toBe('Hit a wall');
    expect(g.isBurning(0)).toBe(false);
    // the AI checks the same arc and does not throw through the block
    expect(g.arcClear(frontOf(0).x, frontOf(0).z + 8, frontOf(0))).toBe(true);
  });

  test('repeated impacts on one store do not stack fires or damage', () => {
    const g = new Game(PARIS, 'defence', { seed: 7 });
    g.units = []; g.phase = 'wave';
    const f = frontOf(2);
    for (let i = 0; i < 5; i++) g.launchProjectile(f.x + i * 0.3, f.z + 8, { kind: 'store', idx: 2, ...f });
    run(g, 3);
    expect(g.fires.filter((x) => !x.out && x.store === 2).length).toBe(1);
    const s = g.stores[2]; const before = s.structure;
    run(g, 2);
    expect(before - s.structure).toBeLessThanOrEqual(BALANCE.fire.storeDamagePerSec * 2 + 0.01); // one fire's rate
  });

  test('cars are valid targets; a burnt car stays burnt and is not a target again', () => {
    const g = new Game(PARIS, 'defence', { seed: 8 });
    g.units = []; g.phase = 'wave';
    const idx = PARIS.props.findIndex((p) => p.type === 'car' && p.burnable);
    const c = PARIS.props[idx];
    g.launchProjectile(c.x + 6, c.z, { kind: 'prop', idx, x: c.x, z: c.z });
    run(g, 2);
    expect(g.burnedProps.has(idx)).toBe(true);
    const u = g.spawnAttacker('thrower', 'nw', 0);
    expect(g.throwCandidates(u).some((t) => t.kind === 'prop' && t.idx === idx)).toBe(false);
  });

  test('firefighter extinguishes; damage and soot remain, stock is not restored', () => {
    const g = new Game(PARIS, 'defence', { seed: 9 });
    g.units = []; g.phase = 'wave';
    const f = frontOf(1);
    g.launchProjectile(f.x, f.z + 8, { kind: 'store', idx: 1, ...f });
    run(g, 2);
    g.stores[1].stock = 60;
    run(g, 4);
    const s = g.stores[1]; expect(s.structure).toBeLessThan(100);
    g.spawnDefender('firefighter', PARIS.defenderSpawn);
    run(g, 40);
    expect(g.isBurning(1)).toBe(false);
    const after = s.structure;
    run(g, 3);
    expect(s.structure).toBe(after);         // no more fire damage
    expect(s.structure).toBeLessThan(100);   // extinguishing repairs nothing
    expect(s.scorched).toBe(true);
    expect(s.stock).toBe(60);
  });

  test('ground fires burn out by themselves; later waves include throwers', () => {
    const g = new Game(PARIS, 'defence', { seed: 10 });
    g.units = []; g.phase = 'wave';
    g.launchProjectile(-4, 6, { kind: 'ground', idx: -1, x: 4, z: 6 });
    run(g, 2);
    expect(g.fires.filter((f) => !f.out).length).toBe(1);
    run(g, BALANCE.fire.groundBurnSec + 1);
    expect(g.fires.filter((f) => !f.out).length).toBe(0);
    expect(waveComposition(1).includes('thrower')).toBe(false);
    expect(waveComposition(7).filter((k) => k === 'thrower').length).toBeGreaterThan(0);
  });
});
