'use client';

import React, { useState } from 'react';
import { useSlot } from '@/hooks/useSlot';

// TURBO · SPIN · AUTO. The spin button doubles as the busy indicator and the
// autoplay counter. Long-press / tap AUTO opens a count picker.
export function Controls() {
  const { spin, turbo, toggleTurbo, spinning, phase, autoRemaining, startAuto, stopAuto, session, totalBet, theme } = useSlot();
  const [autoOpen, setAutoOpen] = useState(false);
  const [spinImg, setSpinImg] = useState<string | null>(
    theme.ui?.spinButton ? `/themes/${theme.key}/${theme.ui.spinButton}` : null,
  );
  const inFeature = session?.freeSpins.active;
  const busy = spinning || phase === 'presenting' || autoRemaining > 0 || !!inFeature;
  const broke = (session?.balance ?? 0) < totalBet && !inFeature;

  return (
    <div className="qs-controls">
      <button className={`qs-pill left${turbo ? ' active' : ''}`} onClick={toggleTurbo}>
        ⚡ TURBO
      </button>

      <button
        className={`qs-spin${busy ? ' busy' : ''}${spinImg ? ' art' : ''}`}
        onClick={spin}
        disabled={busy || broke}
        aria-label="spin"
      >
        <span className="qs-spin-ring" />
        {spinImg ? (
          <img className="qs-spin-img" src={spinImg} alt="" draggable={false} onError={() => setSpinImg(null)} />
        ) : (
          <span aria-hidden>{inFeature ? '★' : '⟳'}</span>
        )}
        {autoRemaining > 0 && <span className="qs-spin-auto-badge">{autoRemaining}</span>}
      </button>

      <div style={{ justifySelf: 'start', position: 'relative' }}>
        <button
          className={`qs-pill right${autoRemaining > 0 ? ' active' : ''}`}
          onClick={() => (autoRemaining > 0 ? stopAuto() : setAutoOpen((o) => !o))}
        >
          ▶ {autoRemaining > 0 ? `STOP (${autoRemaining})` : 'AUTO'}
        </button>
        {autoOpen && autoRemaining === 0 && (
          <div className="qs-glass" style={{ position: 'absolute', bottom: '54px', right: 0, padding: 8, display: 'flex', gap: 6, zIndex: 30 }}>
            {[10, 25, 50, 100].map((n) => (
              <button
                key={n}
                className="qs-round"
                style={{ width: 40, height: 40, fontSize: 13, borderRadius: 10 }}
                onClick={() => {
                  setAutoOpen(false);
                  startAuto(n);
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
