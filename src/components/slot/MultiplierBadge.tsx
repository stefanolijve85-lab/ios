'use client';

import React from 'react';
import { useSlot } from '@/hooks/useSlot';

// The Quantum multiplier indicator above the reels. Shows the current applied
// tumble/free-spin multiplier; pulses when it climbs.
export function MultiplierBadge() {
  const { displayMultiplier, session } = useSlot();
  const inFeature = session?.freeSpins.active;
  const m = displayMultiplier > 0 ? displayMultiplier : inFeature ? 2 : 1;
  const show = displayMultiplier > 1 || inFeature;

  return (
    <div className={`qs-multiplier${show ? '' : ' hidden'}`} aria-hidden={!show}>
      <div className="qs-multiplier-label">MULTIPLIER</div>
      <div className="qs-multiplier-value">×{m}</div>
    </div>
  );
}
