'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { getAudio } from '@/lib/audio';
import { multiplierAt, MAX_MULTIPLIER } from '@/lib/constants';
import type { GameState, ChatMessage, ActivityItem, BetState } from '@/lib/types';

interface Bets { 0: BetState | null; 1: BetState | null; }

interface GameContextValue {
  connected: boolean;
  state: GameState | null;
  balance: number;
  lastWin: number;
  bets: Bets;
  chat: ChatMessage[];
  activity: ActivityItem[];
  flash: { kind: 'win' | 'lose'; text: string; key: number } | null;
  stateRef: React.MutableRefObject<GameState | null>;
  offsetRef: React.MutableRefObject<number>;
  liveMultiplier: () => number;
  serverNow: () => number;
  placeBet: (slot: 0 | 1, amount: number) => void;
  cancelBet: (slot: 0 | 1) => void;
  stash: (slot: 0 | 1) => void;
  sendChat: (text: string) => void;
  addCredits: (amount: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [balance, setBalance] = useState(0);
  const [bets, setBets] = useState<Bets>({ 0: null, 1: null });
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [flash, setFlash] = useState<{ kind: 'win' | 'lose'; text: string; key: number } | null>(null);
  const [lastWin, setLastWin] = useState(0);

  const stateRef = useRef<GameState | null>(null);
  const offsetRef = useRef<number>(0);
  const phaseRef = useRef<string>('');

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  const liveMultiplier = useCallback(() => {
    const s = stateRef.current;
    if (!s) return 1.0;
    if (s.phase === 'crashed') return s.crashPoint ?? s.multiplier;
    if (s.phase !== 'running' || !s.startTime) return 1.0;
    const elapsed = serverNow() - s.startTime;
    return Math.min(multiplierAt(elapsed), MAX_MULTIPLIER);
  }, [serverNow]);

  useEffect(() => {
    const socket = getSocket();
    const audio = getAudio();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onWelcome = (d: { balance: number }) => setBalance(d.balance);
    const onBalance = (b: number) => setBalance(b);

    const onState = (s: GameState) => {
      offsetRef.current = s.now - Date.now();
      stateRef.current = s;
      setState(s);
      // Drive audio intensity from progress toward crash window.
      if (s.phase === 'running' && s.startTime) {
        const elapsed = (Date.now() + offsetRef.current) - s.startTime;
        audio.setIntensity(Math.min(1, elapsed / 12000));
      }
    };

    const onRoundNew = () => {
      setBets({ 0: null, 1: null });
      phaseRef.current = 'betting';
      audio.stopMotif();
      audio.startTick(); // clock ticks during the "VAULT CLOSES IN" countdown
    };
    const onRoundStart = () => {
      phaseRef.current = 'running';
      audio.stopTick();
      audio.startMotif();
    };
    const onCrash = (s: GameState) => {
      phaseRef.current = 'crashed';
      audio.crash();
      // Resolve the player's own bets for the flash banner.
      setBets((prev) => {
        let won = 0;
        let lost = 0;
        ([0, 1] as const).forEach((slot) => {
          const b = prev[slot];
          if (b && !b.cashedOut) lost += b.amount;
          if (b && b.cashedOut) won += b.payout;
        });
        if (lost > 0) {
          setFlash({ kind: 'lose', text: 'THIEVES TOOK IT ALL', key: Date.now() });
        }
        return prev;
      });
    };

    const onBetAck = ({ slot, amount }: { slot: 0 | 1; amount: number }) =>
      setBets((p) => ({ ...p, [slot]: { amount, cashedOut: false, payout: 0 } }));
    const onBetCancelled = ({ slot }: { slot: 0 | 1 }) =>
      setBets((p) => ({ ...p, [slot]: null }));
    const onStashed = ({ slot, multiplier, payout }: { slot: 0 | 1; multiplier: number; payout: number }) => {
      setBets((p) => {
        const b = p[slot];
        return { ...p, [slot]: b ? { ...b, cashedOut: true, payout, cashedAt: multiplier } : b };
      });
      setFlash({ kind: 'win', text: `SECURED  +€${payout.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, key: Date.now() });
      setLastWin(payout);
      audio.playStash();
    };

    const onChat = (m: ChatMessage) => setChat((c) => [...c.slice(-60), m]);
    const onActivity = (a: ActivityItem) => setActivity((x) => [a, ...x.slice(0, 24)]);
    const onErrorMsg = (msg: string) =>
      setFlash({ kind: 'lose', text: typeof msg === 'string' ? msg.toUpperCase() : 'ERROR', key: Date.now() });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('welcome', onWelcome);
    socket.on('balance', onBalance);
    socket.on('state', onState);
    socket.on('round_new', onRoundNew);
    socket.on('round_start', onRoundStart);
    socket.on('crash', onCrash);
    socket.on('bet_ack', onBetAck);
    socket.on('bet_cancelled', onBetCancelled);
    socket.on('stashed', onStashed);
    socket.on('chat', onChat);
    socket.on('activity', onActivity);
    socket.on('error_msg', onErrorMsg);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('welcome', onWelcome);
      socket.off('balance', onBalance);
      socket.off('state', onState);
      socket.off('round_new', onRoundNew);
      socket.off('round_start', onRoundStart);
      socket.off('crash', onCrash);
      socket.off('bet_ack', onBetAck);
      socket.off('bet_cancelled', onBetCancelled);
      socket.off('stashed', onStashed);
      socket.off('chat', onChat);
      socket.off('activity', onActivity);
      socket.off('error_msg', onErrorMsg);
    };
  }, []);

  const placeBet = useCallback((slot: 0 | 1, amount: number) => {
    getSocket().emit('place_bet', { slot, amount });
  }, []);
  const cancelBet = useCallback((slot: 0 | 1) => {
    getSocket().emit('cancel_bet', { slot });
  }, []);
  const stash = useCallback((slot: 0 | 1) => {
    getSocket().emit('stash', { slot });
  }, []);
  const sendChat = useCallback((text: string) => {
    getSocket().emit('chat', { text });
  }, []);
  const addCredits = useCallback((amount: number) => {
    getSocket().emit('add_credits', { amount });
  }, []);

  const value: GameContextValue = {
    connected, state, balance, lastWin, bets, chat, activity, flash,
    stateRef, offsetRef, liveMultiplier, serverNow,
    placeBet, cancelBet, stash, sendChat, addCredits,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
