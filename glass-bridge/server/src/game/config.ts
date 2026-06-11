/**
 * Game configuration. Defaults can be overridden by the admin panel at runtime
 * (persisted to the `game_config` table) and by environment variables at boot.
 */
export interface GameConfig {
  /** Number of rows on the bridge. */
  rows: number;
  /** Multiplier awarded for safely standing on each row (length === rows). */
  multipliers: number[];
  /** Per-step house edge folded into the break probabilities. */
  houseEdge: number;
  /** Betting limits (in the smallest currency unit handled by the client: euros). */
  minBet: number;
  maxBet: number;
  /** Max payout the house will honour on a single round. */
  maxPayout: number;
}

/** The reference multiplier ladder from the product spec (12 rows). */
export const DEFAULT_MULTIPLIERS = [
  1.03, 1.08, 1.15, 1.24, 1.36, 1.51, 1.7, 1.95, 2.3, 2.8, 3.5, 4.5,
];

export const DEFAULT_CONFIG: GameConfig = {
  rows: DEFAULT_MULTIPLIERS.length,
  multipliers: DEFAULT_MULTIPLIERS,
  houseEdge: Number(process.env.HOUSE_EDGE ?? 0.02),
  minBet: Number(process.env.MIN_BET ?? 0.1),
  maxBet: Number(process.env.MAX_BET ?? 1000),
  maxPayout: Number(process.env.MAX_PAYOUT ?? 100000),
};

let current: GameConfig = { ...DEFAULT_CONFIG };

export function getConfig(): GameConfig {
  return current;
}

export function setConfig(patch: Partial<GameConfig>): GameConfig {
  current = { ...current, ...patch };
  // Keep rows and multipliers consistent.
  current.rows = current.multipliers.length;
  return current;
}
