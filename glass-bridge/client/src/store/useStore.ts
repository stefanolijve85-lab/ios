import { create } from 'zustand';
import { api, setToken } from '../lib/api.js';
import { sound } from '../lib/sound.js';
import type { GameConfig, PublicRoundState, RoundReveal, Side, StepResult, User } from '../lib/types.js';

interface StepEvent {
  row: number;
  pick: Side;
  trapSide: Side;
  safe: boolean;
  multiplier: number;
}

interface State {
  user: User | null;
  config: GameConfig | null;
  round: PublicRoundState | null;
  /** Latest step result, drives the board animation. */
  lastStep: StepEvent | null;
  lastReveal: RoundReveal | null;
  /** UI status flag. */
  status: 'idle' | 'betting' | 'playing' | 'busted' | 'cashed';
  busy: boolean;
  error: string | null;
  soundOn: boolean;

  bootstrap: () => Promise<void>;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string, e?: string) => Promise<void>;
  logout: () => void;

  startRound: (bet: number, clientSeed?: string) => Promise<void>;
  jump: (pick: Side) => Promise<void>;
  cashOut: () => Promise<void>;
  resetBoard: () => void;
  setSound: (on: boolean) => void;
  refreshUser: (u: User) => void;
}

export const useStore = create<State>((set, get) => ({
  user: null,
  config: null,
  round: null,
  lastStep: null,
  lastReveal: null,
  status: 'idle',
  busy: false,
  error: null,
  soundOn: true,

  bootstrap: async () => {
    try {
      const config = await api.config().catch(() => null);
      if (config) set({ config });
    } catch { /* config requires auth; fetched after login */ }
    try {
      const { user } = await api.me();
      set({ user });
      const cfg = await api.config();
      const { round } = await api.state();
      set({ config: cfg, round, status: round ? 'playing' : 'idle' });
    } catch {
      setToken(null);
      set({ user: null });
    }
  },

  login: async (u, p) => {
    const { token, user } = await api.login(u, p);
    setToken(token);
    set({ user, error: null });
    await get().bootstrap();
  },
  register: async (u, p, e) => {
    const { token, user } = await api.register(u, p, e);
    setToken(token);
    set({ user, error: null });
    await get().bootstrap();
  },
  logout: () => {
    setToken(null);
    set({ user: null, round: null, status: 'idle', lastReveal: null });
  },

  startRound: async (bet, clientSeed) => {
    if (get().busy) return;
    set({ busy: true, error: null, lastReveal: null, lastStep: null });
    try {
      const { round, user } = await api.start(bet, clientSeed);
      sound.play('click');
      set({ round, user, status: 'playing' });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ busy: false });
    }
  },

  jump: async (pick) => {
    const { busy, round } = get();
    if (busy || !round || round.status !== 'active') return;
    set({ busy: true, error: null });
    try {
      const { result, round: next, user } = await api.step(pick);
      applyStep(set, result, next, user);
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ busy: false });
    }
  },

  cashOut: async () => {
    const { busy, round } = get();
    if (busy || !round || round.status !== 'active' || round.currentRow === 0) return;
    set({ busy: true, error: null });
    try {
      const { result, user } = await api.cashout();
      const big = result.multiplier >= 3;
      sound.play(big ? 'jackpot' : 'cashout');
      set({
        user,
        round: null,
        status: 'cashed',
        lastReveal: result.reveal ?? null,
        lastStep: { row: result.row, pick: result.pick, trapSide: result.trapSide, safe: true, multiplier: result.multiplier },
      });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ busy: false });
    }
  },

  resetBoard: () => set({ status: 'idle', round: null, lastReveal: null, lastStep: null, error: null }),
  setSound: (on) => {
    sound.enabled = on;
    set({ soundOn: on });
  },
  refreshUser: (u) => set({ user: u }),
}));

function applyStep(
  set: (partial: Partial<State>) => void,
  result: StepResult,
  next: PublicRoundState | null,
  user: User,
) {
  const event: StepEvent = {
    row: result.row,
    pick: result.pick,
    trapSide: result.trapSide,
    safe: result.safe,
    multiplier: result.multiplier,
  };
  if (!result.safe) {
    sound.play('shatter');
    set({ user, round: null, status: 'busted', lastStep: event, lastReveal: result.reveal ?? null });
  } else if (result.status === 'cashed_out') {
    sound.play(result.multiplier >= 3 ? 'jackpot' : 'cashout');
    set({ user, round: null, status: 'cashed', lastStep: event, lastReveal: result.reveal ?? null });
  } else {
    sound.play('tick');
    set({ user, round: next, status: 'playing', lastStep: event });
  }
}
