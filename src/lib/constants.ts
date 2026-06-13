// Mirror of the curve constant in server/config.js. Kept tiny on purpose.
export const GROWTH_K = 0.21;
export const MAX_RUN_MS = 15000;
export const MAX_MULTIPLIER = 23.0;

// The same pure multiplier function the server uses, so the UI animates the
// vault at 60fps from the shared startTime without streaming every frame.
export function multiplierAt(elapsedMs: number): number {
  if (elapsedMs <= 0) return 1.0;
  return Math.exp(GROWTH_K * (elapsedMs / 1000));
}

// Multiplier ladder rungs shown down the right edge of the vault.
export const LADDER = [23, 20, 15, 10, 5, 3, 2, 1.5, 1];

export const QUICK_CHIPS = [1, 5, 10, 50, 100];
export const QUICK_CHIPS_BIG = [500, 1000, 5000, 10000];
