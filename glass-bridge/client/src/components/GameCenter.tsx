import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import BridgeBoard from './BridgeBoard.js';

/** Vertical multiplier ladder rail (rows high→low) shown over the bridge. */
function Ladder() {
  const { config, round, status } = useStore();
  const mults = config?.multipliers ?? [];
  const current = round?.currentRow ?? 0;
  const order = mults.map((_, i) => i).reverse(); // top = last row
  return (
    <div className="absolute left-1 top-2 z-20 flex flex-col gap-[3px] text-[10px]">
      {order.map((i) => {
        const active = i === current && status === 'playing';
        return (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-[2px] font-display transition ${
              active ? 'bg-neon-purple/60 text-white shadow-neon' : 'text-white/45'
            }`}
          >
            <span className="w-4 text-right opacity-60">{i + 1}</span>
            <span className={active ? 'text-white' : 'text-neon-cyan/70'}>{mults[i].toFixed(2)}×</span>
          </div>
        );
      })}
    </div>
  );
}

export default function GameCenter() {
  const { round, status, lastStep, jump, cashOut, busy, error } = useStore();
  const multiplier = round?.multiplier ?? (status === 'cashed' && lastStep ? lastStep.multiplier : 1);
  const nextMult = round ? round.multipliers[round.currentRow] : null;
  const playing = status === 'playing' && round?.status === 'active';

  return (
    <div className="flex flex-col gap-3">
      {/* round id row */}
      {round && (
        <div className="flex items-center justify-between px-1 font-display text-xs text-white/40">
          <span>ROUND #{round.id.slice(-7)}</span>
        </div>
      )}

      <div className="relative">
        {/* floating multiplier pill */}
        <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={status === 'busted' ? 'bust' : multiplier}
              initial={{ scale: 0.7, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.3, opacity: 0 }}
              className={`min-w-[150px] rounded-full border px-6 py-2 text-center backdrop-blur-md ${
                status === 'busted'
                  ? 'border-neon-pink/60 bg-neon-pink/15'
                  : 'border-white/15 bg-black/45'
              }`}
            >
              <div className={`font-display text-3xl font-black leading-none ${status === 'busted' ? 'text-neon-pink' : 'text-white'} neon-text`}>
                {status === 'busted' ? 'CRASHED' : `${multiplier.toFixed(2)}×`}
              </div>
              {playing && nextMult && (
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">
                  next step: {nextMult.toFixed(2)}×
                </div>
              )}
              {status === 'cashed' && <div className="mt-0.5 text-[10px] uppercase tracking-widest text-neon-green">cashed out</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        <Ladder />
        <BridgeBoard height={400} />
      </div>

      {error && <div className="text-center text-sm text-neon-pink">{error}</div>}

      {/* choose left / right */}
      <p className="text-center text-xs uppercase tracking-widest text-white/40">
        {playing ? 'Choose your path — tap left or right to jump' : 'Place a bet to step onto the bridge'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => jump('LEFT')}
          disabled={!playing || busy}
          className="btn flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-neon-purple/80 to-neon-purple/40 py-4 text-lg text-white shadow-neon ring-1 ring-neon-purple/60 disabled:opacity-30 disabled:shadow-none"
        >
          <span className="text-2xl">‹</span> LEFT
        </button>
        <button
          onClick={() => jump('RIGHT')}
          disabled={!playing || busy}
          className="btn flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-neon-cyan/80 to-neon-blue/50 py-4 text-lg text-white shadow-neon-cyan ring-1 ring-neon-cyan/60 disabled:opacity-30 disabled:shadow-none"
        >
          RIGHT <span className="text-2xl">›</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Potential win</div>
          <div className="font-display text-lg text-white">€{(round?.potentialPayout ?? 0).toFixed(2)}</div>
        </div>
        <button
          onClick={cashOut}
          disabled={!playing || busy || (round?.currentRow ?? 0) === 0}
          className="btn flex-[1.4] animate-pulseGlow rounded-2xl bg-gradient-to-r from-neon-green to-neon-cyan py-3.5 text-lg text-black disabled:animate-none disabled:opacity-30"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Cash out</div>
          €{(round?.potentialPayout ?? 0).toFixed(2)}
        </button>
      </div>
    </div>
  );
}
