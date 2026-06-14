'use client';

export default function Landing({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-scrim" />

      <div className="landing-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="landing-logo" src="/logo.webp" alt="BANKHEIST X" />

        <div className="landing-head">
          <div className="l1">LOCK IT IN.</div>
          <div className="l2">CASH OUT BIG.</div>
          <div className="l3">BEFORE THEY CATCH YOU.</div>
        </div>

        <div className="landing-spacer" />

        <div className="landing-features">
          <div className="feat">
            <span className="fi">👥</span>
            <b>MULTIPLAYER</b>
            <small>PLAY TOGETHER</small>
          </div>
          <div className="feat">
            <span className="fi">🛡️</span>
            <b>SECURE CASH OUT</b>
            <small>LOCK IN YOUR WINNINGS</small>
          </div>
          <div className="feat">
            <span className="fi">⚡</span>
            <b>FAST &amp; FAIR</b>
            <small>PROVABLY FAIR</small>
          </div>
        </div>

        <button className="landing-play" onClick={onPlay}>PLAY</button>
      </div>
    </div>
  );
}
