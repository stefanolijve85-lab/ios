import { CATALOG, PUBLISHER, RTP_OPTIONS, DEFAULT_RTP_PCT } from '@/brand';
import { RTP } from '@/lib/constants';

const CONTACT = 'partners@xitgames.com';
const DECK = `mailto:${CONTACT}?subject=Request%20deck%20-%20${encodeURIComponent(PUBLISHER)}`;
const rtpPct = Math.round(RTP * 100);

// One B2B home for operators & aggregators (mirrors the LiftOffX operators
// content, adapted for the multi-game XIT engine). No login/backoffice — that's
// the operator phase.
export default function Partners() {
  return (
    <div className="xhub xpartners">
      <header className="xhub-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="xhub-logo" src="/brand/xit-logo.webp" alt={PUBLISHER} />
        <nav className="xnav">
          <a href="/">GAMES</a>
          <a className="on" href="/partners">OPERATORS</a>
          <a className="xhub-cta" href={DECK}>REQUEST DECK</a>
        </nav>
      </header>

      <section className="xhero">
        <div className="xp-eyebrow">FOR OPERATORS &amp; AGGREGATORS</div>
        <h1>Plug-and-play <span>provably-fair</span> crash games</h1>
        <p>
          One certified engine, multiple branded titles. Instant HTML5 launch,
          seamless wallet, a transparent {rtpPct}% RTP. Add {PUBLISHER} to your
          casino in days.
        </p>
        <div className="xp-herobtns">
          <a className="xhub-cta xp-big" href={DECK}>REQUEST DECK</a>
          <a className="xp-ghost" href="#demos">TRY THE DEMOS</a>
        </div>
      </section>

      <section className="xp-stats">
        <div className="xp-stat"><b>{rtpPct}%</b><span>default RTP · configurable</span></div>
        <div className="xp-stat"><b>{CATALOG.length}</b><span>live titles</span></div>
        <div className="xp-stat"><b>100%</b><span>provably fair</span></div>
        <div className="xp-stat"><b>HTML5</b><span>any device</span></div>
      </section>

      <section className="xp-statement">
        <h2>Fully white-label ready.</h2>
        <p className="xp-lead">Your logo. Your colors. Your player experience.</p>
        <p>Deploy {PUBLISHER} titles entirely under your own brand while keeping full ownership of the customer relationship. No visible third-party branding required.</p>
        <p>Designed for operators who want complete control without sacrificing speed to market.</p>
      </section>

      <section className="xp-statement">
        <h2>More margin. Better retention.</h2>
        <p>Configurable RTP options let operators align each game with their commercial objectives.</p>
        <div className="xp-rtps">
          {RTP_OPTIONS.map((r) => (
            <span key={r} className={`xp-rtp${r === DEFAULT_RTP_PCT ? ' on' : ''}`}>{r}%</span>
          ))}
        </div>
        <p className="xp-rtp-note">RTP variants · default {DEFAULT_RTP_PCT}% · set per operator deployment.</p>
        <p>Real-time multiplayer dynamics, instant gameplay loops, dual betting and auto cash-out encourage repeat engagement and longer sessions.</p>
        <p>The result is an experience built for both player enjoyment and operator profitability.</p>
      </section>

      <section className="xp-statement">
        <h2>Seamless aggregator distribution.</h2>
        <p>Built to integrate efficiently through leading aggregators and direct operator partnerships.</p>
        <p>Reduce technical overhead, simplify onboarding, and accelerate go-live timelines.</p>
        <p>Launch faster and scale across multiple markets with minimal friction.</p>
      </section>

      <section className="xp-block">
        <h2>Why operators choose {PUBLISHER}</h2>
        <div className="xp-checks">
          <div className="xp-check">Provably fair — players can verify every round.</div>
          <div className="xp-check">Proven crash game mechanics players already understand.</div>
          <div className="xp-check">True shared-round multiplayer that creates social engagement.</div>
          <div className="xp-check">Configurable RTP to support different commercial models.</div>
          <div className="xp-check">Fully white-label deployment under your own brand.</div>
          <div className="xp-check">One engine, many branded titles — new games in days.</div>
          <div className="xp-check">Fast integration through aggregators or direct partnerships.</div>
          <div className="xp-check">Mobile-first experience optimized for today&apos;s players.</div>
          <div className="xp-check">Built to increase retention and repeat play.</div>
        </div>
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
          <li><b>Certification-ready</b> — RNG &amp; RTP in one auditable core (GLI / iTech Labs on request).</li>
        </ul>
        <div className="xp-steps">
          <div className="xp-step"><b>1</b><span>Sandbox access</span></div>
          <div className="xp-step"><b>2</b><span>Wallet integration</span></div>
          <div className="xp-step"><b>3</b><span>Go live</span></div>
        </div>
      </section>

      <section className="xp-cta">
        <h2>Add {PUBLISHER} to your casino</h2>
        <p>Direct or via your aggregator. Let&apos;s get the games in front of your players.</p>
        <a className="xhub-cta xp-big" href={DECK}>Request the deck →</a>
        <div className="xp-contact">{CONTACT}</div>
      </section>

      <footer className="xfoot">
        <div className="xfoot-brand">{PUBLISHER}</div>
        <div className="xfoot-sub">Provably fair · {rtpPct}% default RTP · © {new Date().getFullYear()} {PUBLISHER}</div>
      </footer>
    </div>
  );
}
