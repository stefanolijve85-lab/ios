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

  // Camera glides forward (subtle) toward the vanishing point. The hero is a
  // CHILD of this layer, so it stays glued to the tiles through any zoom.
  const bridgeScale = 1 + progress * 0.26;

  // Tile-centre path measured from the bridge artwork (cover-crop, base scale).
  // Perspective curves: tiles bunch toward the vanishing point (~50%, 14%).
  const pick = lastStep?.pick === 'LEFT' ? 'LEFT' : 'RIGHT';
  const k = Math.pow(1 - progress, 1.25);           // perspective easing toward vanishing
  const laneSpread = 14 * k;                         // right/left lane offset from centre (%)
  const charX = 50 + (pick === 'LEFT' ? -laneSpread : laneSpread);
  const charFeetTop = 14 + 74 * Math.pow(1 - progress, 1.4); // feet land on the tile centre (%)
  const charHeight = 8 + 40 * Math.pow(1 - progress, 1.5);   // perspective size (% of stage)

  return (
    <div className="stage" style={{ height }}>
      {/* real bridge artwork + hero, scaled together (camera forward keeps them aligned) */}
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${bridgeUrl})`, transformOrigin: '50% 30%' }}
        initial={false}
        animate={{ scale: bridgeScale }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      >
        {/* readability vignette (inside, so it scales with the scene) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/35 via-transparent to-void/65" />

        {/* glowing active tile drawn under the hero's feet — guarantees he is
            always centred on a tile (on the right lane), independent of the
            photo's irregular tiles. */}
        {status === 'playing' && (
          <motion.div
            className="pointer-events-none absolute z-[5]"
            style={{ translateX: '-50%', translateY: '-50%' }}
            initial={false}
            animate={{
              left: `${charX}%`,
              top: `${charFeetTop - charHeight * 0.02}%`,
              width: `${charHeight * 0.62}%`,
              height: `${charHeight * 0.2}%`,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 17 }}
          >
            <div
              className="h-full w-full rounded-[14px] border border-neon-cyan/80"
              style={{
                transform: 'perspective(120px) rotateX(58deg)',
                background: 'linear-gradient(160deg, rgba(39,224,255,0.5), rgba(168,85,247,0.4))',
                boxShadow: '0 0 18px rgba(39,224,255,0.7), inset 0 0 14px rgba(255,255,255,0.35)',
              }}
            />
          </motion.div>
        )}

        {/* the hero — feet anchored on the measured tile centre */}
        {status !== 'busted' ? (
          <motion.img
            src={characterUrl}
            alt="Aero the explorer bot"
            className="pointer-events-none absolute z-10 select-none"
            style={{ translateX: '-50%', translateY: '-100%', transformOrigin: '50% 100%', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))' }}
            draggable={false}
            initial={false}
            animate={{ left: `${charX}%`, top: `${charFeetTop}%`, height: `${charHeight}%` }}
            transition={{ type: 'spring', stiffness: 150, damping: 17 }}
          />
        ) : (
          <motion.img
            src={characterUrl}
            alt="Aero falling"
            className="pointer-events-none absolute z-10 select-none"
            style={{ translateX: '-50%', translateY: '-100%', transformOrigin: '50% 100%', height: `${charHeight}%` }}
            draggable={false}
            initial={{ left: `${charX}%`, top: `${charFeetTop}%`, rotate: 0, opacity: 1 }}
            animate={{ top: '150%', rotate: 220, opacity: 0 }}
            transition={{ duration: 0.95, ease: 'easeIn' }}
          />
        )}
      </motion.div>

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
    </div>
  );
}
