'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { getAudio } from '@/lib/audio';
import { num } from '@/lib/format';

export default function StatusRow() {
  const { state } = useGame();
  const [soundOn, setSoundOn] = useState(false);

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

  // Center phase label keeps the row balanced and adds tension context.
  const phaseLabel =
    phase === 'running' ? { txt: 'ROUND LIVE', cls: 'live' }
    : phase === 'crashed' ? { txt: 'STOLEN!', cls: 'crashed' }
    : { txt: 'VAULT OPEN', cls: 'open' };

  return (
    <div className="statusrow">
      {/* Top-left: players still in this round (decreases live). */}
      <div className="holding left">
        <span className="dot" />
        <div>
          <b>{num(holders)}</b> <small>STILL HOLDING</small>
        </div>
      </div>

      <div className={`phase-tag ${phaseLabel.cls}`}>{phaseLabel.txt}</div>

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
