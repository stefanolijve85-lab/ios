'use client';

// Static full-bleed roulette photo behind the game canvas + ad rails on
// desktop (public/roulette-bg.jpeg). Desktop only. (A future version can layer
// a spinning wheel cut-out over this static background.)
export default function RouletteBackdrop() {
  return (
    <div className="roulette-bg" aria-hidden="true">
      <div className="roulette-photo" />
    </div>
  );
}
