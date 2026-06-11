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

  // Walking "forward" feel: as the player advances, push slightly into the scene.
  const progress = rows > 1 ? currentRow / (rows - 1) : 0;
  const bridgeScale = 1.04 + progress * 0.14;
  const bridgeShiftY = progress * 8;

  return (
    <div className="stage" style={{ height }}>
      {/* real bridge artwork */}
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${bridgeUrl})` }}
        initial={false}
        animate={{ scale: bridgeScale, y: bridgeShiftY }}
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

      {/* the hero — your character artwork */}
      {status !== 'busted' ? (
        <motion.img
          src={characterUrl}
          alt="Aero the explorer bot"
          className="pointer-events-none absolute bottom-[6%] left-1/2 z-20 -translate-x-1/2 select-none"
          style={{ height: '70%', filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.6))' }}
          draggable={false}
          key={currentRow}
          initial={{ scale: 0.92, y: 10, opacity: 0.9 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        />
      ) : (
        <motion.img
          src={characterUrl}
          alt="Aero falling"
          className="pointer-events-none absolute bottom-[6%] left-1/2 z-20 -translate-x-1/2 select-none"
          style={{ height: '62%' }}
          draggable={false}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 360, opacity: 0, rotate: 210 }}
          transition={{ duration: 0.95, ease: 'easeIn' }}
        />
      )}
    </div>
  );
}
