import { motion } from 'framer-motion';

export type Mood = 'idle' | 'waiting' | 'jump' | 'happy' | 'scared' | 'celebrate';

const EYES: Record<Mood, string> = {
  idle: 'M -7 0 h 4 M 3 0 h 4',
  waiting: 'M -7 1 q 2 -3 4 0 M 3 1 q 2 -3 4 0',
  jump: 'M -6 -1 h 3 M 3 -1 h 3',
  happy: 'M -7 1 q 2 3 4 0 M 3 1 q 2 3 4 0',
  scared: 'M -6 -2 a 2 2 0 1 0 0.1 0 M 4 -2 a 2 2 0 1 0 0.1 0',
  celebrate: 'M -7 -1 l 4 2 l -4 2 M 7 -1 l -4 2 l 4 2',
};

/**
 * "Aero" — an original small futuristic explorer bot. Pure SVG so it scales
 * crisply and reacts to the round (mood) without any image assets.
 */
export default function Character({ mood = 'idle', size = 96 }: { mood?: Mood; size?: number }) {
  const glow = mood === 'scared' ? '#ff3b6b' : mood === 'celebrate' || mood === 'happy' ? '#27f5a3' : '#21e6ff';
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="-50 -60 100 120"
      initial={false}
      animate={{ rotate: mood === 'scared' ? [-4, 4, -4] : 0 }}
      transition={{ duration: 0.25, repeat: mood === 'scared' ? 2 : 0 }}
      style={{ filter: `drop-shadow(0 0 12px ${glow}aa)` }}
    >
      <defs>
        <linearGradient id="body" x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2350" />
          <stop offset="1" stopColor="#0d0a1f" />
        </linearGradient>
        <radialGradient id="visor" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor="#08263a" />
        </radialGradient>
      </defs>

      {/* antenna */}
      <line x1="0" y1="-34" x2="0" y2="-46" stroke={glow} strokeWidth="2" />
      <circle cx="0" cy="-48" r="3.5" fill={glow}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* body */}
      <rect x="-20" y="-6" width="40" height="42" rx="12" fill="url(#body)" stroke={glow} strokeWidth="1.5" />
      <rect x="-7" y="2" width="14" height="16" rx="4" fill={glow} opacity="0.35" />

      {/* arms */}
      <rect x="-30" y="0" width="8" height="22" rx="4" fill="url(#body)" stroke={glow} strokeWidth="1" />
      <rect x="22" y="0" width="8" height="22" rx="4" fill="url(#body)" stroke={glow} strokeWidth="1" />

      {/* legs */}
      <rect x="-14" y="34" width="9" height="16" rx="4" fill="url(#body)" stroke={glow} strokeWidth="1" />
      <rect x="5" y="34" width="9" height="16" rx="4" fill="url(#body)" stroke={glow} strokeWidth="1" />

      {/* head */}
      <rect x="-22" y="-34" width="44" height="32" rx="14" fill="url(#body)" stroke={glow} strokeWidth="1.5" />
      {/* visor */}
      <rect x="-16" y="-28" width="32" height="20" rx="9" fill="url(#visor)" />
      {/* eyes */}
      <path d={EYES[mood]} transform="translate(0,-18)" stroke="#eafaff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}
