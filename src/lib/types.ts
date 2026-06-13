export type Phase = 'betting' | 'running' | 'crashed';

export interface GameState {
  roundId: number;
  phase: Phase;
  now: number; // server clock when payload was built
  startTime: number; // server clock when running began (0 otherwise)
  phaseEndsAt: number;
  crashPoint?: number; // present only when phase === 'crashed'
  multiplier: number;
  holders: number;
  startHolders: number;
  holdersTimeline: number[];
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
}
