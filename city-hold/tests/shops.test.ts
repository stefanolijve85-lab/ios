import { describe, expect, test } from 'vitest';
import { Game } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';
import { getShopVisualState, visibleStockCount } from '../src/render/shopVisualState';
import { mapReachability } from './helpers';

const dt = 1 / 30;

describe('shop visual state (port of integration/shopVisualState.mjs)', () => {
  test('damage and stock are independent', () => {
    const fullDamaged = getShopVisualState({ damage: 0.9, stockRatio: 1, breach: true });
    expect(fullDamaged.groups.glass_broken).toBe(true);
    expect(fullDamaged.groups.stock).toBe(true);
    expect(fullDamaged.referenceState).toBe('damaged');
    const emptyIntact = getShopVisualState({ damage: 0, stockRatio: 0 });
    expect(emptyIntact.groups.glass_intact).toBe(true);
    expect(emptyIntact.groups.stock).toBe(false);
    expect(emptyIntact.referenceState).toBe('intact');
    expect(getShopVisualState({ damage: 0.8, stockRatio: 0.05, breach: true }).referenceState).toBe('looted');
  });
  test('boards are a protection layer, also over broken glass; bent shutter only at heavy damage', () => {
    const v = getShopVisualState({ damage: 0.5, boardHealth: 0.6, stockRatio: 1 });
    expect(v.referenceState).toBe('boarded');
    expect(v.groups.boards && v.groups.glass_broken).toBe(true);
    expect(getShopVisualState({ damage: 0.5 }).groups.shutter_bent).toBe(false);
    expect(getShopVisualState({ damage: 0.6 }).groups.shutter_bent).toBe(true);
  });
  test('stock slots in fixed proportion, inputs clamped', () => {
    expect(visibleStockCount(40, 0.5)).toBe(20);
    expect(visibleStockCount(40, 0)).toBe(0);
    expect(visibleStockCount(40, 7)).toBe(40);
    expect(getShopVisualState({ damage: NaN, stockRatio: NaN }).visibleStockFraction).toBe(1);
  });
});

describe('boards and repair in the simulation', () => {
  test('boards absorb an attack before the shutter takes damage', () => {
    const g = new Game(PARIS, 'defence', { seed: 3 });
    expect(g.boardUp(0).ok).toBe(true);
    expect(g.budget).toBe(1500 - BALANCE.defence.costs.boards);
    const s = g.stores[0];
    expect(s.boards).toBe(s.boardsMax);
    g.units = []; g.phase = 'wave';
    const a = g.spawnAttacker('vandal', 'nw', 0);
    a.x = s.door.x; a.z = s.door.z + 0.4; a.path = null; a.state = 'breach'; a.targetStore = 0;
    g.step(dt);
    expect(s.boards).toBeLessThan(s.boardsMax);
    expect(s.structure).toBe(s.maxStructure);
    for (let i = 0; i < 30 * 3 && s.boards > 0; i++) g.step(dt);
    expect(s.boards).toBe(0);
    for (let i = 0; i < 30; i++) g.step(dt);
    expect(s.structure).toBeLessThan(s.maxStructure);
    expect(s.stock).toBe(100); // breaking in never removes stock by itself
  });

  test('repair restores glass and shutter but never refills stock, and only between waves', () => {
    const g = new Game(PARIS, 'defence', { seed: 4 });
    const s = g.stores[1];
    s.structure = 0; s.stock = 37;
    g.phase = 'wave';
    expect(g.repairStore(1).ok).toBe(false);
    g.phase = 'prep';
    const b = g.budget;
    expect(g.repairStore(1).ok).toBe(true);
    expect(s.structure).toBe(s.maxStructure);
    expect(s.stock).toBe(37);
    expect(g.budget).toBe(b - BALANCE.defence.costs.repair);
    expect(g.repairStore(1).ok).toBe(false); // nothing left to repair
  });

  test('a breached store can still be full; extraction accounting is unchanged', () => {
    const g = new Game(PARIS, 'defence', { seed: 5 });
    g.units = []; g.phase = 'wave';
    g.stores[2].structure = 0;
    expect(g.stores[2].stock).toBe(100);
    const u = g.spawnAttacker('carrier', 'ne', 2, 'ne');
    for (let i = 0; i < 30 * 60 && g.units.includes(u); i++) g.step(dt);
    expect(g.stores[2].stock).toBe(100 - BALANCE.units.carrier.capacity);
    expect(g.extracted).toBe(BALANCE.units.carrier.capacity);
    expect(g.stores[2].reserved).toBe(0);
  });

  test('decorative shops do not change navigation or gameplay stores', () => {
    expect(PARIS.stores.length).toBe(3);
    expect((PARIS.decorShops ?? []).length).toBe(3);
    expect(mapReachability(PARIS)).toEqual([]);
    const g = new Game(PARIS, 'defence');
    for (const d of PARIS.decorShops ?? []) { const p = { x: d.front.x + d.normal.x * 1.5, z: d.front.z + d.normal.z * 1.5 }; expect(g.nav.walkable(p.x, p.z), d.brand).toBe(true); }
  });
});
