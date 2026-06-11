/**
 * Game service — holds live rounds in memory and is the ONLY place money moves.
 * The bet is debited when a round starts; payouts are credited on cash-out.
 */
import { getStore } from '../db/index.js';
import { bus } from '../lib/events.js';
import type { RoundRecord } from '../db/types.js';
import { getConfig } from './config.js';
import {
  cashOut as engineCashOut,
  createRound,
  step as engineStep,
  toPublic,
  type ActiveRound,
  type PublicRoundState,
  type StepResult,
} from './engine.js';
import type { Side } from './provablyFair.js';

const activeRounds = new Map<string, ActiveRound>(); // keyed by userId

export class GameError extends Error {}

export function getActiveRound(userId: string): PublicRoundState | null {
  const r = activeRounds.get(userId);
  return r && r.status === 'active' ? toPublic(r) : null;
}

export async function startRound(userId: string, bet: number, clientSeed?: string): Promise<PublicRoundState> {
  const cfg = getConfig();
  if (!Number.isFinite(bet) || bet < cfg.minBet || bet > cfg.maxBet) {
    throw new GameError(`Bet must be between ${cfg.minBet} and ${cfg.maxBet}`);
  }
  const existing = activeRounds.get(userId);
  if (existing && existing.status === 'active') {
    throw new GameError('You already have a round in progress');
  }
  const store = getStore();
  const user = await store.getUserById(userId);
  if (!user) throw new GameError('User not found');
  if (user.balance < bet) throw new GameError('Insufficient balance');

  // Debit the bet up front.
  await store.updateUser(userId, { balance: round2(user.balance - bet) });

  const seed = (clientSeed ?? user.clientSeed) || undefined;
  const r = createRound(userId, bet, seed, user.nonce);
  activeRounds.set(userId, r);
  return toPublic(r);
}

export async function takeStep(userId: string, pick: Side): Promise<StepResult> {
  const r = activeRounds.get(userId);
  if (!r || r.status !== 'active') throw new GameError('No active round');
  const result = engineStep(r, pick);
  if (result.status !== 'active') {
    await finalize(userId, r);
  }
  return result;
}

export async function cashOut(userId: string): Promise<StepResult> {
  const r = activeRounds.get(userId);
  if (!r || r.status !== 'active') throw new GameError('No active round');
  const result = engineCashOut(r);
  await finalize(userId, r);
  return result;
}

async function finalize(userId: string, r: ActiveRound) {
  const store = getStore();
  const user = await store.getUserById(userId);
  if (!user) return;

  // Credit winnings (bet already debited at start).
  let balance = user.balance;
  if (r.status === 'cashed_out') {
    balance = round2(balance + r.payout);
  }
  // Advance the nonce so the next round uses fresh entropy.
  await store.updateUser(userId, { balance, nonce: user.nonce + 1 });

  const record: RoundRecord = {
    id: r.id,
    userId,
    username: user.username,
    bet: r.bet,
    multiplier: r.multiplier,
    payout: r.payout,
    status: r.status === 'cashed_out' ? 'cashed_out' : 'busted',
    rowsCleared: r.currentRow,
    serverSeed: r.serverSeed,
    serverSeedHash: r.serverSeedHash,
    clientSeed: r.clientSeed,
    nonce: r.nonce,
    createdAt: Date.now(),
  };
  await store.recordRound(record);
  bus.emitRound(record);

  activeRounds.delete(userId);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
