import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';

const money = (n: number) => `€${n.toFixed(2)}`;

export default function BetPanel() {
  const { user, config, status, round, startRound, cashOut, busy } = useStore();
  const [bet, setBet] = useState(10);
  const [tab, setTab] = useState<'manual' | 'auto'>('manual');

  // Auto-bet config
  const [autoRounds, setAutoRounds] = useState(10);
  const [autoCashRow, setAutoCashRow] = useState(5);
  const [stopWin, setStopWin] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [autoRunning, setAutoRunning] = useState(false);
  const auto = useRef({ remaining: 0, net: 0, startBalance: 0 });

  const min = config?.minBet ?? 0.1;
  const max = config?.maxBet ?? 1000;
  const playing = status === 'playing' && round?.status === 'active';

  function clamp(v: number) {
    return Math.max(min, Math.min(max, Math.round(v * 100) / 100));
  }

  // ---- Auto-bet driver: reacts to round status transitions ----
  useEffect(() => {
    if (!autoRunning) return;
    if (status === 'playing' && round && round.status === 'active') {
      // Auto cash-out once we reach the target row.
      if (round.currentRow >= autoCashRow && round.currentRow > 0) {
        void cashOut();
      } else {
        void useStore.getState().jump(Math.random() < 0.5 ? 'LEFT' : 'RIGHT');
      }
      return;
    }
    if (status === 'cashed' || status === 'busted') {
      const bal = user?.balance ?? 0;
      auto.current.net = bal - auto.current.startBalance;
      auto.current.remaining -= 1;
      const hitWin = stopWin > 0 && auto.current.net >= stopWin;
      const hitLoss = stopLoss > 0 && auto.current.net <= -stopLoss;
      if (auto.current.remaining <= 0 || hitWin || hitLoss) {
        setAutoRunning(false);
        return;
      }
      const t = setTimeout(() => {
        if ((user?.balance ?? 0) >= bet) void startRound(bet);
        else setAutoRunning(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [status, round, autoRunning, autoCashRow, bet, cashOut, startRound, stopWin, stopLoss, user]);

  function startAuto() {
    if (!user) return;
    auto.current = { remaining: autoRounds, net: 0, startBalance: user.balance };
    setAutoRunning(true);
    void startRound(bet);
  }

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex rounded-lg bg-black/30 p-1 text-sm">
        {(['manual', 'auto'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 font-display capitalize transition ${
              tab === t ? 'bg-neon-purple/40 text-white' : 'text-white/50'
            }`}
          >
            {t === 'manual' ? 'Manual' : 'Auto Bet'}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-white/40">Bet amount</label>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            <span className="text-neon-cyan">€</span>
            <input
              type="number"
              value={bet}
              min={min}
              max={max}
              step={0.1}
              disabled={playing || autoRunning}
              onChange={(e) => setBet(clamp(Number(e.target.value)))}
              className="w-full bg-transparent px-2 font-display text-lg outline-none"
            />
          </div>
          <button className="btn bg-white/5 px-3 py-2 text-sm" disabled={playing || autoRunning} onClick={() => setBet(clamp(bet / 2))}>
            ½
          </button>
          <button className="btn bg-white/5 px-3 py-2 text-sm" disabled={playing || autoRunning} onClick={() => setBet(clamp(bet * 2))}>
            2×
          </button>
        </div>
      </div>

      {tab === 'auto' && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Field label="Rounds" value={autoRounds} onChange={setAutoRounds} disabled={autoRunning} />
          <Field label="Auto cash row" value={autoCashRow} onChange={setAutoCashRow} disabled={autoRunning} />
          <Field label="Stop on win (€)" value={stopWin} onChange={setStopWin} disabled={autoRunning} />
          <Field label="Stop on loss (€)" value={stopLoss} onChange={setStopLoss} disabled={autoRunning} />
        </div>
      )}

      {/* primary action */}
      {tab === 'manual' ? (
        !playing ? (
          <button
            onClick={() => startRound(bet)}
            disabled={busy || !user || (user?.balance ?? 0) < bet}
            className="btn bg-gradient-to-r from-neon-purple to-neon-blue py-3 text-lg text-white shadow-neon"
          >
            BET {money(bet)}
          </button>
        ) : (
          <button
            onClick={cashOut}
            disabled={busy || (round?.currentRow ?? 0) === 0}
            className="btn animate-pulseGlow bg-gradient-to-r from-neon-green to-neon-cyan py-3 text-lg text-black shadow-neon-cyan"
          >
            CASH OUT {money(round?.potentialPayout ?? 0)}
          </button>
        )
      ) : (
        <button
          onClick={() => (autoRunning ? setAutoRunning(false) : startAuto())}
          disabled={!user || (!autoRunning && (user?.balance ?? 0) < bet)}
          className={`btn py-3 text-lg ${autoRunning ? 'bg-neon-pink/80 text-white' : 'bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-neon'}`}
        >
          {autoRunning ? 'STOP AUTO' : `START AUTO (${autoRounds})`}
        </button>
      )}

      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Balance</span>
        <span className="font-display text-base text-white">{money(user?.balance ?? 0)}</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-white/40">{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-display outline-none"
      />
    </label>
  );
}
