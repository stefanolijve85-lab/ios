'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';

export default function Landing({ onPlay }: { onPlay: () => void }) {
  const { state } = useGame();
  const [clicked, setClicked] = useState(false);
  const phase = state?.phase ?? 'betting';

  // Once you've tapped PLAY, enter the game the moment the next betting window opens.
  useEffect(() => {
    if (clicked && phase === 'betting') onPlay();
  }, [clicked, phase, onPlay]);

  const handlePlay = () => {
    if (phase === 'betting') onPlay();   // can bet right now → go straight in
    else setClicked(true);               // a round is running → wait for the next
  };

  return (
    <div className="landing">
      <div className="landing-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="landing-img" src="/landing.webp" alt="BANKHEIST X — Lock it in. Cash out big." />

        {!clicked ? (
          <button className="landing-play-hit" onClick={handlePlay} aria-label="Play">
            <span className="sr-only">PLAY</span>
          </button>
        ) : (
          <>
            <div className="searchlight" />
            <div className="landing-wait">
              <div className="vw-spinner" />
              <div className="vw-text">WAIT FOR NEXT VAULT</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
