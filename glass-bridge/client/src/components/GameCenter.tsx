import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import BridgeBoard from './BridgeBoard.js';

export default function GameCenter() {
  const { round, status, lastStep, jump, cashOut, busy, error } = useStore();
  const multiplier = round?.multiplier ?? (status === 'cashed' && lastStep ? lastStep.multiplier : 1);
  const nextMult = round ? round.multipliers[round.currentRow] : null;
  const playing = status === 'playing' && round?.status === 'active';

  return (
    <div className="glass-panel relative flex flex-col items-center gap-3 overflow-hidden p-4">
      {/* round id */}
      {round && <div className="absolute left-4 top-4 font-display text-xs text-white/40">ROUND #{round.id.slice(-7)}</div>}

      {/* multiplier */}
      <div className="pt-6 text-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={multiplier}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            className={`font-display text-6xl font-black tracking-tight ${
              status === 'busted' ? 'text-neon-pink' : 'text-white'
            } neon-text`}
          >
            {status === 'busted' ? 'CRASHED' : `${multiplier.toFixed(2)}×`}
          </motion.div>
        </AnimatePresence>
        {playing && nextMult && (
          <div className="mt-1 text-sm text-white/50">
            next step: <span className="text-neon-cyan">{nextMult.toFixed(2)}×</span>
          </div>
        )}
        {status === 'cashed' && <div className="mt-1 text-sm text-neon-green">Cashed out!</div>}
      </div>

      <BridgeBoard />

      {error && <div className="text-sm text-neon-pink">{error}</div>}

      {/* choose left / right */}
      <div className="w-full">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-white/40">
          {playing ? 'Choose your path — tap left or right to jump' : 'Place a bet to step onto the bridge'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => jump('LEFT')}
            disabled={!playing || busy}
            className="btn flex items-center justify-center gap-2 bg-neon-purple/30 py-4 text-lg text-white ring-1 ring-neon-purple/50 disabled:opacity-30"
          >
            ◀ LEFT
          </button>
          <button
            onClick={() => jump('RIGHT')}
            disabled={!playing || busy}
            className="btn flex items-center justify-center gap-2 bg-neon-blue/30 py-4 text-lg text-white ring-1 ring-neon-blue/50 disabled:opacity-30"
          >
            RIGHT ▶
          </button>
        </div>
        <button
          onClick={cashOut}
          disabled={!playing || busy || (round?.currentRow ?? 0) === 0}
          className="btn mt-3 w-full animate-pulseGlow bg-gradient-to-r from-neon-green to-neon-cyan py-3 text-lg text-black disabled:animate-none disabled:opacity-30"
        >
          CASH OUT €{(round?.potentialPayout ?? 0).toFixed(2)}
        </button>
      </div>
    </div>
  );
}
