import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import { sound } from '../lib/sound.js';
import { Refresh, Speaker, SpeakerOff, Gear } from './icons.js';

export default function SubHeader() {
  const { round, status, lastStep, soundOn, setSound } = useStore();
  const [vol, setVol] = useState(0.6);
  const [showVol, setShowVol] = useState(false);

  const multiplier = round?.multiplier ?? (status === 'cashed' && lastStep ? lastStep.multiplier : 1);
  const nextMult = round ? round.multipliers[round.currentRow] : null;
  const playing = status === 'playing' && round?.status === 'active';
  const busted = status === 'busted';

  return (
    <div className="relative flex items-center justify-between px-4 pb-1 pt-1">
      {/* round id */}
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-black/40 px-2.5 py-1.5">
          <div className="text-[8px] uppercase tracking-widest text-white/40">Round-ID</div>
          <div className="font-display text-[11px] text-white/80">#{round ? round.id.slice(-7) : '———'}</div>
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60">
          <Refresh width={15} height={15} />
        </button>
      </div>

      {/* multiplier pill */}
      <div className="absolute left-1/2 top-1 -translate-x-1/2">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={busted ? 'bust' : multiplier}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.25, opacity: 0 }}
            className={`min-w-[128px] rounded-2xl border px-5 py-1.5 text-center backdrop-blur-md ${
              busted ? 'border-neon-pink/60 bg-neon-pink/15' : 'border-white/20 bg-black/55'
            }`}
          >
            <div className={`font-display text-2xl font-black leading-none ${busted ? 'text-neon-pink' : 'text-white'} neon-text`}>
              {busted ? 'CRASHED' : `${multiplier.toFixed(2)}×`}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-widest text-white/45">
              {playing && nextMult ? `next step: ${nextMult.toFixed(2)}×` : status === 'cashed' ? 'cashed out' : 'cross the bridge'}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* sound + settings */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => { setSound(!soundOn); setShowVol((v) => !v); }}
            className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60"
          >
            {soundOn ? <Speaker width={15} height={15} /> : <SpeakerOff width={15} height={15} />}
          </button>
          {showVol && (
            <input
              type="range" min={0} max={1} step={0.05} value={vol}
              onChange={(e) => { const v = Number(e.target.value); setVol(v); sound.setVolume(v); }}
              className="absolute right-0 top-9 w-24 accent-neon-purple"
            />
          )}
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60">
          <Gear width={15} height={15} />
        </button>
      </div>
    </div>
  );
}
