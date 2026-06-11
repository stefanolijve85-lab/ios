/**
 * Neon-city horizon behind the bridge. A layered SVG skyline of glowing
 * towers under a starfield, with a bright vanishing-point glow where the bridge
 * recedes. Purely decorative.
 */
export default function NeonCity({ className = '' }: { className?: string }) {
  // Deterministic "random" buildings so the skyline is stable between renders.
  const towers = buildTowers();
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0620" />
            <stop offset="0.6" stopColor="#170a35" />
            <stop offset="1" stopColor="#241046" />
          </linearGradient>
          <radialGradient id="vanish" cx="0.5" cy="0.78" r="0.5">
            <stop offset="0" stopColor="#a7d8ff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#5b8bff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#5b8bff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b2a6b" />
            <stop offset="1" stopColor="#160a2e" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="400" height="220" fill="url(#sky)" />

        {/* stars */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill="#cfe6ff" opacity={s[3]} />
        ))}

        {/* far glow at the vanishing point */}
        <ellipse cx="200" cy="180" rx="150" ry="90" fill="url(#vanish)" />

        {/* skyline */}
        {towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={t.y} width={t.w} height={220 - t.y} fill="url(#tower)" opacity={t.depth} />
            {/* neon edge */}
            <rect x={t.x} y={t.y} width={t.w} height="2" fill={t.color} opacity={0.8 * t.depth} />
            {/* windows */}
            {t.windows.map((wy, j) => (
              <rect key={j} x={t.x + 2} y={wy} width={t.w - 4} height="1.6" fill={t.color} opacity={0.5 * t.depth} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

const STARS: [number, number, number, number][] = Array.from({ length: 60 }, (_, i) => {
  const r = mulberry(i + 1);
  return [r() * 400, r() * 110, r() * 0.9 + 0.2, r() * 0.6 + 0.2];
});

function buildTowers() {
  const r = mulberry(99);
  const colors = ['#27e0ff', '#a855f7', '#e635ff', '#3b6bff', '#ff4fd8'];
  const towers: { x: number; y: number; w: number; depth: number; color: string; windows: number[] }[] = [];
  let x = -10;
  while (x < 410) {
    const w = 14 + r() * 26;
    const distFromCenter = Math.abs(x + w / 2 - 200) / 200; // 0 center .. 1 edges
    const h = (40 + r() * 120) * (0.45 + distFromCenter * 0.55); // taller toward the edges
    const y = 220 - h;
    const depth = 0.5 + distFromCenter * 0.5;
    const windows: number[] = [];
    for (let wy = y + 6; wy < 218; wy += 6) if (r() > 0.45) windows.push(wy);
    towers.push({ x, y, w, depth, color: colors[Math.floor(r() * colors.length)], windows });
    x += w + 2 + r() * 6;
  }
  return towers;
}

/** Tiny deterministic PRNG so the skyline is identical every render. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
