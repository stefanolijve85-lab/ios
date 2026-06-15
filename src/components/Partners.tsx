import { CATALOG, PUBLISHER } from '@/brand';
import { HOUSE_EDGE, RTP } from '@/lib/constants';

const CONTACT = 'partners@xitgames.com';

// B2B page for operators & aggregators. Pitches the engine + the catalogue and
// points to live demo launch URLs. No backoffice/login (that's the operator
// phase) — this is the "integrate with us" front door.
export default function Partners() {
  return (
    <div className="xhub xpartners">
      <header className="xhub-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="xhub-logo" src="/brand/xit-logo.webp" alt={PUBLISHER} />
        <nav className="xnav">
          <a href="/">GAMES</a>
          <a className="on" href="/partners">PARTNERS</a>
          <a className="xhub-cta" href={`mailto:${CONTACT}`}>CONTACT</a>
        </nav>
      </header>

      <section className="xhero">
        <div className="xp-eyebrow">FOR OPERATORS &amp; AGGREGATORS</div>
        <h1>Plug-and-play <span>provably-fair</span> crash games</h1>
        <p>
          One certified engine, multiple branded titles. Mobile-first HTML5,
          instant launch, a single transparent {Math.round(RTP * 100)}% RTP.
        </p>
        <a className="xhub-cta xp-big" href={`mailto:${CONTACT}`}>BECOME A PARTNER</a>
      </section>

      <section className="xp-stats">
        <div className="xp-stat"><b>{Math.round(RTP * 100)}%</b><span>RTP · {Math.round(HOUSE_EDGE * 100)}% edge</span></div>
        <div className="xp-stat"><b>{CATALOG.length}</b><span>live titles</span></div>
        <div className="xp-stat"><b>100%</b><span>provably fair</span></div>
        <div className="xp-stat"><b>HTML5</b><span>any device</span></div>
      </section>

      <section className="xp-block">
        <h2>Why {PUBLISHER}</h2>
        <ul className="xp-list">
          <li><b>Provably fair</b> — every round is committed before bets and verifiable by the player (HMAC-SHA256 commit–reveal).</li>
          <li><b>One engine, many games</b> — new titles are a theme on a shared, certifiable core. Faster to launch, one place to audit.</li>
          <li><b>Per-game feel, shared math</b> — tune volatility &amp; pacing per title while the RTP stays identical everywhere.</li>
          <li><b>Multiplayer &amp; social</b> — shared live rounds, chat, live wins feed and a leaderboard out of the box.</li>
          <li><b>Mobile-first HTML5</b> — instant-play in the browser, no download, portrait-optimised.</li>
        </ul>
      </section>

      <section className="xgames" id="games">
        <h2 className="xgames-title">LIVE DEMOS</h2>
        <div className="xp-demos">
          {CATALOG.map((g) => (
            <a key={g.key} className="xp-demo" href={g.url ?? `/${g.key}`}>
              <span className="xp-demo-name">{g.name}</span>
              <span className="xp-demo-go">Launch demo →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="xp-block">
        <h2>Integration</h2>
        <ul className="xp-list">
          <li>Instant <b>HTML5 launch URLs</b> per game, with a demo mode.</li>
          <li>Built-in <b>provably-fair verification</b> for players.</li>
          <li><b>Seamless wallet / RGS</b> integration available on request.</li>
          <li>Certification-ready shared engine (RNG &amp; RTP in one auditable core).</li>
        </ul>
        <a className="xhub-cta xp-big" href={`mailto:${CONTACT}`}>Talk integration →</a>
        <div className="xp-contact">{CONTACT}</div>
      </section>

      <footer className="xfoot">
        <div className="xfoot-brand">{PUBLISHER}</div>
        <div className="xfoot-sub">Provably fair · {Math.round(RTP * 100)}% RTP · © {new Date().getFullYear()} {PUBLISHER}</div>
      </footer>
    </div>
  );
}
