// Shared types for the QUANTUM SPIN client. The spin RESULT shape mirrors what
// server/slot/engine.js returns; the client renders it and never recomputes it
// during live play (only the verify page re-derives it, for auditing).

import type { SymbolId, JackpotTier } from './config';

export type Grid = SymbolId[][]; // [reel][row]

export interface LineWin {
  line: number;
  symbol: SymbolId;
  count: number;
  positions: [number, number][]; // [reel, row]
  pay: number;
}

export interface TumbleStep {
  grid: Grid;
  wins: LineWin[];
  multiplier: number;
  stepWin: number;
  removed?: [number, number][];
  refilled?: [number, number][];
}

export interface JackpotAward {
  won: boolean;
  tier: JackpotTier;
  seed: number;
  progressive: number;
  amount: number;
}

export interface SpinResult {
  layout: string;
  totalBet: number;
  lineBet: number;
  isFree: boolean;
  initialGrid: Grid;
  steps: TumbleStep[];
  finalGrid: Grid;
  lineWin: number;
  scatter: { count: number; positions: [number, number][]; win: number };
  jackpot: JackpotAward | null;
  freeSpins: { triggered: boolean; retriggered: boolean; awarded: number };
  multiplier: number;
  cappedAtMax: boolean;
  win: number;
  jackpotWin: number;
  totalPayout: number;
  nonce: number;
  serverSeedHash: string;
  clientSeed: string;
  hash: string;
  featureSummary?: { totalWin: number; spins: number };
}

export interface Jackpots {
  MINI: number;
  MINOR: number;
  MAJOR: number;
  GRAND: number;
}

export interface FreeSpinsState {
  active: boolean;
  remaining: number;
  total: number;
  totalWin: number;
  triggerBet: number;
}

export interface SessionState {
  id: string;
  balance: number;
  currency: string;
  xp: number;
  level: number;
  lines: number;
  lineBets: number[];
  rtpBand: string;
  layout: string;
  buyFeatureCost: number;
  fairness: { serverSeedHash: string; clientSeed: string; nonce: number };
  freeSpins: FreeSpinsState;
  jackpots: Jackpots;
}

export interface SpinResponse {
  ok: boolean;
  result: SpinResult;
  state: SessionState;
  error?: string;
}
