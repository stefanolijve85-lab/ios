import { CATALOG, PUBLISHER } from '@/brand';
import { HOUSE_EDGE, RTP } from '@/lib/constants';

const CONTACT = 'partners@xitgames.com';
const rtpPct = Math.round(RTP * 100);

// One B2B home for operators & aggregators: pitch, full game specs, integration,
// compliance, live demos to test, and contact. Built so XIT Games can be offered
// to as many casinos as possible. (No login/backoffice — that's the operator
// phase.)
export default function Partners() {
  return (
    <div className="xhub xpartners">
      <header className="xhub-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="xhub-logo" src="/brand/xit-logo.webp" alt={PUBLISHER} />
        <nav className="xnav">
          <a href="/">GAMES</a>
          <a className="on" href="/partners">OPERATORS</a>
          <a className="xhub-cta" href={`mailto:${CONTACT}`}>CONTACT</a>
        </nav>
      </header>

      <section className="xhero">
        <div className="xp-eyebrow">FOR OPERATORS &amp; AGGREGATORS</div>
        <h1>Plug-and-play <span>provably-fair</span> crash games</h1>
        <p>
          One certified engine, multiple branded titles. Instant HTML5 launch,
          seamless wallet, a single transparent {rtpPct}% RTP. Add {PUBLISHER} to
          your casino in days.
        </p>
        <div className="xp-herobtns">
          <a className="xhub-cta xp-big" href={`mailto:${CONTACT}`}>BECOME A PARTNER</a>
          <a className="xp-ghost" href="#demos">TRY THE DEMOS</a>
        </div>
      </section>

      <section className="xp-stats">
        <div className="xp-stat"><b>{rtpPct}%</b><span>RTP · {Math.round(HOUSE_EDGE * 100)}% edge</span></div>
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
          <li><b>Multiplayer &amp; social</b> — shared live rounds, chat, a live-wins feed and a leaderboard, out of the box.</li>
          <li><b>Mobile-first HTML5</b> — instant-play in the browser, no download, portrait-optimised, low latency.</li>
          <li><b>Fast time-to-market</b> — a new branded title in days, not months.</li>
        </ul>
      </section>

      <section className="xp-block">
        <h2>Game specs</h2>
        <div className="xp-specs">
          <div className="xp-spec-head">
            <span>Game</span><span>RTP</span><span>Max win</span><span>Volatility</span>
          </div>
          {CATALOG.map((g) => (
            <div key={g.key} className="xp-spec-row">
              <span className="xp-spec-name">{g.name}</span>
              <span>{rtpPct}%</span>
              <span>{g.maxX.toLocaleString('en-US')}×</span>
              <span>{g.volatility}</span>
            </div>
          ))}
        </div>
        <p className="xp-note">All titles: provably fair · server-authoritative outcomes · €/$/£ &amp; crypto-ready · multi-language.</p>
      </section>

      <section className="xp-block" id="demos">
        <h2>Live demos — test now</h2>
        <p className="xp-sub">One place to try every game. Share these with your team or players.</p>
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
          <li><b>HTML5 launch URL</b> per game (iframe or redirect), with demo &amp; real-money modes.</li>
          <li><b>Seamless wallet API</b> — one integration powers every title.</li>
          <li><b>Single RGS</b>, server-authoritative outcomes, low latency.</li>
          <li><b>Multi-currency &amp; multi-language</b> ready.</li>
          <li><b>Provably-fair verification</b> built into every game.</li>
          <li><b>Certification-ready</b> — RNG &amp; RTP in one auditable core (GLI / iTech Labs on request).</li>
        </ul>
        <div className="xp-steps">
          <div className="xp-step"><b>1</b><span>Sandbox access</span></div>
          <div className="xp-step"><b>2</b><span>Wallet integration</span></div>
          <div className="xp-step"><b>3</b><span>Go live</span></div>
        </div>
      </section>

      <section className="xp-block">
        <h2>Fairness &amp; compliance</h2>
        <ul className="xp-list">
          <li><b>Transparent {rtpPct}% RTP</b>, identical across every title — no hidden per-game edge.</li>
          <li><b>Player-verifiable</b> — anyone can recompute any round from the revealed seed.</li>
          <li><b>Responsible gambling</b> hooks and limits supported.</li>
          <li><b>Licensing &amp; independent certification</b> available on request.</li>
        </ul>
      </section>

      <section className="xp-cta">
        <h2>Add {PUBLISHER} to your casino</h2>
        <p>Direct or via your aggregator. Let&apos;s get the games in front of your players.</p>
        <a className="xhub-cta xp-big" href={`mailto:${CONTACT}`}>Talk integration →</a>
        <div className="xp-contact">{CONTACT}</div>
      </section>

      <footer className="xfoot">
        <div className="xfoot-brand">{PUBLISHER}</div>
        <div className="xfoot-sub">Provably fair · {rtpPct}% RTP · © {new Date().getFullYear()} {PUBLISHER}</div>
      </footer>
    </div>
  );
}
