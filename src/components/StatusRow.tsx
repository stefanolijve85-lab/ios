'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { getAudio } from '@/lib/audio';
import { num } from '@/lib/format';

export default function StatusRow() {
  const { state } = useGame();
  const [soundOn, setSoundOn] = useState(false);

  const online = state?.online ?? 12483;
  const holders = state?.holders ?? 0;
  const phase = state?.phase ?? 'betting';

  // Alarm is "live" in the tense final stretch of a running round.
  const [danger, setDanger] = useState(false);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = state;
      if (s && s.phase === 'running' && s.startTime) {
        const elapsed = Date.now() + (s.now - Date.now()) - s.startTime;
        setDanger(elapsed > 9000);
      } else {
        setDanger(false);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const toggleSound = async () => {
    const on = await getAudio().toggle();
    setSoundOn(on);
    if (on && phase === 'running') getAudio().startMotif();
  };

  return (
    <div className="statusrow">
      {/* left: total online */}
      <div className="chip-stat">
        👥 <b>{num(online)}</b> ONLINE
      </div>

      {/* center: players still in this round (decreases live) */}
      <div className="holding">
        <span className="dot" />
        <div>
          <b>{num(holders)}</b> <small>STILL HOLDING</small>
        </div>
      </div>

      <button
        className={`alarm ${danger ? 'live' : ''}`}
        onClick={toggleSound}
        aria-label="Toggle sound"
        title="Toggle tension audio"
      >
        {danger ? '🚨' : soundOn ? '🔊' : '🔈'}
      </button>
    </div>
  );
}
