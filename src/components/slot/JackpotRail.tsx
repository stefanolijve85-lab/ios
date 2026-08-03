'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSlot } from '@/hooks/useSlot';
import { money } from '@/game/format';
import type { JackpotTier } from '@/game/config';

// The four progressive jackpots. Values arrive live over websockets and roll
// up smoothly so the pots feel alive between real contributions. Layout mirrors
// the reference: GRAND / MAJOR on top, MINOR / MINI below.
const ORDER: JackpotTier[] = ['GRAND', 'MAJOR', 'MINOR', 'MINI'];

export function JackpotRail() {
  const { jackpots, theme } = useSlot();
  return (
    <div className="qs-jackpots">
      {ORDER.map((tier) => (
        <JackpotCell key={tier} tier={tier} value={jackpots[tier]} theme={theme} />
      ))}
    </div>
  );
}

function JackpotCell({ tier, value, theme }: { tier: JackpotTier; value: number; theme: ReturnType<typeof useSlot>['theme'] }) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number>();
  const from = useRef(value);

  useEffect(() => {
    cancelAnimationFrame(raf.current ?? 0);
    from.current = display;
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from.current + (value - from.current) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const c = theme.jackpotColors[tier];
  const style = {
    ['--jp-from' as string]: c.from,
    ['--jp-to' as string]: c.to,
    ['--jp-glow' as string]: c.glow,
  } as React.CSSProperties;

  return (
    <div className="qs-jp" style={style}>
      <div className="qs-jp-label">{tier}</div>
      <div className="qs-jp-value">{money(display, undefined, '€')}</div>
    </div>
  );
}
