'use client';

import React, { useEffect } from 'react';
import { useSlot } from '@/hooks/useSlot';
import { money } from '@/game/format';

// Cinematic overlays for big moments: Quantum Portal (free spins), the jackpot
// wheel result, and Big/Mega/Ultra win bursts. Auto-dismiss; error events show
// a toast instead of a full takeover.
export function EventOverlay() {
  const { event, dismissEvent, theme } = useSlot();

  useEffect(() => {
    if (!event) return;
    const ms = event.kind === 'error' ? 2200 : event.kind === 'jackpot' ? 3400 : 2600;
    const t = setTimeout(dismissEvent, ms);
    return () => clearTimeout(t);
  }, [event, dismissEvent]);

  if (!event) return null;

  if (event.kind === 'error') {
    const msg =
      event.payload?.error === 'INSUFFICIENT_FUNDS'
        ? 'Not enough balance for this bet'
        : 'Something went wrong — try again';
    return <div className="qs-toast">{msg}</div>;
  }

  const coins = event.kind !== 'feature';

  return (
    <div className="qs-overlay" onClick={dismissEvent}>
      {coins && <Confetti color={theme.colors.gold} />}
      <div className="qs-burst">
        {event.kind === 'feature' && (
          <>
            <h2>{theme.copy.featureIntro}</h2>
            <p>{String(event.payload?.spins ?? 8)} FREE SPINS AWARDED</p>
          </>
        )}
        {event.kind === 'jackpot' && (
          <>
            <h2>{String(event.payload?.tier)} JACKPOT!</h2>
            <div className="amount">{money(Number(event.payload?.amount ?? 0), undefined, '€')}</div>
          </>
        )}
        {event.kind === 'bigwin' && <BurstWin title={theme.copy.bigWin} win={Number(event.payload?.win)} />}
        {event.kind === 'megawin' && <BurstWin title={theme.copy.megaWin} win={Number(event.payload?.win)} />}
        {event.kind === 'ultrawin' && <BurstWin title={theme.copy.ultraWin} win={Number(event.payload?.win)} />}
      </div>
    </div>
  );
}

function BurstWin({ title, win }: { title: string; win: number }) {
  return (
    <>
      <h2>{title}</h2>
      <div className="amount">{money(win, undefined, '€')}</div>
    </>
  );
}

function Confetti({ color }: { color: string }) {
  const coins = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div className="qs-confetti">
      {coins.map((i) => {
        const s = (i * 2654435761) % 1000 / 1000;
        return (
          <span
            key={i}
            className="qs-coin"
            style={{
              left: `${Math.round(s * 100)}%`,
              animationDuration: `${1.4 + s * 1.6}s`,
              animationDelay: `${s * 0.6}s`,
              color,
            }}
          >
            🪙
          </span>
        );
      })}
    </div>
  );
}
