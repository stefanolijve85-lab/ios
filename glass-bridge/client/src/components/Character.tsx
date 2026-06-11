import { motion } from 'framer-motion';

export type Mood = 'idle' | 'waiting' | 'jump' | 'happy' | 'scared' | 'celebrate';

/**
 * "Aero" — an original little explorer bot: dark rounded armour with a glowing
 * cyan visor, antenna and accent lights. Pure SVG, mood-reactive, no assets.
 */
export default function Character({ mood = 'idle', size = 120 }: { mood?: Mood; size?: number }) {
  const accent = mood === 'scared' ? '#ff3b6b' : mood === 'celebrate' || mood === 'happy' ? '#37f5b0' : '#27e0ff';
  const eyes = EYES[mood] ?? EYES.idle;

  return (
    <motion.svg
      width={size}
      height={size * 1.15}
      viewBox="-60 -70 120 138"
      initial={false}
      animate={{
        y: mood === 'waiting' || mood === 'idle' ? [0, -4, 0] : 0,
        rotate: mood === 'scared' ? [-5, 5, -5, 0] : 0,
      }}
      transition={{
        y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 0.3, repeat: mood === 'scared' ? 2 : 0 },
      }}
      style={{ filter: `drop-shadow(0 0 16px ${accent}cc) drop-shadow(0 10px 14px rgba(0,0,0,0.6))` }}
    >
      <defs>
        <linearGradient id="armor" x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3358" />
          <stop offset="0.5" stopColor="#16122b" />
          <stop offset="1" stopColor="#0a0818" />
        </linearGradient>
        <linearGradient id="helm" x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#403a63" />
          <stop offset="1" stopColor="#0e0b20" />
        </linearGradient>
        <radialGradient id="visor" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor={accent} />
          <stop offset="0.55" stopColor={accent} stopOpacity="0.55" />
          <stop offset="1" stopColor="#05131f" />
        </radialGradient>
        <radialGradient id="floorglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={accent} stopOpacity="0.5" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ground reflection */}
      <ellipse cx="0" cy="62" rx="40" ry="9" fill="url(#floorglow)" />

      {/* antenna */}
      <line x1="0" y1="-44" x2="0" y2="-58" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="-60" r="4.5" fill={accent}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* legs */}
      <rect x="-17" y="34" width="13" height="22" rx="6" fill="url(#armor)" stroke="#000" strokeWidth="0.5" />
      <rect x="4" y="34" width="13" height="22" rx="6" fill="url(#armor)" stroke="#000" strokeWidth="0.5" />
      <rect x="-15" y="48" width="9" height="4" rx="2" fill={accent} opacity="0.9" />
      <rect x="6" y="48" width="9" height="4" rx="2" fill={accent} opacity="0.9" />

      {/* arms */}
      <rect x="-34" y="2" width="11" height="26" rx="5.5" fill="url(#armor)" />
      <rect x="23" y="2" width="11" height="26" rx="5.5" fill="url(#armor)" />
      <circle cx="-28.5" cy="10" r="2.4" fill={accent} />
      <circle cx="28.5" cy="10" r="2.4" fill={accent} />

      {/* torso */}
      <rect x="-24" y="-4" width="48" height="42" rx="15" fill="url(#armor)" stroke="#2a2548" strokeWidth="1" />
      {/* chest light */}
      <path d="M0 6 l9 6 l-9 6 l-9 -6 z" fill={accent} opacity="0.85" />
      <rect x="-14" y="22" width="28" height="3.5" rx="1.8" fill={accent} opacity="0.5" />

      {/* head / helmet */}
      <rect x="-26" y="-44" width="52" height="40" rx="19" fill="url(#helm)" stroke="#2a2548" strokeWidth="1" />
      {/* ear pods */}
      <rect x="-30" y="-30" width="6" height="12" rx="3" fill="#0c0a1c" stroke={accent} strokeWidth="1" />
      <rect x="24" y="-30" width="6" height="12" rx="3" fill="#0c0a1c" stroke={accent} strokeWidth="1" />
      {/* visor */}
      <rect x="-19" y="-38" width="38" height="26" rx="12" fill="url(#visor)" stroke={accent} strokeWidth="1" />
      {/* eyes */}
      <g transform="translate(0,-25)" stroke="#eafdff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={eyes} />
      </g>
    </motion.svg>
  );
}

const EYES: Record<Mood, string> = {
  idle: 'M -8 0 h 5 M 3 0 h 5',
  waiting: 'M -8 -1 v 3 M 3 -1 v 3',
  jump: 'M -9 -2 h 5 M 4 -2 h 5',
  happy: 'M -9 1 q 2.5 -4 5 0 M 4 1 q 2.5 -4 5 0',
  scared: 'M -6.5 -2 a 3 3 0 1 0 0.1 0 M 5.5 -2 a 3 3 0 1 0 0.1 0',
  celebrate: 'M -9 -2 l 5 2.5 l -5 2.5 M 9 -2 l -5 2.5 l 5 2.5',
};
