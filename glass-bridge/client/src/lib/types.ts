export type Side = 'LEFT' | 'RIGHT';
export type RoundStatus = 'active' | 'cashed_out' | 'busted';

export interface User {
  id: string;
  username: string;
  email: string | null;
  balance: number;
  isAdmin: boolean;
  clientSeed: string;
  nonce: number;
}

export interface PublicRoundState {
  id: string;
  bet: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  rows: number;
  multipliers: number[];
  currentRow: number;
  status: RoundStatus;
  multiplier: number;
  potentialPayout: number;
}

export interface RoundReveal {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  layout: RowOutcome[];
  picks: Side[];
}

export interface RowOutcome {
  row: number;
  trapSide: Side;
  roll: number;
  armProb: number;
  armed: boolean;
  multiplier: number;
}

export interface StepResult {
  safe: boolean;
  trapSide: Side;
  pick: Side;
  row: number;
  multiplier: number;
  status: RoundStatus;
  reveal?: RoundReveal;
}

export interface GameConfig {
  rows: number;
  multipliers: number[];
  minBet: number;
  maxBet: number;
  maxPayout: number;
}

export interface FeedItem {
  username: string;
  bet: number;
  multiplier: number;
  payout: number;
  status: RoundStatus;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  body: string;
  createdAt: number;
}
