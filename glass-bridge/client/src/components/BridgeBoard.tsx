import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import Character, { type Mood } from './Character.js';
import type { Side } from '../lib/types.js';

/** A single pane of neon glass. */
function GlassTile({
  state,
  onClick,
  active,
}: {
  state: 'future' | 'safe' | 'broken' | 'cleared';
  onClick?: () => void;
  active: boolean;
}) {
  const palette = {
    future: 'from-neon-cyan/10 to-neon-blue/5 border-white/10',
    cleared: 'from-neon-green/25 to-neon-cyan/10 border-neon-green/40',
    safe: 'from-neon-green/30 to-neon-cyan/15 border-neon-green/60',
    broken: 'from-neon-pink/10 to-transparent border-neon-pink/50',
  }[state];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick ? { scale: 1.04, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      className={`relative h-12 w-full rounded-lg border bg-gradient-to-br ${palette} ${
        active ? 'shadow-neon-cyan ring-1 ring-neon-cyan/60' : ''
      } ${onClick ? 'cursor-pointer' : 'cursor-default'} overflow-hidden`}
    >
      {/* glass reflection */}
      <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-md bg-white/10" />
      {state === 'broken' && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 grid place-items-center text-neon-pink"
          aria-hidden
        >
          <svg viewBox="0 0 40 24" className="h-full w-full opacity-80">
            <path d="M20 0 L16 8 L22 10 L14 16 L20 24 M0 12 L16 8 M40 13 L24 10" stroke="#ff4fd8" strokeWidth="1" fill="none" />
          </svg>
        </motion.span>
      )}
    </motion.button>
  );
}

export default function BridgeBoard() {
  const { round, config, status, lastStep, lastReveal, jump, busy } = useStore();
  const rows = config?.rows ?? 12;
  const multipliers = config?.multipliers ?? [];
  const currentRow = round?.currentRow ?? (status === 'busted' && lastStep ? lastStep.row - 1 : 0);

  const mood: Mood =
    status === 'busted' ? 'scared' : status === 'cashed' ? 'celebrate' : status === 'playing' ? 'waiting' : 'idle';

  // Render rows top (finish, row N) to bottom (start, row 1).
  const order = Array.from({ length: rows }, (_, i) => rows - 1 - i);

  function tileState(rowIdx: number, side: Side): 'future' | 'safe' | 'broken' | 'cleared' {
    // Reveal broken trap tile when round is over.
    if (lastReveal && status === 'busted') {
      const o = lastReveal.layout[rowIdx];
      const pick = lastReveal.picks[rowIdx];
      if (o && pick === side && rowIdx === lastStep!.row - 1) return 'broken';
    }
    if (rowIdx < currentRow) return 'cleared';
    if (rowIdx === currentRow && status === 'playing') return side ? 'future' : 'future';
    return 'future';
  }

  const canPlay = status === 'playing' && round?.status === 'active' && !busy;

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="grid-fade absolute inset-0 -z-10" />
      {/* horizon glow / neon city */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-neon-purple/30 via-neon-blue/10 to-transparent blur-2xl" />

      <div className="flex flex-col gap-2 py-4" style={{ perspective: 900 }}>
        {order.map((rowIdx, displayIdx) => {
          const isCurrent = rowIdx === currentRow && status === 'playing';
          // Subtle perspective: rows farther from the player (higher displayIdx near top) shrink.
          const depth = (order.length - displayIdx) / order.length;
          const scale = 0.78 + depth * 0.22;
          return (
            <motion.div
              key={rowIdx}
              initial={false}
              animate={{ scale, opacity: rowIdx < currentRow ? 0.45 : 1 }}
              className="relative grid grid-cols-2 gap-3"
              style={{ transformOrigin: 'center' }}
            >
              {/* multiplier tag */}
              <span
                className={`absolute -left-14 top-1/2 hidden -translate-y-1/2 font-display text-xs sm:block ${
                  isCurrent ? 'text-neon-cyan neon-text' : 'text-white/40'
                }`}
              >
                {multipliers[rowIdx]?.toFixed(2)}×
              </span>

              <GlassTile state={tileState(rowIdx, 'LEFT')} active={isCurrent} onClick={canPlay && isCurrent ? () => jump('LEFT') : undefined} />
              <GlassTile state={tileState(rowIdx, 'RIGHT')} active={isCurrent} onClick={canPlay && isCurrent ? () => jump('RIGHT') : undefined} />

              {/* the character stands on the current row (or row 0 before start) */}
              {isCurrent && (
                <motion.div
                  layoutId="hero"
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%]"
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                  <Character mood={mood} size={70} />
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* start platform + resting hero before the round */}
        {status !== 'playing' && (
          <div className="relative mt-1 grid place-items-center">
            <div className="h-2 w-40 rounded-full bg-neon-blue/40 blur-sm" />
            <AnimatePresence>
              <motion.div
                key={status}
                initial={{ y: status === 'busted' ? -40 : 0, opacity: 0 }}
                animate={{ y: status === 'busted' ? 120 : 0, opacity: status === 'busted' ? 0 : 1, rotate: status === 'busted' ? 180 : 0 }}
                transition={{ duration: status === 'busted' ? 0.7 : 0.3 }}
                className="absolute -top-16"
              >
                <Character mood={mood} size={80} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
