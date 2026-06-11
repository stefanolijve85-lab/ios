/**
 * Offline game engine — runs the entire game in the browser with no backend.
 * Used for the static GitHub Pages demo build (VITE_OFFLINE=1). It mirrors the
 * server's provably-fair algorithm via the Web-Crypto implementation in
 * provablyFair.ts, and persists a guest balance/seed/nonce in localStorage.
 *
 * Multiplayer features (live chat, global leaderboards) are local-only here.
 */
import { computeRound, resolveStep, sha256Hex } from './provablyFair.js';
import type { GameConfig, PublicRoundState, RoundReveal, RowOutcome, Side, StepResult, User } from './types.js';

const MULTS = [1.03, 1.08, 1.15, 1.24, 1.36, 1.51, 1.7, 1.95, 2.3, 2.8, 3.5, 4.5];
const HOUSE_EDGE = 0.02;
const KEY = 'gb_offline_v1';

interface Persist {
  balance: number;
  clientSeed: string;
  nonce: number;
  history: any[];
}

function rndHex(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const round2 = (n: number) => Math.round(n * 100) / 100;

function load(): Persist {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || '');
    if (r && typeof r.balance === 'number') return r;
  } catch { /* fall through */ }
  return { balance: 1000, clientSeed: rndHex(8), nonce: 1, history: [] };
}
let p = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(p));

function user(): User {
  return { id: 'guest', username: 'You', email: null, balance: round2(p.balance), isAdmin: false, clientSeed: p.clientSeed, nonce: p.nonce };
}

interface Active {
  id: string; bet: number; serverSeed: string; serverSeedHash: string; clientSeed: string;
  nonce: number; layout: RowOutcome[]; picks: Side[]; currentRow: number;
  status: 'active' | 'cashed_out' | 'busted'; multiplier: number; payout: number;
}
let active: Active | null = null;

function config(): GameConfig {
  return { rows: MULTS.length, multipliers: MULTS, minBet: 0.1, maxBet: 1000, maxPayout: 100000 };
}

function pub(): PublicRoundState {
  const a = active!;
  const next = MULTS[a.currentRow] ?? a.multiplier;
  return {
    id: a.id, bet: a.bet, serverSeedHash: a.serverSeedHash, clientSeed: a.clientSeed, nonce: a.nonce,
    rows: MULTS.length, multipliers: MULTS, currentRow: a.currentRow, status: a.status, multiplier: a.multiplier,
    potentialPayout: a.status === 'active' ? round2(a.bet * next) : a.payout,
  };
}
function reveal(): RoundReveal {
  const a = active!;
  return { serverSeed: a.serverSeed, serverSeedHash: a.serverSeedHash, clientSeed: a.clientSeed, nonce: a.nonce, layout: a.layout, picks: a.picks };
}

function finalize() {
  const a = active!;
  if (a.status === 'cashed_out') p.balance = round2(p.balance + a.payout);
  p.nonce += 1;
  p.history.unshift({
    id: a.id, bet: a.bet, multiplier: a.multiplier, payout: a.payout,
    status: a.status === 'cashed_out' ? 'cashed_out' : 'busted',
    serverSeed: a.serverSeed, clientSeed: a.clientSeed, nonce: a.nonce, createdAt: Date.now(),
  });
  p.history = p.history.slice(0, 50);
  save();
}

const seedFeed = ['LuckyOne', 'CryptoKing', 'NightOwl', 'AceWin', 'HighRoller'];

export const offline = {
  async me(): Promise<{ token: string; user: User }> {
    return { token: 'guest', user: user() };
  },
  async authMe(): Promise<{ user: User }> {
    return { user: user() };
  },
  config(): GameConfig {
    return config();
  },
  state(): { round: PublicRoundState | null; user: User } {
    return { round: active && active.status === 'active' ? pub() : null, user: user() };
  },

  async start(bet: number, clientSeed?: string) {
    if (!(bet >= 0.1 && bet <= 1000)) throw new Error('Bet must be between 0.1 and 1000');
    if (p.balance < bet) throw new Error('Insufficient balance');
    const serverSeed = rndHex();
    const seed = (clientSeed && clientSeed.trim()) || p.clientSeed || rndHex(8);
    const layout = await computeRound(serverSeed, seed, p.nonce, MULTS, HOUSE_EDGE);
    const serverSeedHash = await sha256Hex(serverSeed);
    p.balance = round2(p.balance - bet);
    save();
    active = { id: 'r_' + rndHex(4), bet, serverSeed, serverSeedHash, clientSeed: seed, nonce: p.nonce, layout, picks: [], currentRow: 0, status: 'active', multiplier: 1, payout: 0 };
    return { round: pub(), user: user() };
  },

  step(pick: Side): { result: StepResult; round: PublicRoundState | null; user: User } {
    const a = active!;
    if (!a || a.status !== 'active') throw new Error('No active round');
    const o = a.layout[a.currentRow];
    a.picks.push(pick);
    if (!resolveStep(o, pick)) {
      a.status = 'busted'; a.multiplier = 0; a.payout = 0;
      const result: StepResult = { safe: false, trapSide: o.trapSide, pick, row: o.row, multiplier: 0, status: 'busted', reveal: reveal() };
      finalize();
      return { result, round: null, user: user() };
    }
    a.currentRow += 1;
    a.multiplier = o.multiplier;
    if (a.currentRow >= MULTS.length) {
      a.payout = round2(a.bet * a.multiplier); a.status = 'cashed_out';
      const result: StepResult = { safe: true, trapSide: o.trapSide, pick, row: o.row, multiplier: a.multiplier, status: 'cashed_out', reveal: reveal() };
      finalize();
      return { result, round: null, user: user() };
    }
    return { result: { safe: true, trapSide: o.trapSide, pick, row: o.row, multiplier: a.multiplier, status: 'active' }, round: pub(), user: user() };
  },

  cashout(): { result: StepResult; round: null; user: User } {
    const a = active!;
    if (!a || a.status !== 'active') throw new Error('No active round');
    if (a.currentRow === 0) throw new Error('Cannot cash out before the first jump');
    a.payout = round2(a.bet * a.multiplier); a.status = 'cashed_out';
    const result: StepResult = { safe: true, trapSide: a.layout[a.currentRow - 1].trapSide, pick: a.picks[a.currentRow - 1], row: a.currentRow, multiplier: a.multiplier, status: 'cashed_out', reveal: reveal() };
    finalize();
    return { result, round: null, user: user() };
  },

  setClientSeed(clientSeed: string) {
    p.clientSeed = clientSeed; save();
    return { user: user() };
  },
  rotateSeed() {
    p.clientSeed = rndHex(8); save();
    return { user: user() };
  },
  history() {
    return { rounds: p.history };
  },
  leaderboards() {
    const recent = p.history.map((r) => ({ username: 'You', bet: r.bet, multiplier: r.multiplier, payout: r.payout, status: r.status, createdAt: r.createdAt }));
    // sprinkle a few demo entries so the boards aren't empty in the demo
    const demo = seedFeed.map((u, i) => ({ username: u, bet: [5, 10, 25][i % 3], multiplier: [2.3, 1.95, 3.5, 2.8, 1.7][i], payout: round2([5, 10, 25][i % 3] * [2.3, 1.95, 3.5, 2.8, 1.7][i]), status: 'cashed_out', createdAt: Date.now() - i * 60000 }));
    const all = [...recent, ...demo];
    return {
      topWins: [...all].sort((a, b) => b.payout - a.payout).slice(0, 10),
      topMultipliers: [...all].sort((a, b) => b.multiplier - a.multiplier).slice(0, 10),
      recent: all.slice(0, 15),
    };
  },
};

export const OFFLINE = (import.meta as any).env?.VITE_OFFLINE === '1';
