'use client';
import { useMemo } from 'react';

// Ambient spinning-roulette backdrop for desktop. A perspective PHOTO can't be
// rotated convincingly (the table rotates with it), so we draw a real top-down
// European single-zero wheel as SVG and spin that — crisp at any size, no asset
// needed. It sits dimmed behind the game canvas + ad rails (desktop only).
const SEQ = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const pocketColor = (n: number) => (n === 0 ? '#0b7a3b' : RED.has(n) ? '#b81f28' : '#141414');

export default function RouletteBackdrop() {
  const sectors = useMemo(() => {
    const cx = 500, cy = 500, ro = 492, ri = 372, rt = (ro + ri) / 2;
    const N = SEQ.length;
    const step = (Math.PI * 2) / N;
    const pt = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    return SEQ.map((n, i) => {
      const a0 = -Math.PI / 2 + i * step;
      const a1 = a0 + step;
      const [x0o, y0o] = pt(ro, a0);
      const [x1o, y1o] = pt(ro, a1);
      const [x1i, y1i] = pt(ri, a1);
      const [x0i, y0i] = pt(ri, a0);
      const d =
        `M${x0o.toFixed(1)} ${y0o.toFixed(1)}` +
        ` A${ro} ${ro} 0 0 1 ${x1o.toFixed(1)} ${y1o.toFixed(1)}` +
        ` L${x1i.toFixed(1)} ${y1i.toFixed(1)}` +
        ` A${ri} ${ri} 0 0 0 ${x0i.toFixed(1)} ${y0i.toFixed(1)} Z`;
      const am = a0 + step / 2;
      const [tx, ty] = pt(rt, am);
      const deg = (am * 180) / Math.PI + 90;
      return { d, fill: pocketColor(n), n, tx, ty, deg };
    });
  }, []);

  return (
    <div className="roulette-bg" aria-hidden="true">
      <svg viewBox="0 0 1000 1000" className="roulette-spin">
        <circle cx="500" cy="500" r="499" fill="#2c1a0e" />
        <circle cx="500" cy="500" r="495" fill="#6a4326" />
        {sectors.map((s, i) => (
          <path key={i} d={s.d} fill={s.fill} stroke="#cfcfcf" strokeWidth="1.1" />
        ))}
        {sectors.map((s, i) => (
          <text
            key={`t${i}`}
            x={s.tx}
            y={s.ty}
            fill="#f2efe6"
            fontSize="30"
            fontWeight="700"
            fontFamily="'Oswald','Sora',sans-serif"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${s.deg.toFixed(1)} ${s.tx.toFixed(1)} ${s.ty.toFixed(1)})`}
          >
            {s.n}
          </text>
        ))}
        {/* inner wooden cone + metal spindle */}
        <circle cx="500" cy="500" r="370" fill="#2c1a0e" />
        <circle cx="500" cy="500" r="322" fill="#7a4e2b" />
        <circle cx="500" cy="500" r="210" fill="#5a3620" />
        <circle cx="500" cy="500" r="120" fill="#241610" />
        <circle cx="500" cy="500" r="66" fill="#9a9a9a" />
        <circle cx="500" cy="500" r="34" fill="#d0d0d0" />
      </svg>
    </div>
  );
}
