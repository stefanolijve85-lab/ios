import { motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import Character, { type Mood } from './Character.js';
import NeonCity from './NeonCity.js';
import type { Side } from '../lib/types.js';

const ROW_H = 52; // tile height + gap in floor space

type TileState = 'future' | 'magenta' | 'cleared' | 'broken' | 'active';

function Crack() {
  return (
    <svg className="tile-crack" viewBox="0 0 80 46" preserveAspectRatio="none" aria-hidden>
      <g stroke="#bfeaff" strokeWidth="0.6" fill="none">
        <path d="M40 0 L36 16 L46 22 L30 30 L42 46" />
        <path d="M0 24 L36 16 M80 26 L46 22 M30 30 L8 40 M46 22 L72 36" />
      </g>
    </svg>
  );
}

export default function BridgeBoard({ height = 360 }: { height?: number }) {
  const { round, config, status, lastStep, lastReveal, jump, busy } = useStore();
  const rows = config?.rows ?? 12;
  const currentRow = round?.currentRow ?? (status === 'busted' && lastStep ? lastStep.row - 1 : 0);
  const mood: Mood = status === 'busted' ? 'scared' : status === 'cashed' ? 'celebrate' : status === 'playing' ? 'waiting' : 'idle';
  const canPlay = status === 'playing' && round?.status === 'active' && !busy;

  function tileState(rowIdx: number, side: Side): TileState {
    if (lastReveal && status === 'busted' && lastStep && rowIdx === lastStep.row - 1) {
      if (lastReveal.picks[rowIdx] === side) return 'broken';
    }
    if (rowIdx < currentRow) return 'cleared';
    if (rowIdx === currentRow && status === 'playing') return 'active';
    return (rowIdx + (side === 'LEFT' ? 0 : 1)) % 2 === 0 ? 'future' : 'magenta';
  }

  // Render far (row N) → near (row 1). Scroll the floor so the active row stays low.
  const order = Array.from({ length: rows }, (_, i) => rows - 1 - i);
  const scroll = currentRow * ROW_H * 0.62;

  return (
    <div className="stage" style={{ height }}>
      <NeonCity className="absolute inset-x-0 top-0 z-0 h-[58%]" />
      {/* dark fade from the horizon into the foreground */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-void/30 to-void/80" />

      {/* multiplier ladder rail (12 → 1, active rung highlighted) */}
      <div className="absolute left-1.5 top-2 z-30 flex flex-col gap-[2px] text-[10px]">
        {order.map((i) => {
          const active = i === currentRow && status === 'playing';
          return (
            <div
              key={i}
              className={`flex items-center gap-1.5 rounded-lg px-1.5 py-[1.5px] font-display transition ${
                active ? 'border border-neon-purple/70 bg-neon-purple/40 text-white shadow-neon' : ''
              }`}
            >
              <span className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] ${active ? 'bg-neon-cyan text-black' : 'text-white/35'}`}>
                {i + 1}
              </span>
              <span className={active ? 'text-white' : 'text-neon-cyan/60'}>{config?.multipliers[i].toFixed(2)}×</span>
            </div>
          );
        })}
      </div>

      <motion.div
        className="floor"
        initial={false}
        animate={{ transform: `translate(-50%, 0) translateY(${scroll}px) rotateX(60deg)` }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      >
        {/* glowing side rails + center divider */}
        <span className="bridge-rail" style={{ left: '-7%' }} />
        <span className="bridge-rail" style={{ right: '-7%' }} />
        <span className="bridge-rail" style={{ left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }} />

        <div className="flex flex-col gap-1.5">
          {order.map((rowIdx) => {
            const isActive = rowIdx === currentRow && status === 'playing';
            const mult = config?.multipliers[rowIdx];
            return (
              <div key={rowIdx} className="relative grid grid-cols-2 gap-6">
                {(['LEFT', 'RIGHT'] as Side[]).map((side) => {
                  const st = tileState(rowIdx, side);
                  const cls =
                    st === 'cleared' ? 'tile tile--cleared'
                    : st === 'broken' ? 'tile tile--broken'
                    : st === 'active' ? 'tile tile--active'
                    : st === 'magenta' ? 'tile tile--magenta'
                    : 'tile';
                  return (
                    <button
                      key={side}
                      type="button"
                      disabled={!(canPlay && isActive)}
                      onClick={canPlay && isActive ? () => jump(side) : undefined}
                      className={`${cls} ${canPlay && isActive ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {(st === 'future' || st === 'magenta' || st === 'active') && <Crack />}
                      {st === 'broken' && (
                        <span className="absolute inset-0 grid place-items-center font-display text-neon-pink">✕</span>
                      )}
                    </button>
                  );
                })}

                {/* multiplier label floating beside the row */}
                {mult && (
                  <span
                    className={`absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 font-display text-[11px] ${
                      isActive ? 'text-neon-cyan' : 'text-white/35'
                    }`}
                  >
                    {mult.toFixed(2)}×
                  </span>
                )}

              </div>
            );
          })}
        </div>
      </motion.div>

      {/* The hero is a large fixed actor anchored near the bottom-centre; the
          bridge scrolls beneath it (matches the mockup framing). */}
      {status !== 'busted' ? (
        <motion.div
          className="pointer-events-none absolute bottom-[14%] left-1/2 z-20 -translate-x-1/2"
          animate={{ scale: lastStep?.safe ? [1, 0.9, 1.05, 1] : 1 }}
          transition={{ duration: 0.4 }}
          key={currentRow}
        >
          {/* glow disc on the tile under the hero */}
          <div className="absolute left-1/2 top-full h-5 w-28 -translate-x-1/2 -translate-y-2 rounded-[50%] bg-neon-cyan/40 blur-md" />
          <Character mood={mood} size={132} />
        </motion.div>
      ) : (
        <motion.div
          className="pointer-events-none absolute bottom-[14%] left-1/2 z-20 -translate-x-1/2"
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 320, opacity: 0, rotate: 220 }}
          transition={{ duration: 0.95, ease: 'easeIn' }}
        >
          <Character mood="scared" size={132} />
        </motion.div>
      )}
    </div>
  );
}
