'use client';

// Ambient spinning-roulette backdrop for desktop: the user's roulette photo,
// masked to a circle and rotated slowly behind the game canvas + ad rails.
// Dimmed so it never fights the game; desktop only; honours reduced-motion.
export default function RouletteBackdrop() {
  return (
    <div className="roulette-bg" aria-hidden="true">
      <div className="roulette-spin roulette-photo" />
    </div>
  );
}
