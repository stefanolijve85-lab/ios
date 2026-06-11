import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';

import bridgeUrl from '../assets/bridge.png';
import characterUrl from '../assets/character.png';

/**
 * The bridge stage now renders the supplied artwork directly: the neon
 * glass-bridge photo as the backdrop and the explorer-bot PNG as the hero.
 * The interactive choice is made with the LEFT/RIGHT controls below; the
 * ladder, multiplier and the bot's motion convey progress.
 */
export default function BridgeBoard({ height = 372 }: { height?: number }) {
  const { round, config, status, lastStep } = useStore();
  const rows = config?.rows ?? 12;
  const currentRow = round?.currentRow ?? (status === 'busted' && lastStep ? lastStep.row - 1 : 0);
  const order = Array.from({ length: rows }, (_, i) => rows - 1 - i);

  // Progress 0..1 across the bridge.
  const progress = rows > 1 ? currentRow / (rows - 1) : 0;

  // Camera glides forward: zoom toward the vanishing point as the player advances.
  const bridgeScale = 1.02 + progress * 0.7;

  // Hero walks the lane he last chose (default: the right tile). Each jump he
  // moves up the bridge to the next tile, the lanes converge, and he shrinks
  // (further from the camera). The camera zoom above follows him forward.
  const pick = lastStep?.pick === 'LEFT' ? 'LEFT' : 'RIGHT';
  const laneSpread = 13 - progress * 11;            // % from centre, converges with distance
  const charX = 50 + (pick === 'LEFT' ? -laneSpread : laneSpread);
  const charFeetTop = 90 - progress * 56;           // feet Y (%), moves up/forward each step
  const charScale = 1 - progress * 0.62;            // shrink clearly as he recedes

  return (
    <div className="stage" style={{ height }}>
      {/* real bridge artwork — zoom origin at the vanishing point = forward camera */}
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${bridgeUrl})`, transformOrigin: '50% 30%' }}
        initial={false}
        animate={{ scale: bridgeScale }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      />
      {/* readability vignette */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-void/40 via-transparent to-void/70" />

      {/* multiplier ladder rail (12 → 1, active rung lit) */}
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

      {/* safe-step / bust flashes */}
      <AnimatePresence>
        {lastStep?.safe && status === 'playing' && (
          <motion.div key={`flash-${currentRow}`} className="pointer-events-none absolute inset-0 z-10 bg-neon-cyan/20"
            initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} />
        )}
        {status === 'busted' && (
          <motion.div key="bust-flash" className="pointer-events-none absolute inset-0 z-10 bg-neon-pink/30"
            initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />
        )}
      </AnimatePresence>

      {/* the hero — your character artwork, anchored by the feet on the tile */}
      {status !== 'busted' ? (
        <motion.img
          src={characterUrl}
          alt="Aero the explorer bot"
          className="pointer-events-none absolute z-20 select-none"
          style={{
            height: '50%',
            translateX: '-50%',
            translateY: '-100%',
            transformOrigin: '50% 100%',
            filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.55))',
          }}
          draggable={false}
          initial={false}
          animate={{ left: `${charX}%`, top: `${charFeetTop}%`, scale: charScale }}
          transition={{ type: 'spring', stiffness: 150, damping: 17 }}
        />
      ) : (
        <motion.img
          src={characterUrl}
          alt="Aero falling"
          className="pointer-events-none absolute z-20 select-none"
          style={{ height: '50%', translateX: '-50%', translateY: '-100%', transformOrigin: '50% 100%' }}
          draggable={false}
          initial={{ left: `${charX}%`, top: `${charFeetTop}%`, scale: charScale, rotate: 0, opacity: 1 }}
          animate={{ top: '145%', rotate: 220, opacity: 0, scale: charScale * 0.85 }}
          transition={{ duration: 0.95, ease: 'easeIn' }}
        />
      )}
    </div>
  );
}
