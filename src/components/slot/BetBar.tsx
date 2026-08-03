'use client';

import React from 'react';
import { useSlot } from '@/hooks/useSlot';
import { money } from '@/game/format';

// LINES · BET · TOTAL BET with steppers, plus the paytable/info button.
export function BetBar({ onInfo }: { onInfo: () => void }) {
  const { session, lineBet, totalBet, betUp, betDown, lineBetIndex, phase } = useSlot();
  const lines = session?.lines ?? 25;
  const maxIdx = (session?.lineBets.length ?? 10) - 1;
  const locked = phase !== 'idle';

  return (
    <div className="qs-betbar">
      <button className="qs-icon-btn" onClick={onInfo} aria-label="paytable">ⓘ</button>

      <div className="qs-stepper qs-glass">
        <div className="col">
          <div className="cap">LINES</div>
          <div className="val">{lines}</div>
        </div>
      </div>

      <div className="qs-stepper qs-glass">
        <button className="qs-round" onClick={betDown} disabled={locked || lineBetIndex <= 0}>−</button>
        <div className="col">
          <div className="cap">BET / LINE</div>
          <div className="val">{money(lineBet, undefined, '€')}</div>
        </div>
        <button className="qs-round" onClick={betUp} disabled={locked || lineBetIndex >= maxIdx}>+</button>
      </div>

      <div className="qs-stepper qs-glass qs-total">
        <div className="col">
          <div className="cap">TOTAL BET</div>
          <div className="val">{money(totalBet, undefined, '€')}</div>
        </div>
      </div>
    </div>
  );
}
