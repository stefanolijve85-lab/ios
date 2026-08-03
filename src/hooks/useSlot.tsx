'use client';

// ---------------------------------------------------------------------------
// useSlot — the client game controller for QUANTUM SPIN.
//
// It owns NO money logic: every spin is decided by the server and returned
// fully resolved. This hook's job is to (a) hold the server's authoritative
// session snapshot and (b) choreograph the on-screen playback of a resolved
// result — the reel drop, each Quantum Reactor tumble, the multiplier ladder,
// win counters, the Quantum Portal feature and jackpot overlays — then reconcile
// the balance from the server. Turbo only shortens the choreography; it can
// never change an outcome.
// ---------------------------------------------------------------------------

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { slotApi } from '@/game/api';
import { assets } from '@/game/assets';
import { audio } from '@/game/audio';
import { getSlotTheme } from '@/game/theme';
import type { SessionState, SpinResult, Grid, Jackpots } from '@/game/types';

type Phase = 'boot' | 'idle' | 'spinning' | 'tumbling' | 'presenting';

export interface GameEvent {
  id: number;
  kind: 'feature' | 'jackpot' | 'bigwin' | 'megawin' | 'ultrawin' | 'error';
  payload?: Record<string, unknown>;
}

interface SlotContextValue {
  ready: boolean;
  session: SessionState | null;
  theme: ReturnType<typeof getSlotTheme>;
  grid: Grid;
  winCells: Set<string>;
  dropKey: number;
  phase: Phase;
  spinning: boolean;
  displayWin: number;
  displayMultiplier: number;
  lineBetIndex: number;
  lineBet: number;
  totalBet: number;
  turbo: boolean;
  autoRemaining: number;
  muted: boolean;
  event: GameEvent | null;
  jackpots: Jackpots;
  // actions
  spin: () => void;
  buyFeature: () => void;
  betUp: () => void;
  betDown: () => void;
  toggleTurbo: () => void;
  startAuto: (n: number) => void;
  stopAuto: () => void;
  toggleMute: () => void;
  dismissEvent: () => void;
  setClientSeed: (s: string) => Promise<void>;
  rotateSeed: () => Promise<{ serverSeed: string; serverSeedHash: string; clientSeed: string; spins: number } | null>;
  credit: (amount?: number) => Promise<void>;
  claimDaily: () => Promise<{ claimed: boolean; amount?: number; reason?: string }>;
}

const SlotContext = createContext<SlotContextValue | null>(null);

const EMPTY_GRID: Grid = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => 'J' as const));
const EMPTY_JACKPOTS: Jackpots = { MINI: 0, MINOR: 0, MAJOR: 0, GRAND: 0 };

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function SlotProvider({ themeKey = 'quantumspin', children }: { themeKey?: string; children: React.ReactNode }) {
  const theme = useMemo(() => getSlotTheme(themeKey), [themeKey]);

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [grid, setGrid] = useState<Grid>(EMPTY_GRID);
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [dropKey, setDropKey] = useState(0);
  const [phase, setPhase] = useState<Phase>('boot');
  const [displayWin, setDisplayWin] = useState(0);
  const [displayMultiplier, setDisplayMultiplier] = useState(0);
  const [lineBetIndex, setLineBetIndex] = useState(3);
  const [turbo, setTurbo] = useState(false);
  const [autoRemaining, setAutoRemaining] = useState(0);
  const [muted, setMuted] = useState(false);
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [jackpots, setJackpots] = useState<Jackpots>(EMPTY_JACKPOTS);

  const sidRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>('boot');
  const autoRef = useRef(0);
  const turboRef = useRef(false);
  const eventId = useRef(1);
  const socketRef = useRef<Socket | null>(null);
  const sessionRef = useRef<SessionState | null>(null);
  const runSpinRef = useRef<() => void>(() => {});

  // phaseRef is the SYNCHRONOUS control-flow truth (React state `phase` is only
  // for rendering and updates a tick later). setPhaseSync keeps both in step so
  // re-entrancy guards and spin chaining never read a stale phase.
  turboRef.current = turbo;
  sessionRef.current = session;
  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // A guarded spin trigger used by chaining, autoplay and the spin button.
  const queueSpin = useCallback(() => {
    if (phaseRef.current === 'idle') runSpinRef.current();
  }, []);

  const lineBets = session?.lineBets ?? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  const lineBet = lineBets[Math.min(lineBetIndex, lineBets.length - 1)] ?? 0.1;
  const lines = session?.lines ?? 25;
  const totalBet = Math.round(lineBet * lines * 100) / 100;

  // ---- boot: configure assets + create a server session --------------------
  useEffect(() => {
    assets.configure(theme.key);
    let cancelled = false;
    (async () => {
      const res = await slotApi.createSession({ rtp: '96', layout: '5x3' });
      if (cancelled || !res.ok) return;
      sidRef.current = res.state.id;
      setSession(res.state);
      setJackpots(res.state.jackpots);
      const dbi = 3;
      setLineBetIndex(dbi);
      setGrid(seedGrid());
      setPhaseSync('idle');
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [theme.key]);

  // ---- live progressive jackpot ticker over websockets ---------------------
  useEffect(() => {
    const socket = io('/quantum-jackpots', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('jackpots', (j: Jackpots) => setJackpots(j));
    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((kind: GameEvent['kind'], payload?: Record<string, unknown>) => {
    setEvent({ id: eventId.current++, kind, payload });
  }, []);

  const durations = () => {
    const t = turboRef.current;
    return {
      spin: t ? 240 : 620,
      settle: t ? 90 : 240,
      winHold: t ? 260 : 620,
      removeHold: t ? 90 : 220,
      presentHold: t ? 260 : 700,
    };
  };

  // ---- the core playback of one resolved spin ------------------------------
  const playResult = useCallback(async (result: SpinResult) => {
    const d = durations();
    // reveal the initial drop
    setGrid(result.initialGrid);
    setDropKey((k) => k + 1);
    setWinCells(new Set());
    setDisplayWin(0);
    setDisplayMultiplier(0);
    audio.play('stop');
    await delay(d.settle);

    setPhaseSync('tumbling');
    let accWin = 0;
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      if (i > 0) {
        setGrid(step.grid);
        setDropKey((k) => k + 1);
        audio.play('land', Math.min(6, i));
        // eslint-disable-next-line no-await-in-loop
        await delay(d.settle);
      }
      if (step.wins.length > 0) {
        const cells = new Set<string>();
        for (const w of step.wins) for (const [c, r] of w.positions) cells.add(`${c},${r}`);
        setWinCells(cells);
        accWin += step.stepWin;
        setDisplayWin(Math.round(accWin * 100) / 100);
        setDisplayMultiplier(step.multiplier);
        const ratio = accWin / result.totalBet;
        audio.play(ratio > 20 ? 'megawin' : ratio > 6 ? 'bigwin' : 'win');
        // eslint-disable-next-line no-await-in-loop
        await delay(d.winHold);
        setWinCells(new Set());
        // eslint-disable-next-line no-await-in-loop
        await delay(d.removeHold);
      }
    }

    // final settled grid
    setGrid(result.finalGrid);
    setDisplayWin(Math.round((result.win) * 100) / 100);

    // feature + jackpot presentation
    setPhaseSync('presenting');
    if (result.jackpot) {
      audio.play('jackpot');
      emit('jackpot', { tier: result.jackpot.tier, amount: result.jackpotWin });
      await delay(d.presentHold + 400);
    }
    if (result.freeSpins.triggered) {
      audio.play('portal');
      audio.setMood(true);
      emit('feature', { spins: result.freeSpins.awarded });
      await delay(d.presentHold + 300);
    }
    const ratio = result.win / result.totalBet;
    if (!result.isFree && ratio >= 100) emit('ultrawin', { win: result.win });
    else if (!result.isFree && ratio >= 50) emit('megawin', { win: result.win });
    else if (!result.isFree && ratio >= 15) emit('bigwin', { win: result.win });

    await delay(d.presentHold);
  }, [emit, setPhaseSync]);

  // ---- request + play one spin, then chain feature/auto spins --------------
  const runSpin = useCallback(async () => {
    const sid = sidRef.current;
    if (!sid || phaseRef.current !== 'idle') return;

    // optimistic stake deduction for a paid spin
    const inFreeSpins = !!sessionRef.current?.freeSpins.active;
    setPhaseSync('spinning');
    setWinCells(new Set());
    if (!inFreeSpins) {
      setSession((s) => (s ? { ...s, balance: Math.round((s.balance - totalBet) * 100) / 100 } : s));
    }
    audio.init();
    audio.play('spin');
    setDropKey((k) => k + 1);

    const [res] = await Promise.all([slotApi.spin(sid, lineBet, turboRef.current), delay(durations().spin)]);

    if (!res.ok) {
      setPhaseSync('idle');
      emit('error', { error: res.error ?? 'ERROR' });
      // resync authoritative balance
      const st = await slotApi.state(sid);
      if (st.ok) setSession(st.state);
      autoRef.current = 0;
      setAutoRemaining(0);
      return;
    }

    await playResult(res.result);

    // reconcile authoritative state
    setSession(res.state);
    setJackpots(res.state.jackpots);
    setPhaseSync('idle');
    if (!res.state.freeSpins.active) audio.setMood(false);

    // chain: free spins run automatically; otherwise honour autoplay
    if (res.state.freeSpins.active) {
      await delay(turboRef.current ? 260 : 700);
      queueSpin();
    } else if (autoRef.current > 0) {
      autoRef.current -= 1;
      setAutoRemaining(autoRef.current);
      if (res.state.balance >= totalBet) {
        await delay(turboRef.current ? 200 : 460);
        queueSpin();
      } else {
        autoRef.current = 0;
        setAutoRemaining(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineBet, totalBet, playResult, emit, queueSpin, setPhaseSync]);

  // publish the latest runSpin so refs (queueSpin/spin/auto) always call current
  runSpinRef.current = runSpin;

  // ---- public actions ------------------------------------------------------
  const spin = useCallback(() => {
    audio.init();
    audio.play('button');
    queueSpin();
  }, [queueSpin]);

  const buyFeature = useCallback(async () => {
    const sid = sidRef.current;
    if (!sid || phaseRef.current !== 'idle' || !session) return;
    audio.init();
    audio.play('button');
    const res = await slotApi.buyFeature(sid, lineBet);
    if (!res.ok) {
      emit('error', { error: res.error ?? 'ERROR' });
      return;
    }
    setSession(res.state);
    audio.play('portal');
    audio.setMood(true);
    emit('feature', { spins: res.state.freeSpins.remaining, bought: true });
    await delay(900);
    queueSpin();
  }, [session, lineBet, emit, queueSpin]);

  const betUp = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    audio.play('button');
    setLineBetIndex((i) => Math.min(i + 1, lineBets.length - 1));
  }, [lineBets.length]);
  const betDown = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    audio.play('button');
    setLineBetIndex((i) => Math.max(i - 1, 0));
  }, []);

  const toggleTurbo = useCallback(() => {
    audio.play('button');
    setTurbo((t) => !t);
  }, []);

  const startAuto = useCallback((n: number) => {
    audio.init();
    audio.play('button');
    autoRef.current = n;
    setAutoRemaining(n);
    queueSpin();
  }, [queueSpin]);
  const stopAuto = useCallback(() => {
    autoRef.current = 0;
    setAutoRemaining(0);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audio.setMuted(next);
      return next;
    });
  }, []);

  const dismissEvent = useCallback(() => setEvent(null), []);

  const setClientSeed = useCallback(async (s: string) => {
    const sid = sidRef.current;
    if (!sid) return;
    const res = await slotApi.setClientSeed(sid, s);
    if (res.ok) setSession(res.state);
  }, []);

  const rotateSeed = useCallback(async () => {
    const sid = sidRef.current;
    if (!sid) return null;
    const res = await slotApi.rotateSeed(sid);
    if (res.ok) {
      setSession(res.state);
      return res.revealed;
    }
    return null;
  }, []);

  const credit = useCallback(async (amount = 1000) => {
    const sid = sidRef.current;
    if (!sid) return;
    audio.play('coin');
    const res = await slotApi.credit(sid, amount);
    if (res.ok) setSession(res.state);
  }, []);

  const claimDaily = useCallback(async () => {
    const sid = sidRef.current;
    if (!sid) return { claimed: false };
    const res = await slotApi.claimDaily(sid);
    if (res.ok) {
      setSession(res.state);
      if (res.claimed) audio.play('coin');
    }
    return { claimed: res.ok && res.claimed, amount: res.amount, reason: res.reason };
  }, []);

  const value: SlotContextValue = {
    ready,
    session,
    theme,
    grid,
    winCells,
    dropKey,
    phase,
    spinning: phase === 'spinning' || phase === 'tumbling',
    displayWin,
    displayMultiplier,
    lineBetIndex,
    lineBet,
    totalBet,
    turbo,
    autoRemaining,
    muted,
    event,
    jackpots,
    spin,
    buyFeature,
    betUp,
    betDown,
    toggleTurbo,
    startAuto,
    stopAuto,
    toggleMute,
    dismissEvent,
    setClientSeed,
    rotateSeed,
    credit,
    claimDaily,
  };

  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

// A pleasant, static starting board (no repeated feature symbols).
function seedGrid(): Grid {
  const pool = ['HERO_F', 'HERO_M', 'GEM', 'PLANET', 'ORB_B', 'ORB_O', 'A', 'K', 'Q', 'J'] as const;
  const g: Grid = [];
  let n = 7;
  for (let c = 0; c < 5; c++) {
    const col: Grid[number] = [];
    for (let r = 0; r < 3; r++) {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      col.push(pool[n % pool.length]);
    }
    g.push(col);
  }
  return g;
}

export function useSlot(): SlotContextValue {
  const ctx = useContext(SlotContext);
  if (!ctx) throw new Error('useSlot must be used within SlotProvider');
  return ctx;
}
