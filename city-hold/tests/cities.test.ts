import { describe, expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { MAPS } from '../src/maps';
import { AMSTERDAM, BERLIN, LONDON, MILAN, SAOPAULO } from '../src/maps/cities';
import { barrierRect } from '../src/sim/nav';
import type { Vec2 } from '../src/maps/types';
import { mapReachability } from './helpers';

const dt = 1 / 30;

/** sample a polyline every 10 cm */
function samples(path: Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i]; const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1));
    for (let k = 0; k <= n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n });
  }
  return out;
}

describe('every district', () => {
  for (const [id, m] of Object.entries(MAPS)) {
    test(`${id}: all spawns reach all stores and stores reach an exit; sockets on walkable ground`, () => {
      expect(mapReachability(m)).toEqual([]);
      const g = new Game(m, 'defence');
      for (const s of m.sockets) expect(g.nav.walkable(s.x, s.z), `socket ${s.id}`).toBe(true);
      for (const e of m.entries) expect(g.nav.walkable(e.x, e.z), `entry ${e.id}`).toBe(true);
      expect(g.nav.walkable(m.defenderSpawn.x, m.defenderSpawn.z)).toBe(true);
      for (const s of g.stores) expect(g.nav.nearestWalkable(s.door.x, s.door.z, 0.6), `door ${s.name}`).not.toBeNull();
    });
  }
});

describe('Amsterdam bridges', () => {
  test('paths cross the canal only on the two bridges and never over water', () => {
    const g = new Game(AMSTERDAM, 'defence');
    for (const e of AMSTERDAM.entries) for (const s of g.stores) {
      const path = g.nav.findPath({ x: e.x, z: e.z }, s.door, 'att')!;
      expect(path).not.toBeNull();
      let crossed = false;
      for (const p of samples(path)) {
        if (p.z > -4 && p.z < 4) {
          crossed = true;
          const onBridge = AMSTERDAM.bridges.some((b) => p.x >= b.x0 && p.x <= b.x1);
          expect(onBridge, `point ${p.x.toFixed(2)},${p.z.toFixed(2)} over water`).toBe(true);
        }
      }
      expect(crossed).toBe(true);
    }
  });

  test('one bridge can be blocked, both cannot', () => {
    const g = new Game(AMSTERDAM, 'defence');
    g.budget = 5000;
    expect(g.place('concrete', 'L1').ok).toBe(true);
    // the remaining route goes over the east bridge
    const path = g.nav.findPath({ x: -31, z: 10 }, g.stores[0].door, 'solid')!;
    expect(samples(path).some((p) => p.z > -4 && p.z < 4 && p.x > 11)).toBe(true);
    const r = g.place('concrete', 'L2');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/block/);
  });

  test('a unit walking the full route never stands on water', () => {
    const g = new Game(AMSTERDAM, 'defence', { seed: 3 });
    g.units = []; g.phase = 'wave';
    const u = g.spawnAttacker('runner', 'w', 2, 'e');
    for (let i = 0; i < 30 * 90 && g.units.includes(u); i++) {
      g.step(dt);
      const overWater = u.z > -4 && u.z < 4 && !AMSTERDAM.bridges.some((b) => u.x >= b.x0 && u.x <= b.x1);
      expect(overWater).toBe(false);
    }
  });
});

describe('Milan arcade', () => {
  test('arcade is traversable but columns are solid', () => {
    const g = new Game(MILAN, 'defence');
    for (const c of MILAN.arcades[0].columns) expect(g.nav.walkable(c.x, c.z)).toBe(false);
    const path = g.nav.findPath({ x: 22, z: -29 }, g.stores[2].door, 'att')!;
    expect(path).not.toBeNull();
    for (const p of samples(path)) {
      for (const c of MILAN.arcades[0].columns) expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeGreaterThan(c.r);
      expect(p.x).toBeGreaterThan(18.2 - 0.01); // stays under the arcade
    }
  });

  test('detection range is reduced under the arcade roof', () => {
    const g = new Game(MILAN, 'defence', { seed: 2 });
    g.units = []; g.phase = 'wave';
    const d = g.spawnDefender('security', { x: 12, z: -6 });
    const a = g.spawnAttacker('carrier', 'arc', 2); a.x = 21; a.z = -6; a.path = null; a.state = 'held';
    // 9 m apart: inside open-square sight (9) but outside halved arcade sight (4.5)
    g.step(dt);
    expect(g.isDetected(a)).toBe(false);
    a.x = 15.5; g.step(dt); // out on the square edge, 3.5 m away
    expect(g.isDetected(a)).toBe(true);
    void d;
  });
});

describe('Berlin courtyard', () => {
  test('the courtyard store is reachable only through the archway', () => {
    const g = new Game(BERLIN, 'defence');
    for (const e of BERLIN.entries) {
      const path = g.nav.findPath({ x: e.x, z: e.z }, g.stores[2].door, 'att')!;
      expect(path).not.toBeNull();
      for (const p of samples(path)) if (p.z < -14 && p.z > -26) expect(Math.abs(p.x)).toBeLessThanOrEqual(2.5);
    }
    // the building either side of the arch is solid
    expect(g.nav.walkable(-6, -20)).toBe(false);
    expect(g.nav.walkable(0, -20)).toBe(true);
  });

  test('a concrete barrier cannot seal the archway', () => {
    const g = new Game(BERLIN, 'defence'); g.budget = 5000;
    const r = g.place('concrete', 'L1');
    expect(r.ok).toBe(false);
    expect(g.routesOpenWith(barrierRect(0, -30, 'small', 0))).toBe(true);
  });
});

describe('London passage and stairs', () => {
  test('passage connects the back lane to the high street; stairs open only to the north', () => {
    const g = new Game(LONDON, 'defence');
    const path = g.nav.findPath({ x: 14, z: -33 }, g.stores[2].door, 'att')!;
    expect(path).not.toBeNull();
    for (const p of samples(path)) if (p.z > -28 && p.z < -12) expect(p.x > 12 && p.x < 16).toBe(true);
    expect(g.nav.walkable(-6, 15.15)).toBe(false); // railing south of the stairs
    const out = g.nav.findPath({ x: -6, z: 13.5 }, { x: -6, z: 18 }, 'att')!;
    expect(samples(out).some((p) => p.z < 10)).toBe(true); // must climb out northwards first
  });
});

describe('São Paulo loading lane and supply truck', () => {
  test('rear approach reaches the corner store through the service lane', () => {
    const g = new Game(SAOPAULO, 'defence');
    const path = g.nav.findPath({ x: 23, z: -35 }, g.stores[0].door, 'att')!;
    expect(path).not.toBeNull();
    expect(samples(path).some((p) => p.z < -30)).toBe(true);
  });

  test('truck follows the lane, stops for people and pays its reward exactly once', () => {
    const g = new Game(SAOPAULO, 'defence', { seed: 4 });
    g.units = [];
    const start = g.budget;
    g.truck!.active = true;
    // a unit standing in the lane blocks the truck
    const blocker = g.spawnDefender('security', { x: 23, z: 12 });
    for (let i = 0; i < 30 * 5; i++) g.step(dt);
    expect(g.truck!.blocked).toBe(true);
    const zBlocked = g.truck!.z;
    expect(zBlocked).toBeGreaterThan(12);
    g.units = g.units.filter((u) => u !== blocker);
    for (let i = 0; i < 30 * 40; i++) { g.step(dt); expect(g.nav.walkable(g.truck!.x, g.truck!.z) || g.truck!.z > 22 || g.truck!.z < -34).toBe(true); }
    expect(g.truck!.rewarded).toBe(true);
    expect(g.truck!.done).toBe(true);
    for (let i = 0; i < 30 * 10; i++) g.step(dt);
    expect(g.budget).toBe(start + 200);
    expect(g.drainEvents().filter((e) => e.type === 'supply').length).toBe(1);
  });
});
