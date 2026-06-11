import type { Metadata } from 'next';
import './operators.css';

export const metadata: Metadata = {
  title: 'Liftoff X — crash game for casino operators & aggregators',
  description:
    'Aviator-class crash game with a built-in social/retention layer and an operator-friendly revenue model. Configurable RTP, volume-tiered rev-share, provably fair, true multiplayer.',
};

const MAIL = 'mailto:stefanolijve85@gmail.com?subject=Liftoff%20X%20—%20partnership';

export default function Operators() {
  return (
    <div className="mkt">
      {/* NAV */}
      <nav>
        <div className="wrap">
          <img className="logo" src="/liftoffx.png" alt="Liftoff X" />
          <span className="sp" />
          <a className="btn ghost hide-sm" href="/">Play demo</a>
          <a className="btn primary" href={MAIL}>Get in touch</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap">
          <span className="eyebrow">B2B crash game · operators &amp; aggregators</span>
          <h1>The crash game operators <span className="g">actually earn from.</span></h1>
          <p className="lead">
            An Aviator-class instant game with a built-in social/retention layer and a
            revenue model that gives operators more margin. Provably fair, mobile-first,
            and a real shared-round multiplayer.
          </p>
          <div className="cta">
            <a className="btn primary" href="/">▶ Play the live demo</a>
            <a className="btn ghost" href={MAIL}>Request the deck</a>
          </div>
          <div className="pills">
            <span className="pill"><b>Provably fair</b></span>
            <span className="pill"><b>Configurable RTP</b> 97/96/95%</span>
            <span className="pill"><b>Dual bets</b> + auto-cashout</span>
            <span className="pill"><b>True multiplayer</b></span>
            <span className="pill"><b>White-label</b></span>
          </div>
          <div className="shots">
            <img className="shot" src="/preview-3.png" alt="Liftoff X gameplay at €100 stakes" loading="lazy" />
            <img className="shot" src="/preview-1.png" alt="Liftoff X — rocket climbing at 24x with high-roller stakes" loading="lazy" />
            <img className="shot" src="/preview-4.png" alt="Liftoff X — a small-stakes (€20) win" loading="lazy" />
            <img className="shot" src="/preview-2.png" alt="Liftoff X — a big multi-bet win" loading="lazy" />
          </div>
          <p className="shotcap">From €0.10 stakes to high-rollers — the same game scales to every player.</p>
        </div>
      </header>

      {/* PROBLEM */}
      <section>
        <div className="wrap">
          <h2>Crash is a top category. The supply isn’t.</h2>
          <p className="sub">
            Instant/crash games are now a top-3 revenue category, but supply is
            concentrated in a few providers. Operators get stuck with the same game
            everyone else runs.
          </p>
          <div className="grid">
            <div className="card"><div className="ic">🔒</div><h3>High, fixed rev-share</h3><p>One dominant supplier, take-it-or-leave-it terms.</p></div>
            <div className="card"><div className="ic">🎚️</div><h3>Fixed RTP</h3><p>No way to tune the house edge to your market.</p></div>
            <div className="card"><div className="ic">👤</div><h3>Zero differentiation</h3><p>The exact same game as every other casino — no brand ownership.</p></div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section>
        <div className="wrap">
          <h2>Liftoff X fixes all three.</h2>
          <p className="sub">Aviator-class on feel. Social by design. Built to make the operator more money.</p>
          <div className="grid">
            <div className="card"><div className="ic">🚀</div><h3>Aviator-class gameplay</h3><p>Dual simultaneous bets, auto-cashout, live shared rounds — instantly familiar, premium feel.</p></div>
            <div className="card"><div className="ic">🏆</div><h3>Social by design</h3><p>Live leaderboard, activity feed, profiles and chat lift rounds-per-player — more engagement, more GGR.</p></div>
            <div className="card"><div className="ic">💸</div><h3>Operator-friendly</h3><p>Configurable RTP, lower volume-tiered rev-share, and white-label / “powered by you” skinning.</p></div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section>
        <div className="wrap">
          <h2>vs. the incumbent</h2>
          <p className="sub">Same hit format. Better terms, more control, more retention.</p>
          <table className="cmp">
            <thead><tr><th>Feature</th><th>Incumbent (Aviator-style)</th><th>Liftoff X</th></tr></thead>
            <tbody>
              <tr><td>RTP</td><td>Fixed (≈97%)</td><td>Configurable 97/96/95% per market</td></tr>
              <tr><td>Rev-share</td><td>High, flat (~15%)</td><td>Lower + volume-tiered</td></tr>
              <tr><td>Retention</td><td>Basic</td><td>Social layer (leaderboard, feed, profiles)</td></tr>
              <tr><td>Branding</td><td>Provider-branded</td><td>White-label / “powered by operator”</td></tr>
              <tr><td>Fairness</td><td>Provably fair</td><td>Provably fair + certified-RNG roadmap</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ECONOMICS */}
      <section>
        <div className="wrap">
          <h2>A better revenue model</h2>
          <p className="sub">
            We don’t just split the pie more cheaply — the social layer grows it.
            Illustrative figures (validated per market):
          </p>
          <div className="econ">
            <div className="stat"><div className="v">+€3.4k</div><div className="l">extra kept by the operator / mo, per 1,000 active players, vs a 15% deal</div></div>
            <div className="stat"><div className="v">97/96/95%</div><div className="l">configurable RTP — tune the house edge to your market</div></div>
            <div className="stat"><div className="v">14→7%</div><div className="l">volume-tiered rev-share — better the bigger you get</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="wrap">
          <h2>What’s in the box</h2>
          <div className="grid two">
            <div className="card"><div className="ic">🛡️</div><h3>Provably fair</h3><p>HMAC-SHA256 crash points; any player can verify any round. Independent RNG certification on the roadmap.</p></div>
            <div className="card"><div className="ic">🎯</div><h3>Dual bets + auto-cashout</h3><p>Two simultaneous stakes per round with per-bet auto-cashout — more bets per round.</p></div>
            <div className="card"><div className="ic">🌍</div><h3>True multiplayer</h3><p>Server-authoritative shared rounds: everyone’s in the same live round, with one online count.</p></div>
            <div className="card"><div className="ic">📱</div><h3>Mobile-first PWA</h3><p>Built for the phone, multi-language, multi-currency-ready, add-to-home-screen.</p></div>
            <div className="card"><div className="ic">🎨</div><h3>White-label</h3><p>Skin it as your own brand — own the player relationship.</p></div>
            <div className="card"><div className="ic">📊</div><h3>Engagement tools</h3><p>Leaderboards, activity feed, profiles and chat that lift session length and retention.</p></div>
          </div>
        </div>
      </section>

      {/* TECH / COMPLIANCE */}
      <section>
        <div className="wrap">
          <h2>Built to integrate</h2>
          <p className="sub">Standard, operator-friendly integration — the operator keeps the wallet.</p>
          <div className="grid">
            <div className="card"><div className="ic">🔌</div><h3>Seamless wallet API</h3><p>RGS debits on bet, credits on cashout — the operator/aggregator is the source of truth for balance.</p></div>
            <div className="card"><div className="ic">🧩</div><h3>Aggregator-ready</h3><p>One integration via your aggregator. RTP, limits and max-win configurable per operator/jurisdiction.</p></div>
            <div className="card"><div className="ic">✅</div><h3>Certification roadmap</h3><p>Provably fair today; independent RNG certification (GLI/iTech) and B2B licensing on the roadmap.</p></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="wrap">
          <div className="final">
            <h2>See it live in 30 seconds.</h2>
            <p className="sub">Play the demo on your phone, then let’s talk fit, terms and integration.</p>
            <div className="cta">
              <a className="btn primary" href="/">▶ Play the live demo</a>
              <a className="btn ghost" href={MAIL}>Get in touch</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <img className="logo" src="/liftoffx.png" alt="Liftoff X" />
          <span className="sp" />
          <a href="/">Demo</a>
          <a href={MAIL}>Contact</a>
        </div>
        <p className="disc">
          Liftoff X uses a provably-fair RNG. It is <b>not yet independently certified</b>
          {' '}(e.g. GLI / iTech) and holds <b>no gaming licences</b>; no certification or
          regulatory approval is claimed. For business / B2B enquiries only —
          this site is not an offer of gambling to consumers. © {new Date().getFullYear()} Liftoff X.
        </p>
      </footer>
    </div>
  );
}
