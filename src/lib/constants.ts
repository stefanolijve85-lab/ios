// Mirror of the curve constant in server/config.js. Kept tiny on purpose.
export const GROWTH_K = 0.21;
export const MAX_RUN_MS = 22000;
export const MAX_MULTIPLIER = 100.0;

// The same pure multiplier function the server uses, so the UI animates the
// vault at 60fps from the shared startTime without streaming every frame.
export function multiplierAt(elapsedMs: number): number {
  if (elapsedMs <= 0) return 1.0;
  return Math.exp(GROWTH_K * (elapsedMs / 1000));
}

// Dynamic multiplier ladder shown down the right edge of the vault.
// As the live multiplier climbs past the current top rung, the whole ladder
// rescales up to a higher "nice" ceiling, so the game can show far more than
// 23x. Rungs are log-spaced, so the numbers grow toward the top.
export const LADDER_ROWS = 9;
const LADDER_TIERS = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

function niceRung(v: number): number {
  if (v < 10) return Math.round(v * 2) / 2;       // .5 steps
  if (v < 100) return Math.round(v / 5) * 5;      // 5 steps
  if (v < 1000) return Math.round(v / 10) * 10;   // 10 steps
  return Math.round(v / 50) * 50;                 // 50 steps
}

// Smallest "nice" ceiling that keeps the live multiplier comfortably below the
// top rung (12% headroom). Grows the ladder as the round runs hotter.
export function ladderTopFor(m: number): number {
  for (const t of LADDER_TIERS) if (t >= m * 1.12) return t;
  return LADDER_TIERS[LADDER_TIERS.length - 1];
}

// Descending, log-spaced rung labels from `top` down to 1.00x.
export function ladderRungs(top: number): number[] {
  const N = LADDER_ROWS;
  const out: number[] = [];
  for (let i = N - 1; i >= 0; i--) {
    const v = Math.pow(top, i / (N - 1)); // log-spaced 1..top
    out.push(i === N - 1 ? top : i === 0 ? 1 : niceRung(v));
  }
  // drop consecutive duplicates (can happen at the smallest tier)
  return out.filter((v, i) => i === 0 || v !== out[i - 1]);
}

export const QUICK_CHIPS = [1, 5, 10, 50, 100];
export const QUICK_CHIPS_BIG = [500, 1000, 5000, 10000];
