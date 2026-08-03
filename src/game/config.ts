// ---------------------------------------------------------------------------
// Client mirror of server/slot/config.js.
//
// This exists for two reasons:
//   1. Rendering — the paytable UI and symbol grid need to know the symbols,
//      payouts and layout.
//   2. Trustless verification — src/game/engine.ts re-runs a spin entirely in
//      the browser from the revealed seed, so it needs the exact same maths.
//
// The values here MUST stay byte-for-byte identical to the server config. The
// engine test (server/slot/test.js) and the verify page together catch drift:
// if this mirror diverges, verification of a real round fails visibly.
// ---------------------------------------------------------------------------

export type SymbolId =
  | 'WILD' | 'SCATTER'
  | 'HERO_F' | 'HERO_M' | 'GEM' | 'PLANET' | 'ORB_B' | 'ORB_O'
  | 'A' | 'K' | 'Q' | 'J';

export const SYMBOLS: SymbolId[] = [
  'WILD', 'SCATTER', 'HERO_F', 'HERO_M', 'GEM', 'PLANET', 'ORB_B', 'ORB_O', 'A', 'K', 'Q', 'J',
];

// Base paytable (× per-line bet) for 3 / 4 / 5 of a kind. Authored at the 96%
// point; the RTP band applies a scalar on top.
export const PAYTABLE: Record<SymbolId, [number, number, number]> = {
  WILD: [100, 500, 2000],
  HERO_F: [100, 400, 1500],
  HERO_M: [60, 250, 1000],
  GEM: [50, 200, 750],
  PLANET: [40, 150, 600],
  ORB_B: [25, 100, 400],
  ORB_O: [25, 100, 400],
  A: [15, 60, 250],
  K: [10, 50, 200],
  Q: [5, 30, 120],
  J: [5, 30, 120],
  SCATTER: [0, 0, 0], // pays via SCATTER_PAY, not on lines
};

export const SCATTER_PAY: Record<number, number> = { 3: 1, 4: 5, 5: 20 };
export const FREE_SPINS_AWARD: Record<number, number> = { 3: 8, 4: 12, 5: 15 };
export const FREE_SPINS_RETRIGGER = 5;

export const WILD_SUBS: Set<SymbolId> = new Set<SymbolId>([
  'HERO_F', 'HERO_M', 'GEM', 'PLANET', 'ORB_B', 'ORB_O', 'A', 'K', 'Q', 'J',
]);

export const RTP_SCALE: Record<string, number> = {
  '92': 1.0099 * (92 / 96),
  '94': 1.0099 * (94 / 96),
  '96': 1.0099,
  '97': 1.0099 * (97 / 96),
};

export const MULTIPLIER_LADDER_BASE = [1, 2, 3, 5];
export const MULTIPLIER_LADDER_FREE = [2, 3, 5, 8, 12];

export const JACKPOT_TIERS = ['MINI', 'MINOR', 'MAJOR', 'GRAND'] as const;
export type JackpotTier = (typeof JACKPOT_TIERS)[number];

export const JACKPOTS = {
  order: JACKPOT_TIERS,
  seeds: { MINI: 100, MINOR: 250, MAJOR: 12500, GRAND: 125000 } as Record<JackpotTier, number>,
  rate: { MINI: 0.002, MINOR: 0.003, MAJOR: 0.004, GRAND: 0.006 } as Record<JackpotTier, number>,
  tierWeights: { MINI: 1000, MINOR: 220, MAJOR: 18, GRAND: 2 } as Record<JackpotTier, number>,
  triggerBaseChance: 1 / 60000,
  triggerRefBet: 2.5,
  triggerMaxChance: 1 / 8000,
};

export const BUY_FEATURE_COST = 100; // × total bet
export const MAX_WIN_X = 12000;

// The shipped 5×3 / 25-line layout. Rows top→bottom, one per reel (column).
export const LAYOUT_5x3 = {
  reels: 5,
  rows: 3,
  lines: [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2],
    [2, 2, 1, 0, 0], [1, 2, 2, 2, 1], [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [1, 2, 1, 0, 1],
    [1, 0, 1, 2, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
    [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 0, 2, 0],
    [2, 0, 2, 0, 2], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2],
    [0, 2, 2, 2, 0], [2, 0, 0, 0, 2], [1, 0, 2, 0, 1],
    [1, 2, 0, 2, 1],
  ] as number[][],
};

// Per-reel weighted tables (mirror of reelSet()). SCATTER present on the initial
// drop; WILD richer in the middle reels; no COIN (jackpot is a mystery roll).
export interface WeightEntry { id: SymbolId; weight: number; }

export function reelSet(): WeightEntry[][] {
  // Order MUST match server/slot/config.js exactly: the weighted picker walks
  // entries in order, so WILD sits before SCATTER (its position in the server's
  // base map) — a swap here silently desyncs verification. The parity test in
  // the repo cross-checks this against real server rounds.
  const wildByReel = [2.2, 3.4, 3.8, 3.4, 2.2];
  const ordered: [SymbolId, number][] = [
    ['HERO_F', 3], ['HERO_M', 5], ['GEM', 7], ['PLANET', 9],
    ['ORB_B', 12], ['ORB_O', 12], ['A', 16], ['K', 18], ['Q', 20], ['J', 20],
    ['WILD', 0], ['SCATTER', 2],
  ];
  const reels: WeightEntry[][] = [];
  for (let r = 0; r < 5; r++) {
    const table: WeightEntry[] = [];
    for (const [id, weight] of ordered) {
      const w = id === 'WILD' ? wildByReel[r] : weight;
      if (w > 0) table.push({ id, weight: w });
    }
    reels.push(table);
  }
  return reels;
}

export interface ResolvedConfig {
  rtpBand: string;
  grid: typeof LAYOUT_5x3;
  reels: WeightEntry[][];
  paytable: Record<SymbolId, [number, number, number]>;
  scatterPay: Record<number, number>;
  freeSpinsAward: Record<number, number>;
  freeSpinsRetrigger: number;
  wildSubs: Set<SymbolId>;
  ladderBase: number[];
  ladderFree: number[];
  jackpots: typeof JACKPOTS;
  maxWinX: number;
}

export function makeConfig(rtp = '96'): ResolvedConfig {
  const scale = RTP_SCALE[rtp] ?? RTP_SCALE['96'];
  const paytable = {} as Record<SymbolId, [number, number, number]>;
  for (const id of Object.keys(PAYTABLE) as SymbolId[]) {
    const row = PAYTABLE[id];
    paytable[id] = [row[0] * scale, row[1] * scale, row[2] * scale];
  }
  return {
    rtpBand: rtp,
    grid: LAYOUT_5x3,
    reels: reelSet(),
    paytable,
    scatterPay: SCATTER_PAY,
    freeSpinsAward: FREE_SPINS_AWARD,
    freeSpinsRetrigger: FREE_SPINS_RETRIGGER,
    wildSubs: WILD_SUBS,
    ladderBase: MULTIPLIER_LADDER_BASE,
    ladderFree: MULTIPLIER_LADDER_FREE,
    jackpots: JACKPOTS,
    maxWinX: MAX_WIN_X,
  };
}
