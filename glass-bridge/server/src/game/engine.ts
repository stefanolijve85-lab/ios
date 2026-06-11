/**
 * Authoritative per-player round engine.
 *
 * Glass Bridge is a single-player decision game (unlike a shared-clock crash
 * game): each player walks their own bridge at their own pace. The server is
 * authoritative — it commits the seeds up front, validates every step, and only
 * it can move money. The client never decides outcomes.
 */
import { computeRound, randomSeed, resolveStep, sha256, type Side, type RowOutcome } from './provablyFair.js';
import { getConfig, type GameConfig } from './config.js';

export type RoundStatus = 'active' | 'cashed_out' | 'busted';

export interface ActiveRound {
  id: string;
  userId: string;
  bet: number;
  /** Seeds & nonce committed at round start. serverSeed is secret until the round ends. */
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  config: GameConfig;
  /** Full committed layout (kept server-side, never sent to the client mid-round). */
  layout: RowOutcome[];
  /** Player's recorded choices, one per completed row. */
  picks: Side[];
  /** Index of the next row to attempt (0-based). */
  currentRow: number;
  status: RoundStatus;
  multiplier: number;
  payout: number;
  createdAt: number;
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

export interface StepResult {
  safe: boolean;
  trapSide: Side;
  pick: Side;
  row: number;
  multiplier: number;
  status: RoundStatus;
  /** Present once the round is over (busted/cashed): the revealed proof. */
  reveal?: RoundReveal;
}

export interface RoundReveal {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  layout: RowOutcome[];
  picks: Side[];
}

let counter = 0;
function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** Create and commit a new round. clientSeed is auto-generated when empty. */
export function createRound(userId: string, bet: number, clientSeed?: string, nonce = 1): ActiveRound {
  const config = getConfig();
  const serverSeed = randomSeed();
  const seed = clientSeed && clientSeed.trim() ? clientSeed.trim() : randomSeed(8);
  const layout = computeRound(serverSeed, seed, nonce, config);
  return {
    id: newId('round'),
    userId,
    bet,
    serverSeed,
    serverSeedHash: sha256(serverSeed),
    clientSeed: seed,
    nonce,
    config,
    layout,
    picks: [],
    currentRow: 0,
    status: 'active',
    multiplier: 1,
    payout: 0,
    createdAt: Date.now(),
  };
}

/** The view safe to hand to the client mid-round (no serverSeed, no layout). */
export function toPublic(round: ActiveRound): PublicRoundState {
  const next = round.config.multipliers[round.currentRow] ?? round.multiplier;
  return {
    id: round.id,
    bet: round.bet,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: round.nonce,
    rows: round.config.rows,
    multipliers: round.config.multipliers,
    currentRow: round.currentRow,
    status: round.status,
    multiplier: round.multiplier,
    potentialPayout: round.status === 'active'
      ? Math.round(round.bet * next * 100) / 100
      : round.payout,
  };
}

function reveal(round: ActiveRound): RoundReveal {
  return {
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: round.nonce,
    layout: round.layout,
    picks: round.picks,
  };
}

/** Apply one step (the player jumps LEFT or RIGHT on the current row). */
export function step(round: ActiveRound, pick: Side): StepResult {
  if (round.status !== 'active') {
    throw new Error('Round is not active');
  }
  const outcome = round.layout[round.currentRow];
  round.picks.push(pick);
  const { safe } = resolveStep(outcome, pick);

  if (!safe) {
    round.status = 'busted';
    round.multiplier = 0;
    round.payout = 0;
    return {
      safe: false,
      trapSide: outcome.trapSide,
      pick,
      row: outcome.row,
      multiplier: 0,
      status: round.status,
      reveal: reveal(round),
    };
  }

  round.currentRow += 1;
  round.multiplier = outcome.multiplier;
  const reachedEnd = round.currentRow >= round.config.rows;
  if (reachedEnd) {
    // Auto cash-out on the final row.
    cashOut(round);
  }
  return {
    safe: true,
    trapSide: outcome.trapSide,
    pick,
    row: outcome.row,
    multiplier: round.multiplier,
    status: round.status,
    reveal: round.status !== 'active' ? reveal(round) : undefined,
  };
}

/** Cash out at the current multiplier. */
export function cashOut(round: ActiveRound): StepResult {
  if (round.status !== 'active') {
    throw new Error('Round is not active');
  }
  if (round.currentRow === 0) {
    throw new Error('Cannot cash out before the first jump');
  }
  const raw = round.bet * round.multiplier;
  round.payout = Math.min(round.config.maxPayout, Math.round(raw * 100) / 100);
  round.status = 'cashed_out';
  return {
    safe: true,
    trapSide: round.layout[round.currentRow - 1].trapSide,
    pick: round.picks[round.currentRow - 1],
    row: round.currentRow,
    multiplier: round.multiplier,
    status: round.status,
    reveal: reveal(round),
  };
}
