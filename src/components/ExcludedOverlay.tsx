'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';

// Full-screen block shown while the player is self-excluded / on a cool-off.
// A timed break counts down and lifts itself; a permanent exclusion stays.
function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export default function ExcludedOverlay() {
  const { excludedUntil } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (excludedUntil == null || excludedUntil === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [excludedUntil]);

  if (excludedUntil == null) return null;
  const permanent = excludedUntil === 0;
  const remaining = excludedUntil - now;
  if (!permanent && remaining <= 0) return null; // cool-off elapsed — play resumes

  return (
    <div className="excl-scrim">
      <div className="excl-card">
        <div className="excl-icon">🛡</div>
        <div className="excl-title">YOU&apos;RE TAKING A BREAK</div>
        {permanent ? (
          <p className="excl-lead">You&apos;ve self-excluded from play. Contact support to review this.</p>
        ) : (
          <>
            <p className="excl-lead">Betting is paused. You can come back in</p>
            <div className="excl-timer">{fmt(remaining)}</div>
          </>
        )}
        <p className="excl-note">Need support now? Visit <b>begambleaware.org</b> or call your local helpline.</p>
      </div>
    </div>
  );
}
