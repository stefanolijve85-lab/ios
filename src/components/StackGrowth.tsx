'use client';
import { useEffect, useRef } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';

// A pile of loot that grows with the multiplier: stacks are revealed one by one
// (front/bottom first, building up and back) as the round climbs. Themed via
// ui.growth.sprites. Shared engine feature — BANKHEIST money, DEEP DIVE gold, …
//   l/b = position (% from left / bottom), s = scale, i = sprite index
const PILE = [
  { l: 50, b: 2, s: 1.0, i: 0 },
  { l: 35, b: 3, s: 0.9, i: 1 },
  { l: 65, b: 3, s: 0.9, i: 0 },
  { l: 43, b: 12, s: 0.8, i: 1 },
  { l: 57, b: 12, s: 0.8, i: 0 },
  { l: 27, b: 7, s: 0.76, i: 0 },
  { l: 73, b: 7, s: 0.76, i: 1 },
  { l: 50, b: 19, s: 0.66, i: 0 },
  { l: 37, b: 19, s: 0.6, i: 1 },
  { l: 63, b: 19, s: 0.6, i: 0 },
];

export default function StackGrowth() {
  const { liveMultiplier, stateRef } = useGame();
  const theme = useTheme();
  const sprites = theme.ui?.growth?.sprites;
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sprites?.length) return;
    let raf = 0, lastN = -1;
    const loop = () => {
      const running = stateRef.current?.phase === 'running';
      const m = running ? liveMultiplier() : 1;
      // log-ish reveal: a couple stacks early, full pile by ~40x
      const frac = Math.min(1, Math.log(Math.max(1, m)) / Math.log(40));
      const n = running ? Math.max(1, Math.round(frac * PILE.length)) : 0;
      if (n !== lastN) {
        for (let i = 0; i < PILE.length; i++) refs.current[i]?.classList.toggle('on', i < n);
        lastN = n;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sprites, liveMultiplier, stateRef]);

  if (!sprites?.length) return null;
  return (
    <div className="vault-stacks" aria-hidden>
      {PILE.map((p, idx) => (
        <div
          key={idx}
          ref={(el) => { refs.current[idx] = el; }}
          className="vault-stack"
          style={{
            left: `${p.l}%`,
            bottom: `${p.b}%`,
            width: `${20 * p.s}%`,
            backgroundImage: `url(${sprites[p.i % sprites.length]})`,
          }}
        />
      ))}
    </div>
  );
}
