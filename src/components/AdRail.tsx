'use client';

// Desktop-only advertising rail. On wide screens the scaled game canvas sits
// centred with empty space on either side; this fills that space with a banner
// ad slot (one per side). ViewportScale reserves room for these so the game
// never overlaps them, and CSS hides them below the desktop breakpoint.
//
// Placeholder by default. To ship a real banner, pass `src` (and optional
// `href`): e.g. <AdRail side="left" src="/ads/left.webp" href="https://…" />.
export default function AdRail({
  side,
  src,
  href,
  alt = 'Advertentie',
}: {
  side: 'left' | 'right';
  src?: string;
  href?: string;
  alt?: string;
}) {
  const inner = src ? (
    <img className="ad-slot-img" src={src} alt={alt} />
  ) : (
    <div className="ad-slot-ph">
      <span className="ad-slot-label">ADVERTENTIE</span>
      <span className="ad-slot-size">300 × 600</span>
    </div>
  );

  return (
    <aside className={`ad-rail ad-rail-${side}`} aria-hidden="true">
      {href ? (
        <a className="ad-slot" href={href} target="_blank" rel="noopener noreferrer sponsored">
          {inner}
        </a>
      ) : (
        <div className="ad-slot">{inner}</div>
      )}
    </aside>
  );
}
