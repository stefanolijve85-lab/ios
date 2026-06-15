import { CATALOG, PUBLISHER } from '@/brand';

// XIT Games hub (xitgames.com). "Know when to XIT." — hero + the three game
// cards, each playable. Matches the brand mockup.
export default function Hub() {
  return (
    <div className="xhub">
      <header className="xhub-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="xhub-logo" src="/brand/xit-logo.webp" alt={PUBLISHER} />
        <nav className="xnav">
          <a href="/partners">PARTNERS</a>
          <a className="xhub-cta" href="#games">PLAY NOW</a>
        </nav>
      </header>

      <section className="xhero">
        <h1>KNOW WHEN TO <span>XIT.</span></h1>
        <p>Multiplayer crash games.</p>
        <p className="xhero-tag">Cash out &ndash; <span>Get out!</span><br />Before it&apos;s too late</p>
        <div className="xfeatures">
          <span>🛡️ Provably fair</span>
          <span>👥 24/7 multiplayer</span>
          <span>⚡ Instant payouts</span>
        </div>
      </section>

      <section className="xgames" id="games">
        <h2 className="xgames-title">OUR GAMES</h2>
        <div className="xgames-grid">
          {CATALOG.map((g) => (
            <a key={g.key} className="xgame" href={g.url ?? `/${g.key}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="xgame-img" src={g.card} alt={g.name} />
              <div className="xgame-bar">
                <span className="xgame-tag">{g.tagline}</span>
                <span className="xgame-play">PLAY NOW →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="xfoot">
        <div className="xfoot-brand">{PUBLISHER}</div>
        <div className="xfoot-sub">Provably fair · 97% RTP · © {new Date().getFullYear()} {PUBLISHER}</div>
      </footer>
    </div>
  );
}
