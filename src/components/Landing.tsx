'use client';

export default function Landing({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="landing">
      <div className="landing-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="landing-img" src="/landing.webp" alt="BANKHEIST X — Lock it in. Cash out big." />
        {/* real, tappable PLAY over the baked-in button */}
        <button className="landing-play-hit" onClick={onPlay} aria-label="Play">
          <span className="sr-only">PLAY</span>
        </button>
      </div>
    </div>
  );
}
