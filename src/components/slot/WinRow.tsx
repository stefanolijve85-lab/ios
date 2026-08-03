'use client';

import React from 'react';
import { useSlot } from '@/hooks/useSlot';
import { money } from '@/game/format';

// The row directly under the reels: Buy Feature (left), the live WIN counter
// (center), and the Free Spins counter (right) — matching the reference layout.
export function WinRow() {
  const { displayWin, session, buyFeature, phase, totalBet } = useSlot();
  const fs = session?.freeSpins;
  const buyCost = session ? totalBet * session.buyFeatureCost : 0;
  const canBuy = phase === 'idle' && !fs?.active;

  return (
    <div className="qs-winrow">
      <button className="qs-side-btn qs-buy qs-glass" onClick={buyFeature} disabled={!canBuy}>
        <span className="cap">BUY FEATURE</span>
        <span className="val">{money(buyCost, undefined, '€')}</span>
      </button>

      <div className="qs-win-center">
        <div className="qs-win-label">WIN</div>
        <div className="qs-win-amount">{money(displayWin, undefined, '€')}</div>
      </div>

      <div className="qs-side-btn qs-fs qs-glass" aria-live="polite">
        <span className="cap">FREE SPINS</span>
        <span className="val">
          {fs?.active ? `${fs.remaining} / ${fs.total}` : '—'}
        </span>
      </div>
    </div>
  );
}
