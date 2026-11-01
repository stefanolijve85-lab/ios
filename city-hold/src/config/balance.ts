// Central balancing values. All numbers are adjustable design proposals (see docs/GAME_DESIGN.md).
// Distances are in metres, times in seconds, speeds in m/s.

export type DefKind = 'security' | 'shield' | 'firefighter';
export type AttKind = 'runner' | 'carrier' | 'heavy' | 'vandal';
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
    costs: { security: 250, shield: 400, barrier: 150, camera: 200, concrete: 350, firefighter: 250 },
    maxDefenders: 14,
  },
  looters: {
    startBudget: 1000,
    timeLimit: 8 * 60,
    targetStock: 60,
    costs: { runner: 100, carrier: 150, vandal: 200, heavy: 200 } as Record<AttKind, number>,
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
  },
  loadedSpeedFactor: 0.75,
  collectTimePerStock: 0.3,
  barrier: { hp: 60, concreteHp: 120, extraPathCost: 14 },
  camera: { radius: 12, detectDelay: 1.0, wideRadius: 18, fastDelay: 0.25, responseBoost: 1.5 },
  unloadedSightDetectDelay: 0.6,
  fire: { storeDamagePerSec: 1.2, vandalIgniteChance: 0.55, max: 4 },
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
  // replace some carriers so headcount does not explode
  const extra = list.length - base;
  for (let i = 0; i < Math.floor(extra / 2); i++) list.shift();
  return list;
}

export const KIND_LABEL: Record<UnitKind, string> = {
  security: 'Security team',
  shield: 'Shield team',
  firefighter: 'Firefighter',
  runner: 'Runner',
  carrier: 'Carrier',
  heavy: 'Heavy carrier',
  vandal: 'Vandal',
};
