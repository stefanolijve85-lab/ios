export type Phase = 'betting' | 'running' | 'crashed';

export interface GameState {
  roundId: number;
  phase: Phase;
  now: number; // server clock when payload was built
  startTime: number; // server clock when running began (0 otherwise)
  phaseEndsAt: number;
  crashPoint?: number; // present only when phase === 'crashed'
  serverSeedHash?: string; // provably-fair commitment (every phase)
  serverSeed?: string;     // revealed only when phase === 'crashed'
  multiplier: number;
  holders: number;
  startHolders: number;
  holdersTimeline: number[];
  history?: number[]; // recent crash points (newest first)
  online: number;
}

export interface ChatMessage {
  id: number | string;
  name: string;
  text: string;
  ts: number;
  self?: boolean;
}

export type ActivityKind = 'stash' | 'lost';
export interface ActivityItem {
  kind: ActivityKind;
  name: string;
  amount: number;
  multiplier?: number;
  ts: number;
}

export interface BetState {
  amount: number;
  cashedOut: boolean;
  payout: number;
  cashedAt?: number;
  lost?: boolean;
  autoCashout?: number | null;
}

export interface LeaderboardEntry {
  name: string;
  amount: number;
  multiplier: number;
  ts: number;
}

// Responsible gaming — limits are in minor units (cents) / milliseconds; 0 = off.
export interface RgLimits {
  stakeMaxMinor: number;
  sessionWagerMaxMinor: number;
  sessionLossMaxMinor: number;
  sessionTimeMaxMs: number;
  realityCheckMs: number;
}

export interface RealityCheck {
  elapsedMs: number;
  bets: number;
  wagerMinor: number;
  payoutMinor: number;
  netMinor: number;        // +profit / −loss
  limits: RgLimits;
  intervalMs: number;
}

export interface RgLimitHit {
  reason: 'RG_SELF_EXCLUDED' | 'RG_STAKE_LIMIT' | 'RG_WAGER_LIMIT' | 'RG_LOSS_LIMIT' | 'RG_SESSION_TIME';
  message: string;
  detail: { limitMinor?: number; limitMs?: number; untilTs?: number };
}
