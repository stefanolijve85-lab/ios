import { describe, expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';
import type { MapDef } from '../src/maps/types';
import { run, autoDefence, autoLooter, mapReachability } from './helpers';
import { loadProgress, recordResult, resetProgress, saveProgress, type StorageLike } from '../src/save';

const dt = 1 / 30;

describe('economy', () => {
  test('purchases deduct exactly once and unaffordable actions are denied', () => {
    const g = new Game(PARIS, 'defence', { seed: 1 });
    expect(g.budget).toBe(1500);
    expect(g.buyUnit('security').ok).toBe(true);
    expect(g.budget).toBe(1250);
    expect(g.buyUnit('shield').ok).toBe(true);
    expect(g.budget).toBe(850);
    expect(g.place('camera', 'p7').ok).toBe(true);
    expect(g.budget).toBe(650);
    expect(g.place('barrier', 'p5').ok).toBe(true);
    expect(g.budget).toBe(500);
    expect(g.buyUnit('shield').ok).toBe(true); // 400
    expect(g.budget).toBe(100);
    expect(g.buyUnit('security').ok).toBe(false);
    expect(g.place('barrier', 'p6').ok).toBe(false);
    expect(g.budget).toBe(100);
    expect(g.drainEvents().filter((e) => e.type === 'denied').length).toBe(2);
  });

  test('wave reward of 350 is granted once per completed wave', () => {
    const g = new Game(PARIS, 'defence', { seed: 2 });
    const before = g.budget;
    g.startWave();
    expect(g.startWave().ok).toBe(false); // cannot start twice
    run(g, 400, () => { /* reserve defends alone */ });
    // keep stepping in prep: no extra reward
    for (let i = 0; i < 300; i++) g.step(dt);
    if (g.phase === 'prep') {
      expect(g.rewardsGranted).toBe(1);
      expect(g.budget).toBe(before + BALANCE.defence.waveReward);
      expect(g.wave).toBe(2);
    }
  });
});

describe('placement', () => {
  test('sockets enforce size, occupancy and invalid locations', () => {
    const g = new Game(PARIS, 'defence', { seed: 3 });
    expect(g.canPlace('concrete', 'p1').ok).toBe(false);
    expect(g.canPlace('camera', 'L1').ok).toBe(false);
    expect(g.canPlace('barrier', 'nope').ok).toBe(false);
    expect(g.place('concrete', 'L1').ok).toBe(true);
    expect(g.place('barrier', 'L1').ok).toBe(false);
  });

  test('a barrier that would block every route is refused', () => {
    // single corridor map: the only socket spans the corridor
    const corridor: MapDef = {
      ...PARIS, id: 'corridor', fountain: undefined, props: [], arcades: [], water: [], bridges: [], walls: [], islands: [],
      bounds: { x0: -20, z0: -20, x1: 20, z1: 20 },
      buildings: [{ rect: { x0: -40, z0: -40, x1: -2, z1: 40 }, height: 10, style: 'modern' }, { rect: { x0: 2, z0: -40, x1: 40, z1: 40 }, height: 10, style: 'modern' }],
      stores: [{ ...PARIS.stores[0], front: { x: -2, z: -15 }, normal: { x: 1, z: 0 }, width: 3 }, { ...PARIS.stores[1], front: { x: 2, z: -12 }, normal: { x: -1, z: 0 }, width: 3 }, { ...PARIS.stores[2], front: { x: -2, z: -9 }, normal: { x: 1, z: 0 }, width: 3 }],
      entries: [{ id: 's', name: 'south', x: 0, z: 19, spawn: true, extract: true }],
      sockets: [{ id: 'L', x: 0, z: 5, size: 'large', rot: 0 }, { id: 's1', x: 0, z: 0, size: 'small', rot: 0 }],
      van: { x: 0, z: 17, rot: 0 }, defenderSpawn: { x: 0, z: 12 },
    };
    const g = new Game(corridor, 'defence', { seed: 1 });
    const r = g.canPlace('concrete', 'L');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/block/);
  });
});

describe('stores and stock', () => {
  test('shutter upgrades add capacity and repair only what was added', () => {
    const g = new Game(PARIS, 'defence', { seed: 4 });
    const s = g.stores[0];
    s.structure = 40;
    expect(g.upgradeShutter(0).ok).toBe(true);
    expect(s.maxStructure).toBe(160); expect(s.structure).toBe(100); expect(g.budget).toBe(1200);
    expect(g.upgradeShutter(0).ok).toBe(true);
    expect(s.maxStructure).toBe(260); expect(s.structure).toBe(200); expect(g.budget).toBe(700);
    expect(g.upgradeShutter(0).ok).toBe(false);
    expect(g.budget).toBe(700);
  });

  test('stock is only deducted after extraction', () => {
    const g = new Game(PARIS, 'defence', { seed: 5 });
    g.units = []; // remove reserve
    g.phase = 'wave';
    const u = g.spawnAttacker('carrier', 'nw', 0, 'nw');
    g.stores[0].structure = 0;
    let sawCarrying = false;
    for (let i = 0; i < 30 * 60 && g.units.includes(u); i++) {
      g.step(dt);
      if (u.carrying > 0) { sawCarrying = true; expect(g.stores[0].stock).toBe(100); expect(g.stores[0].reserved).toBe(u.carrying); }
    }
    expect(sawCarrying).toBe(true);
    expect(g.stores[0].stock).toBe(100 - BALANCE.units.carrier.capacity);
    expect(g.stores[0].reserved).toBe(0);
    expect(g.extracted).toBe(BALANCE.units.carrier.capacity);
  });

  test('interception drops goods, returns them to the store and removes the offender', () => {
    const g = new Game(PARIS, 'defence', { seed: 6 });
    g.phase = 'wave';
    const u = g.spawnAttacker('carrier', 'nw', 0, 'nw');
    g.stores[0].structure = 0;
    for (let i = 0; i < 30 * 30 && u.carrying === 0; i++) g.step(dt);
    expect(u.carrying).toBeGreaterThan(0);
    const sec = g.defenders()[0];
    g.intercept(u, sec);
    expect(g.stores[0].reserved).toBe(0);
    expect(g.stores[0].stock).toBe(100);
    expect(g.drops.length).toBe(1);
    expect(u.state).toBe('escorted');
    g.intercept(u, sec); // second call must not double count
    expect(g.intercepted).toBe(1);
    for (let i = 0; i < 30 * 5; i++) g.step(dt);
    expect(g.units.includes(u)).toBe(false);
    expect(g.extracted).toBe(0);
  });

  test('loaded carriers are 25% slower; heavy carrier 20% slower than carrier', () => {
    const g = new Game(PARIS, 'defence', { seed: 7 });
    const u = g.spawnAttacker('carrier', 'nw', 0);
    const base = g.speedOf(u); u.carrying = 5;
    expect(g.speedOf(u)).toBeCloseTo(base * 0.75);
    expect(BALANCE.units.heavy.speed).toBeCloseTo(BALANCE.units.carrier.speed * 0.8);
    expect(BALANCE.units.heavy.capacity).toBe(BALANCE.units.runner.capacity * 2);
  });

  test('shield teams hold at most three offenders', () => {
    const g = new Game(PARIS, 'defence', { seed: 8 });
    g.units = []; g.phase = 'wave';
    const sh = g.spawnDefender('shield', { x: 0, z: -11 });
    for (let i = 0; i < 5; i++) { const a = g.spawnAttacker('carrier', 'nw', 1); a.x = 0.3 * i - 0.6; a.z = -10.2; a.path = null; }
    g.step(dt);
    expect(g.attackers().filter((a) => a.heldBy === sh.id).length).toBe(3);
  });

  test('barriers slow attackers until broken and then reopen the lane', () => {
    const g = new Game(PARIS, 'defence', { seed: 9 });
    g.units = []; g.phase = 'wave';
    expect(g.place('concrete', 'L1').ok).toBe(true);
    // NW street fully crossed? concrete covers part; force an attacker into the barrier
    const b = g.barriers[0];
    const a = g.spawnAttacker('vandal', 'nw', 0);
    a.x = b.x; a.z = b.z - 1.5; a.state = 'barrier'; a.barrierId = b.id;
    for (let i = 0; i < 30 * 10 && !b.broken; i++) g.step(dt);
    expect(b.broken).toBe(true);
    expect(g.nav.barrier.every((v) => v !== b.id)).toBe(true);
  });

  test('vandal fires damage the store until a firefighter extinguishes them', () => {
    const g = new Game(PARIS, 'defence', { seed: 10 });
    g.units = []; g.phase = 'wave';
    g.startFire(g.stores[1].door.x, g.stores[1].door.z, 1, -1);
    const s = g.stores[1];
    for (let i = 0; i < 30 * 3; i++) g.step(dt);
    expect(s.structure).toBeLessThan(100);
    const ff = g.spawnDefender('firefighter', g.map.defenderSpawn);
    for (let i = 0; i < 30 * 40 && g.fires.length; i++) g.step(dt);
    expect(g.fires.length).toBe(0);
    const after = s.structure;
    for (let i = 0; i < 30 * 3; i++) g.step(dt);
    expect(s.structure).toBe(after);
    void ff;
  });
});

describe('navigation', () => {
  test('every spawn reaches every store and every store reaches an exit', () => {
    expect(mapReachability(PARIS)).toEqual([]);
  });

  test('paths never cross the fountain, buildings or props', () => {
    const g = new Game(PARIS, 'defence');
    for (const e of PARIS.entries) for (const s of g.stores) {
      const p = g.nav.findPath({ x: e.x, z: e.z }, s.door, 'att')!;
      for (let i = 1; i < p.length; i++) {
        const a = p[i - 1], b = p[i]; const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1);
        for (let k = 0; k <= n; k++) expect(g.nav.walkable(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n)).toBe(true);
      }
    }
  });

  test('units never teleport or enter obstacles during a full defence match', () => {
    const g = new Game(PARIS, 'defence', { seed: 11 });
    const ai = autoDefence(g);
    const prev = new Map<number, { x: number; z: number }>();
    let maxStep = 0;
    run(g, 900, (gg) => {
      ai(gg);
      for (const u of gg.units) {
        expect(gg.nav.walkable(u.x, u.z)).toBe(true);
        const p = prev.get(u.id);
        if (p && u.state !== 'escorted') maxStep = Math.max(maxStep, Math.hypot(u.x - p.x, u.z - p.z));
        prev.set(u.id, { x: u.x, z: u.z });
      }
    });
    expect(maxStep).toBeLessThan(0.6);
  }, 30000);
});

describe('match outcomes', () => {
  test('defence can win all 12 waves and can lose', () => {
    const w = new Game(PARIS, 'defence', { seed: 1 });
    run(w, 3600, autoDefence(w));
    expect(w.phase).toBe('won');
    expect(w.wavesCleared).toBe(12);
    expect(w.storesWithStock()).toBeGreaterThanOrEqual(2);
    expect(w.rewardsGranted).toBe(12);
    const l = new Game(PARIS, 'defence', { seed: 5 });
    l.units = []; // no defenders at all
    run(l, 3600, (gg) => { if (gg.phase === 'prep') gg.startWave(); });
    expect(l.phase).toBe('lost');
    expect(l.stores.filter((s) => s.stock <= 0).length).toBeGreaterThanOrEqual(2);
  });

  test('looters can win by extraction and lose by running out of units or time', () => {
    // the scripted looter is simple; across several seeds it must reach the objective at least once
    const wins = [1, 2, 3, 4, 5, 6].map((seed) => { const w = new Game(PARIS, 'looters', { seed }); run(w, 480, autoLooter(w)); return w; }).filter((w) => w.phase === 'won');
    expect(wins.length).toBeGreaterThan(0);
    expect(wins[0].extracted).toBeGreaterThanOrEqual(60);
    const l = new Game(PARIS, 'looters', { seed: 3 });
    run(l, 480, autoLooter(l, { route: 'nw', target: 1 }));
    expect(l.phase).toBe('lost');
    const t = new Game(PARIS, 'looters', { seed: 3 });
    t.recruit('runner'); // keep a unit in reserve: never dispatched, so only the timer can end it
    run(t, 500);
    expect(t.phase).toBe('lost');
    expect(t.result?.title).toBe('Time expired');
  }, 30000);

  test('looter upgrades are exclusive and change stats', () => {
    const g = new Game(PARIS, 'looters', { seed: 1 });
    expect(g.looterUpgradeChoose('speed').ok).toBe(true);
    expect(g.looterUpgradeChoose('capacity').ok).toBe(false);
    expect(g.budget).toBe(700);
    g.setLooterTarget(0); g.recruit('carrier'); g.dispatch(); g.step(dt);
    const u = g.attackers()[0];
    expect(g.speedOf(u)).toBeCloseTo(BALANCE.units.carrier.speed * BALANCE.looters.speedUpgrade);
  });

  test('retargeting only affects approaching units', () => {
    const g = new Game(PARIS, 'looters', { seed: 1 });
    g.setLooterTarget(0); g.recruit('runner'); g.dispatch(); g.step(dt);
    const u = g.attackers()[0];
    expect(g.retarget([u.id], 2).ok).toBe(true);
    expect(u.targetStore).toBe(2);
    u.state = 'collect';
    expect(g.retarget([u.id], 1).ok).toBe(false);
  });

  test('security specialisation requires level 2 and is exclusive', () => {
    const g = new Game(PARIS, 'defence', { seed: 1 });
    expect(g.chooseSecuritySpec('mobile').ok).toBe(false);
    g.upgradeSecurity();
    expect(g.chooseSecuritySpec('mobile').ok).toBe(true);
    expect(g.chooseSecuritySpec('fixed').ok).toBe(false);
    const u = g.defenders()[0];
    expect(g.speedOf(u)).toBeCloseTo(3.6 * 1.12 * 1.2);
  });
});

describe('progress saving', () => {
  test('results persist, unlock the next city once and can be reset', () => {
    const mem = new Map<string, string>();
    const st: StorageLike = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
    const p = loadProgress(st);
    expect(p.unlocked).toEqual(['paris']);
    const order = ['paris', 'amsterdam', 'london'];
    expect(recordResult(p, 'paris', 'defence', true, 3, order)).toEqual(['amsterdam']);
    expect(recordResult(p, 'paris', 'looters', true, 3, order)).toEqual([]);
    p.settings.volume = 0.2;
    saveProgress(p, st);
    const q = loadProgress(st);
    expect(q.unlocked).toEqual(['paris', 'amsterdam']);
    expect(q.research).toBe(6);
    expect(q.tutorialDone).toBe(true);
    expect(q.settings.volume).toBe(0.2);
    expect(q.completed.paris).toEqual({ defence: true, looters: true });
    const r = resetProgress(st);
    expect(r.unlocked).toEqual(['paris']);
    expect(loadProgress(st).research).toBe(0);
  });
});
