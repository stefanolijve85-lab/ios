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

  const toggleSound = async () => {
    const on = await getAudio().toggle();
    setSoundOn(on);
    if (on && phase === 'running') getAudio().startMotif();
  };

  return (
    <div className="statusrow">
      {/* only the live "still holding" indicator, centered */}
      <div className="holding">
        <span className="dot" />
        <div>
          <b>{num(holders)}</b> <small>STILL HOLDING</small>
        </div>
      </div>

      <button
        className={`alarm ${soundOn ? 'on' : ''}`}
        onClick={toggleSound}
        aria-label="Toggle sound"
        title="Toggle tension audio"
      >
        {soundOn ? '🔊' : '🔈'}
      </button>
    </div>
  );
}
