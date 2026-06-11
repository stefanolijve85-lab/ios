import { useState } from 'react';
import { useStore } from '../store/useStore.js';
import { ArrowLeft, ArrowRight, Cash } from './icons.js';

const money = (n: number) => `€${n.toFixed(2)}`;

export default function Controls() {
  const { user, config, round, status, startRound, jump, cashOut, busy, error } = useStore();
  const [bet, setBet] = useState(10);
  const min = config?.minBet ?? 0.1;
  const max = config?.maxBet ?? 1000;
  const playing = status === 'playing' && round?.status === 'active';
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v * 100) / 100));
  const potential = round?.potentialPayout ?? 0;
  const canCash = playing && (round?.currentRow ?? 0) > 0;

  return (
    <div className="px-4 pt-2">
      {error && <div className="mb-2 text-center text-sm text-neon-pink">{error}</div>}

      {playing ? (
        <>
          <p className="text-center text-sm font-display tracking-wide text-white/70">CHOOSE YOUR PATH</p>
          <p className="mb-3 text-center text-xs text-white/40">Tap left or right to jump</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => jump('LEFT')}
              disabled={busy}
              className="btn flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-neon-purple to-[#6d28d9] py-4 text-lg text-white shadow-neon ring-1 ring-neon-purple/60 disabled:opacity-40"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15"><ArrowLeft width={16} height={16} /></span>
              LEFT
            </button>
            <button
              onClick={() => jump('RIGHT')}
              disabled={busy}
              className="btn flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-blue py-4 text-lg text-white shadow-neon-cyan ring-1 ring-neon-cyan/60 disabled:opacity-40"
            >
              RIGHT
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15"><ArrowRight width={16} height={16} /></span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex flex-1 items-center rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5">
              <span className="text-neon-cyan">€</span>
              <input
                type="number" value={bet} min={min} max={max} step={0.1}
                onChange={(e) => setBet(clamp(Number(e.target.value)))}
                className="w-full bg-transparent px-2 font-display text-lg outline-none"
              />
            </div>
            <button onClick={() => setBet(clamp(bet / 2))} className="btn rounded-2xl bg-white/5 px-3 py-2.5 text-sm">½</button>
            <button onClick={() => setBet(clamp(bet * 2))} className="btn rounded-2xl bg-white/5 px-3 py-2.5 text-sm">2×</button>
          </div>
        </>
      )}

      {/* potential win + cash out (or BET when idle) */}
      <div className="mt-3 flex items-stretch gap-2">
        <div className="flex flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Potential win</div>
          <div className="font-display text-lg text-white">{money(playing ? potential : bet)}</div>
        </div>

        {playing ? (
          <button
            onClick={cashOut}
            disabled={busy || !canCash}
            className="btn flex flex-[1.5] items-center justify-center rounded-2xl bg-gradient-to-r from-neon-green to-[#16c79a] py-2 text-black shadow-[0_0_24px_rgba(39,245,163,0.5)] disabled:opacity-40 disabled:shadow-none"
          >
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Cash out</div>
              <div className="font-display text-xl font-black">{money(potential)}</div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => startRound(bet)}
            disabled={busy || !user || (user?.balance ?? 0) < bet}
            className="btn flex flex-[1.5] items-center justify-center rounded-2xl bg-gradient-to-r from-neon-purple to-neon-blue py-2 text-white shadow-neon disabled:opacity-40"
          >
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Place bet</div>
              <div className="font-display text-xl font-black">BET {money(bet)}</div>
            </div>
          </button>
        )}

        <button className="grid w-12 place-items-center rounded-2xl border border-white/10 bg-black/30 text-neon-green/80">
          <Cash />
        </button>
      </div>
    </div>
  );
}
