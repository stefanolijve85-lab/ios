'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';
import { creditLine } from '@/brand';
import { getAudio } from '@/lib/audio';

export default function Landing({ onPlay }: { onPlay: () => void }) {
  const { state } = useGame();
  const theme = useTheme();
  const [clicked, setClicked] = useState(false);
  const phase = state?.phase ?? 'betting';

  // Once you've tapped PLAY, enter the game the moment the next betting window opens.
  useEffect(() => {
    if (clicked && phase === 'betting') onPlay();
  }, [clicked, phase, onPlay]);

  const handlePlay = () => {
    const a = getAudio();
    if (a && !a.enabled) a.toggle();     // sound on by default (this tap unlocks iOS audio)
    if (phase === 'betting') onPlay();   // can bet right now → go straight in
    else setClicked(true);               // a round is running → wait for the next
  };

  const video = theme.assets.landingVideo;

  return (
    <div className="landing">
      <div className={`landing-img-wrap${video ? ' has-video' : ''}`}>
        {video ? (
          <video
            className="landing-video"
            src={video}
            autoPlay loop muted playsInline preload="auto"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="landing-img" src={theme.assets.landing} alt={theme.copy.landingAlt} />
        )}

        {/* over a video we render the logo + a visible PLAY button (the static
            landing image already has them baked in) */}
        {video && (
          <div className="landing-vov">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="landing-vlogo" src={theme.assets.logo} alt={theme.name} />
          </div>
        )}

        {!clicked ? (
          video ? (
            theme.assets.playButton ? (
              <button className="landing-vplay-img" onClick={handlePlay} aria-label="Play">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={theme.assets.playButton} alt="PLAY" />
              </button>
            ) : (
              <button className="landing-vplay" onClick={handlePlay}>PLAY</button>
            )
          ) : (
            <button className="landing-play-hit" onClick={handlePlay} aria-label="Play">
              <span className="sr-only">PLAY</span>
            </button>
          )
        ) : (
          <div className="landing-wait">
            <div className="vw-spinner" />
            <div className="vw-text">WAIT FOR NEXT VAULT</div>
          </div>
        )}

        <div className="landing-credit">{creditLine()}</div>
      </div>
    </div>
  );
}
