import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore.js';

/** Bottom sheet with auto-bet settings: rounds, auto-cashout row, stop-win/loss. */
export default function AutoBetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, status, round, startRound, cashOut } = useStore();
  const [bet, setBet] = useState(10);
  const [rounds, setRounds] = useState(10);
  const [cashRow, setCashRow] = useState(5);
  const [stopWin, setStopWin] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [running, setRunning] = useState(false);
  const auto = useRef({ remaining: 0, startBalance: 0 });

  useEffect(() => {
    if (!running) return;
    if (status === 'playing' && round && round.status === 'active') {
      if (round.currentRow >= cashRow && round.currentRow > 0) void cashOut();
      else void useStore.getState().jump(Math.random() < 0.5 ? 'LEFT' : 'RIGHT');
      return;
    }
    if (status === 'cashed' || status === 'busted') {
      const net = (user?.balance ?? 0) - auto.current.startBalance;
      auto.current.remaining -= 1;
      if (auto.current.remaining <= 0 || (stopWin > 0 && net >= stopWin) || (stopLoss > 0 && net <= -stopLoss)) {
        setRunning(false);
        return;
      }
      const t = setTimeout(() => {
        if ((user?.balance ?? 0) >= bet) void startRound(bet);
        else setRunning(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [status, round, running, cashRow, bet, stopWin, stopLoss, user, cashOut, startRound]);

  function start() {
    if (!user) return;
    auto.current = { remaining: rounds, startBalance: user.balance };
    setRunning(true);
    void startRound(bet);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[460px] rounded-t-3xl border-t border-white/10 bg-[#120a2b] p-5 pb-24"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />
            <h2 className="mb-3 font-display text-lg text-white">Auto Bet</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="Bet (€)" value={bet} onChange={setBet} disabled={running} />
              <Field label="Number of rounds" value={rounds} onChange={setRounds} disabled={running} />
              <Field label="Auto cash-out row" value={cashRow} onChange={setCashRow} disabled={running} />
              <Field label="Stop on win (€)" value={stopWin} onChange={setStopWin} disabled={running} />
              <Field label="Stop on loss (€)" value={stopLoss} onChange={setStopLoss} disabled={running} />
            </div>
            <button
              onClick={() => (running ? setRunning(false) : start())}
              disabled={!user || (!running && (user?.balance ?? 0) < bet)}
              className={`btn mt-4 w-full rounded-2xl py-3.5 text-lg ${running ? 'bg-neon-pink/80 text-white' : 'bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-neon'}`}
            >
              {running ? 'STOP AUTO' : `START AUTO (${rounds} rounds)`}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-white/40">{label}</span>
      <input
        type="number" value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 font-display outline-none disabled:opacity-50"
      />
    </label>
  );
}
