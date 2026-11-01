import { describe, expect, test } from 'vitest';
import { Game, type GameEvent } from '../src/sim/game';
import { PARIS } from '../src/maps/paris';
import { BALANCE } from '../src/config/balance';
import { autoLooter } from './helpers';

const dt = 1 / 30;

/** The complete loop on the Paris street, step by step, with money checked at every stage. */
describe('full game loop on the Paris street', () => {
  test('defence: place -> start wave -> protect -> intercept -> reward -> upgrade', () => {
    const g = new Game(PARIS, 'defence', { seed: 21 });
    const events: GameEvent[] = [];
    // 1. place defences
    expect(g.place('barrier', 'L1').ok).toBe(true);
    expect(g.place('camera', 'p7').ok).toBe(true);
    expect(g.buyUnit('security').ok).toBe(true);
    expect(g.buyUnit('shield').ok).toBe(true);
    const sec = g.defenders().filter((d) => d.kind === 'security');
    g.moveUnits([sec[0].id], -10, -8); g.moveUnits([sec[1].id], 10, -8);
    g.moveUnits([g.defenders().find((d) => d.kind === 'shield')!.id], 0, -11);
    const spent = 150 + 200 + 250 + 400;
    expect(g.budget).toBe(1500 - spent);
    // 2. start the wave
    expect(g.startWave().ok).toBe(true);
    expect(g.phase).toBe('wave');
    // 3 + 4. offenders attack; defenders hold and intercept
    for (let i = 0; i < 30 * 300 && g.phase === 'wave'; i++) { g.step(dt); events.push(...g.drainEvents()); }
    expect(g.phase).toBe('prep');
    expect(events.some((e) => e.type === 'intercept')).toBe(true);
    expect(g.intercepted).toBeGreaterThan(0);
    expect(g.storesWithStock()).toBe(3);
    // 5. reward exactly once
    expect(events.filter((e) => e.type === 'waveEnd').length).toBe(1);
    const afterReward = 1500 - spent + BALANCE.defence.waveReward;
    expect(g.budget).toBe(afterReward);
    // 6. spend the reward on upgrades with visible stat changes
    expect(g.upgradeShutter(1).ok).toBe(true);
    expect(g.stores[1].maxStructure).toBe(160);
    expect(g.budget).toBe(afterReward - 300);
    expect(g.upgradeSecurity().ok).toBe(true);
    expect(g.speedOf(sec[0])).toBeCloseTo(BALANCE.units.security.speed * BALANCE.upgrades.securityTraining.speedMul);
    // and the loop continues with wave 2
    expect(g.wave).toBe(2);
    expect(g.startWave().ok).toBe(true);
  });

  test('looters: recruit -> dispatch -> loot -> extract -> reward -> upgrade', () => {
    let done = false;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const g = new Game(PARIS, 'looters', { seed });
      const ai = autoLooter(g);
      const events: GameEvent[] = [];
      let budgetBefore = -1; let extractedAmount = 0;
      for (let i = 0; i < 30 * 480 && !g.over; i++) {
        if (g.attackers().length + g.dispatchQueue.length === 0) ai(g);
        const before = g.budget;
        g.step(dt);
        const ev = g.drainEvents(); events.push(...ev);
        const ex = ev.find((e) => e.type === 'extract');
        if (ex) { budgetBefore = before; extractedAmount = ex.amount!; break; }
      }
      if (budgetBefore < 0) continue;
      // stock leaves the store only on extraction and the reward is paid once per point extracted
      expect(events.some((e) => e.type === 'dispatch')).toBe(true);
      expect(events.some((e) => e.type === 'collect')).toBe(true);
      expect(g.budget).toBe(budgetBefore + extractedAmount * BALANCE.looters.budgetPerExtractedStock);
      expect(g.stores.reduce((a, s) => a + s.lost, 0)).toBe(extractedAmount);
      // upgrade with the reward (top up only if this run happened to spend everything on recruits)
      if (g.budget < BALANCE.looters.upgradeCost) continue;
      const b = g.budget;
      expect(g.looterUpgradeChoose('speed').ok).toBe(true);
      expect(g.budget).toBe(b - BALANCE.looters.upgradeCost);
      done = true; break;
    }
    expect(done).toBe(true);
  });
});
