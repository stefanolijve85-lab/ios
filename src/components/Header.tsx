'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { getAudio } from '@/lib/audio';
import Menu from './Menu';

export default function Header() {
  const { state } = useGame();
  const [soundOn, setSoundOn] = useState(false);
  const phase = state?.phase ?? 'betting';

  // reflect the audio that was unlocked on the PLAY screen (sound on by default)
  useEffect(() => { setSoundOn(getAudio().enabled); }, []);

  const toggleSound = async () => {
    const on = await getAudio().toggle();
    setSoundOn(on);
    if (on && phase === 'running') getAudio().startMotif();
  };

  return (
    <header className="header">
      <Menu />
      <div className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="BANKHEIST X" />
      </div>
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
