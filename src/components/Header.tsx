'use client';
import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { getAudio } from '@/lib/audio';

export default function Header() {
  const { state } = useGame();
  const [soundOn, setSoundOn] = useState(false);
  const phase = state?.phase ?? 'betting';

  const toggleSound = async () => {
    const on = await getAudio().toggle();
    setSoundOn(on);
    if (on && phase === 'running') getAudio().startMotif();
  };

  return (
    <header className="header">
      <button className="icon-btn" aria-label="Menu">☰</button>
      <div className="logo">STASH</div>
      <button
        className={`icon-btn ${soundOn ? 'on' : ''}`}
        onClick={toggleSound}
        aria-label="Toggle sound"
        title="Toggle tension audio"
      >
        {soundOn ? '🔊' : '🔈'}
      </button>
    </header>
  );
}
