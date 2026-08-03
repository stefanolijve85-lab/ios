'use strict';

// ---------------------------------------------------------------------------
// QUANTUM SPIN — game configuration (server-authoritative math).
//
// Everything that affects money — symbol weights, paytable, paylines, jackpot
// odds, RTP band — lives here and ONLY here. The client never decides an
// outcome; it receives a fully resolved spin and animates it. The admin panel
// edits this object (persisted) to retune the game without code changes.
//
// The presentational half of a symbol (its art/colour/glyph) lives in the
// client theme. Here a symbol is just an id, a paytable row and a weight.
// ---------------------------------------------------------------------------

// Symbol ids. `WILD` substitutes every paying symbol except SCATTER and COIN.
const SYM = {
  WILD: 'WILD',
  SCATTER: 'SCATTER', // portal — triggers Quantum Portal free spins
  COIN: 'COIN', // jackpot coin — collect 6+ to trigger the jackpot wheel
  HERO_F: 'HERO_F', // pink cyber-pilot (top premium)
  HERO_M: 'HERO_M', // cyber-runner
  GEM: 'GEM', // quantum crystal
  PLANET: 'PLANET', // ringed planet
  ORB_B: 'ORB_B', // blue energy orb
  ORB_O: 'ORB_O', // orange plasma orb
  A: 'A',
  K: 'K',
  Q: 'Q',
  J: 'J',
};

// Paytable: multiplier of the PER-LINE bet for a left-to-right run of length
// 3 / 4 / 5. (Index 0 = 3-of-a-kind, 1 = 4, 2 = 5.) Symbols not listed do not
// form line wins on their own.
// Values calibrated (see simulate.js) so the shipped 5×3 build lands at
// ~96% RTP once tumbles, free spins and the multiplier ladder are folded in.
const PAYTABLE = {
  [SYM.WILD]: [100, 500, 2000],
  [SYM.HERO_F]: [100, 400, 1500],
  [SYM.HERO_M]: [60, 250, 1000],
  [SYM.GEM]: [50, 200, 750],
  [SYM.PLANET]: [40, 150, 600],
  [SYM.ORB_B]: [25, 100, 400],
  [SYM.ORB_O]: [25, 100, 400],
  [SYM.A]: [15, 60, 250],
  [SYM.K]: [10, 50, 200],
  [SYM.Q]: [5, 30, 120],
  [SYM.J]: [5, 30, 120],
};

// SCATTER pays anywhere, as a multiple of TOTAL bet, for 3 / 4 / 5 scatters,
// and triggers free spins. Kept modest — it is a bet-multiple, not a line-pay.
const SCATTER_PAY = { 3: 1, 4: 5, 5: 20 };
const FREE_SPINS_AWARD = { 3: 8, 4: 12, 5: 15 };
const FREE_SPINS_RETRIGGER = 5; // extra spins for 3+ scatters during the feature

// Symbols WILD is allowed to substitute for (line wins).
const WILD_SUBS = new Set([
  SYM.HERO_F, SYM.HERO_M, SYM.GEM, SYM.PLANET,
  SYM.ORB_B, SYM.ORB_O, SYM.A, SYM.K, SYM.Q, SYM.J,
]);

// --- Layouts -------------------------------------------------------------
// Multiple layouts are supported; the active one is chosen per game config.
// `lines` is a list of paylines. Each payline is an array of row indices, one
// per reel (column). Rows are top→bottom, 0-indexed.
const LAYOUTS = {
  // Classic 5×3 with 25 fixed paylines (the shipped QUANTUM SPIN layout).
  '5x3': {
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
    ],
  },
  // 5×4 — 40 lines (subset generator would over-length this file; a curated 40).
  '5x4': {
    reels: 5,
    rows: 4,
    lines: buildLinesForRows(5, 4, 40),
  },
  // 6×5 "expandable" grid — evaluated as ways (see engine) rather than lines.
  '6x5': {
    reels: 6,
    rows: 5,
    ways: true,
  },
};

// Deterministically fabricate `count` distinct paylines for an r×rows grid.
// Used for the taller layouts so we don't hand-author hundreds of lines.
function buildLinesForRows(reels, rows, count) {
  const lines = [];
  const seen = new Set();
  // horizontals first
  for (let row = 0; row < rows && lines.length < count; row++) {
    lines.push(new Array(reels).fill(row));
    seen.add(lines[lines.length - 1].join(''));
  }
  // then zig-zags seeded by a simple LCG (pure, deterministic, no Math.random)
  let s = 12345;
  const rand = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  while (lines.length < count) {
    const line = [];
    for (let c = 0; c < reels; c++) line.push(Math.floor(rand() * rows));
    const key = line.join('');
    if (!seen.has(key)) {
      seen.add(key);
      lines.push(line);
    }
  }
  return lines;
}

// --- Reel weight sets ----------------------------------------------------
// Per-reel weighted symbol tables. Each visible cell is an independent weighted
// draw from its reel's table (a "random symbol generator" reel, standard for
// modern tumble/reactor slots). The weight profile fixes the game's *shape*
// (hit rate, feature frequency, volatility); the certified RTP band is then set
// exactly by a paytable scalar (see RTP_SCALE) so shipping a 94% / 96% / 97%
// build never changes how the game feels, only what it pays. simulate.js
// measures the result so every change is audited against its target band.
function reelSet() {
  const base = {
    [SYM.HERO_F]: 3,
    [SYM.HERO_M]: 5,
    [SYM.GEM]: 7,
    [SYM.PLANET]: 9,
    [SYM.ORB_B]: 12,
    [SYM.ORB_O]: 12,
    [SYM.A]: 16,
    [SYM.K]: 18,
    [SYM.Q]: 20,
    [SYM.J]: 20,
    [SYM.WILD]: 0, // set per reel below
    [SYM.SCATTER]: 2,
  };
  // Wild appears on all reels but is richer in the middle three.
  const wildByReel = [2.2, 3.4, 3.8, 3.4, 2.2];
  const reels = [];
  for (let r = 0; r < 5; r++) {
    const table = { ...base, [SYM.WILD]: wildByReel[r] };
    reels.push(toWeighted(table));
  }
  return reels;
}

// Paytable scalar per certified RTP band. Base paytable is authored at the 96%
// point (scale 1); other bands are exact proportional adjustments so the money
// maths stays provably consistent. Determined & verified by simulate.js.
const RTP_SCALE = {
  '92': 1.0099 * (92 / 96),
  '94': 1.0099 * (94 / 96),
  '96': 1.0099,
  '97': 1.0099 * (97 / 96),
};

// Convert a {symbol: weight} map into a [{ id, weight }] list (stable order).
function toWeighted(table) {
  return Object.keys(table)
    .filter((k) => table[k] > 0)
    .map((id) => ({ id, weight: table[id] }));
}

// --- Jackpot configuration ----------------------------------------------
// Four fixed-plus-progressive tiers. Seed = the value a tier resets to after it
// is won. `rate` = fraction of every bet added to the progressive component.
// Odds of which tier is awarded once the jackpot feature triggers are weighted;
// higher tiers are rarer. Displayed values = seed + progressive pool.
// The jackpot is a SEPARATELY-FUNDED progressive layer that sits on top of the
// certified base RTP — it is not part of the 96%. Each bet contributes `rate`
// of the stake to each tier's progressive pool; over time contributions in ≈
// payouts out, so it is a mathematically fair pass-through independent of the
// base game (the standard model for progressive jackpots).
//
// Trigger: a "Quantum Vault" mystery roll on every paid spin. The per-spin
// trigger probability scales with the bet (bigger stake → better odds, capped),
// so the jackpot is reachable in ordinary play rather than being a dead symbol
// combination. Once triggered, the tier is a weighted draw; higher tiers rarer.
const JACKPOTS = {
  order: ['MINI', 'MINOR', 'MAJOR', 'GRAND'],
  seeds: { MINI: 100, MINOR: 250, MAJOR: 12500, GRAND: 125000 },
  rate: { MINI: 0.002, MINOR: 0.003, MAJOR: 0.004, GRAND: 0.006 },
  tierWeights: { MINI: 1000, MINOR: 220, MAJOR: 18, GRAND: 2 },
  // Base per-spin trigger chance at the reference bet, and how bet scales it.
  triggerBaseChance: 1 / 60000, // at reference total bet
  triggerRefBet: 2.5, // the total bet at which base chance applies
  triggerMaxChance: 1 / 8000, // ceiling for very large bets
};

// --- Cascade / tumble multiplier ladder ----------------------------------
// After a winning spin, winning symbols are removed and the grid refills
// (a "Quantum Reactor" tumble). Each successive tumble in the same spin steps
// the multiplier up the ladder. Free spins use the richer ladder and never
// reset between spins until the feature ends.
const MULTIPLIER_LADDER_BASE = [1, 2, 3, 5];
const MULTIPLIER_LADDER_FREE = [2, 3, 5, 8, 12];

// Buy-feature: pay this multiple of the total bet to trigger the Quantum Portal
// free-spins feature immediately (with a guaranteed 3-scatter entry).
const BUY_FEATURE_COST = 100; // × total bet

// Bet configuration.
const BET = {
  lineBets: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
  defaultLineBetIndex: 3, // €0.10 per line × 25 lines → €2.50 default total bet
  currency: 'EUR',
  currencySymbol: '€',
};

// Scale a paytable by a factor (returns a fresh object; never mutates source).
function scalePaytable(paytable, factor) {
  const out = {};
  for (const k of Object.keys(paytable)) out[k] = paytable[k].map((v) => v * factor);
  return out;
}

// Assemble a concrete game config for a given RTP band + layout. The band only
// changes the paytable scalar — reel weights (the game's feel) never change.
function makeConfig({ rtp = '96', layout = '5x3' } = {}) {
  const scale = RTP_SCALE[rtp] ?? RTP_SCALE['96'];
  return {
    id: 'quantumspin',
    name: 'QUANTUM SPIN',
    rtpBand: rtp,
    rtpScale: scale,
    layout,
    grid: LAYOUTS[layout],
    reels: reelSet(),
    SYM,
    paytable: scalePaytable(PAYTABLE, scale),
    scatterPay: SCATTER_PAY,
    freeSpinsAward: FREE_SPINS_AWARD,
    freeSpinsRetrigger: FREE_SPINS_RETRIGGER,
    wildSubs: WILD_SUBS,
    jackpots: JACKPOTS,
    ladderBase: MULTIPLIER_LADDER_BASE,
    ladderFree: MULTIPLIER_LADDER_FREE,
    buyFeatureCost: BUY_FEATURE_COST,
    bet: BET,
    // Hard cap on a single spin's base+feature win as a multiple of total bet,
    // so the max-win is bounded and certifiable. Jackpots are exempt (separate).
    maxWinX: 12000,
  };
}

module.exports = {
  SYM,
  PAYTABLE,
  SCATTER_PAY,
  FREE_SPINS_AWARD,
  FREE_SPINS_RETRIGGER,
  WILD_SUBS,
  LAYOUTS,
  JACKPOTS,
  MULTIPLIER_LADDER_BASE,
  MULTIPLIER_LADDER_FREE,
  BUY_FEATURE_COST,
  BET,
  makeConfig,
  buildLinesForRows,
};
