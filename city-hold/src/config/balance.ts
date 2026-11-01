// Central balancing values. All numbers are adjustable design proposals (see docs/GAME_DESIGN.md).
// Distances are in metres, times in seconds, speeds in m/s.

export type DefKind = 'security' | 'shield' | 'firefighter';
export type AttKind = 'runner' | 'carrier' | 'heavy' | 'vandal' | 'thrower';
export type UnitKind = DefKind | AttKind;

export const BALANCE = {
  tickRate: 30,
  defence: {
    startBudget: 1500,
    waveReward: 350,
    waves: 12,
    storesNeededToWin: 2,
    storeStructure: 100,
    storeStock: 100,
    costs: { security: 250, shield: 400, barrier: 150, camera: 200, concrete: 350, firefighter: 250, boards: 120, repair: 200 },
    /** plywood boards: a protection layer in front of the shopfront, broken before the shutter takes damage */
    boardsHp: 50,
    maxDefenders: 14,
  },
  looters: {
    startBudget: 1000,
    timeLimit: 8 * 60,
    targetStock: 60,
    costs: { runner: 100, carrier: 150, vandal: 200, heavy: 200, thrower: 175 } as Record<AttKind, number>,
    budgetPerExtractedStock: 25,
    upgradeCost: 300,
    capacityUpgrade: 1.3,
    speedUpgrade: 1.15,
    maxActive: 14,
    /** AI defence composition and income in looter mode */
    ai: { security: 1, shield: 1, camera: true, income: 90, incomeEvery: 40, maxSecurity: 4, reinforceAfter: 45 },
  },
  units: {
    security: { speed: 3.6, sight: 9, restrainTime: 2.0, radius: 0.35 },
    shield: { speed: 2.1, sight: 6, holdRadius: 1.9, holdMax: 3, holdTime: 4, restrainRate: 0.1, radius: 0.45 },
    firefighter: { speed: 2.8, sight: 0, extinguishTime: 4, radius: 0.35 },
    runner: { speed: 4.0, capacity: 5, breakRate: 7, resist: 1.25, radius: 0.32 },
    carrier: { speed: 3.0, capacity: 8, breakRate: 9, resist: 1.0, radius: 0.35 },
    heavy: { speed: 2.4, capacity: 10, breakRate: 9, resist: 0.85, radius: 0.4 },
    vandal: { speed: 3.0, capacity: 2, breakRate: 28, resist: 1.1, radius: 0.38 },
    thrower: { speed: 3.3, capacity: 3, breakRate: 8, resist: 1.05, radius: 0.35 },
  },
  loadedSpeedFactor: 0.75,
  collectTimePerStock: 0.3,
  barrier: { hp: 60, concreteHp: 120, extraPathCost: 14 },
  camera: { radius: 12, detectDelay: 1.0, wideRadius: 18, fastDelay: 0.25, responseBoost: 1.5 },
  unloadedSightDetectDelay: 0.6,
  fire: { storeDamagePerSec: 1.2, vandalIgniteChance: 0.55, max: 4, groundBurnSec: 5, scorchAfterSec: 2 },
  /** neutral people: no gameplay effect, they react to danger (design: civilians remain neutral) */
  npc: { civilians: { mobile: 3, desktop: 6 }, fleeRadius: 7, fireRadius: 8, walkSpeed: 1.4, runSpeed: 3.4, spawnEvery: 6 },
  /** fictional thrown incendiary (game object only). All values are tunable game balance. */
  throw: {
    range: 12, minRange: 3,            // metres from the thrower to the aim point
    releaseAt: 0.45, duration: 1.15,   // animation timing (s): wind-up -> release -> follow-through -> recover
    cooldown: 5, throwsPerUnit: 2,
    flightSpeed: 10, apex: 2.6,        // horizontal m/s and extra arc height (m)
    handHeight: 1.9, igniteRadius: 2.2,
    maxActive: { mobile: 4, desktop: 8 }, // projectiles alive at once
  },
  upgrades: {
    shutter: [
      { level: 2, cost: 300, addCapacity: 60 },
      { level: 3, cost: 500, addCapacity: 100 },
    ],
    securityTraining: { cost: 250, speedMul: 1.12, restrainMul: 0.85 },
    securitySpec: {
      cost: 200,
      mobile: { speedMul: 1.2, sightAdd: 4 },
      fixed: { restrainMul: 0.6, leash: 6 },
    },
    cameraSpec: { cost: 150 },
  },
  supplyTruck: { reward: 200, speed: 3.2 },
  research: {
    winPoints: 3,
    lossPoints: 1,
    perks: [
      { id: 'budget', name: '+100 starting budget (both sides)', cost: 3 },
      { id: 'restrain', name: 'Defenders restrain 10% faster', cost: 4 },
      { id: 'carry', name: 'Looter units carry +1 stock', cost: 4 },
    ],
  },
};

/** Defence-mode wave composition. Later waves add runners, vandals and heavy carriers. */
export function waveComposition(wave: number): AttKind[] {
  const list: AttKind[] = [];
  const base = 3 + Math.round(wave * 1.7); // wave 1 -> 4 offenders
  for (let i = 0; i < base; i++) list.push('carrier');
  if (wave >= 3) for (let i = 0; i < Math.floor((wave - 1) / 2); i++) list.push('runner');
  if (wave >= 5) for (let i = 0; i < Math.floor((wave - 3) / 2); i++) list.push('vandal');
  if (wave >= 7) for (let i = 0; i < Math.floor((wave - 5) / 2); i++) list.push('heavy');
  if (wave >= 4) for (let i = 0; i < Math.floor((wave - 1) / 3); i++) list.push('thrower');
  // replace some carriers so headcount does not explode
  const extra = list.length - base;
  for (let i = 0; i < Math.floor(extra / 2); i++) list.shift();
  return list;
}

export type Difficulty = 'normal' | 'hard' | 'expert';
/** mission difficulty: defence waves grow, looter-mode AI defence gets more income and guards */
export const DIFFICULTY: Record<Difficulty, { waveMul: number; aiIncomeMul: number; aiExtraSecurity: number }> = {
  normal: { waveMul: 1, aiIncomeMul: 1, aiExtraSecurity: 0 },
  hard: { waveMul: 1.3, aiIncomeMul: 1.5, aiExtraSecurity: 1 },
  expert: { waveMul: 1.6, aiIncomeMul: 2, aiExtraSecurity: 2 },
};

export const KIND_LABEL: Record<UnitKind, string> = {
  security: 'Security team',
  shield: 'Shield team',
  firefighter: 'Firefighter',
  runner: 'Runner',
  carrier: 'Carrier',
  heavy: 'Heavy carrier',
  vandal: 'Vandal',
  thrower: 'Thrower',
};
