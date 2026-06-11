import type { Metadata } from 'next';
import './operators.css';

export const metadata: Metadata = {
  title: 'LiftOffX — the crash game operators earn more from',
  description:
    'An Aviator-class instant game built for operators that prioritize revenue and retention. Provably fair, mobile-first, true shared-round multiplayer, fully white-label ready.',
};

const MAIL = 'mailto:stefanolijve85@gmail.com?subject=LiftOffX%20—%20operator%20deck%20request';

export default function Operators() {
  return (
    <div className="mkt">
      {/* NAV */}
      <nav>
        <div className="wrap">
          <img className="logo" src="/liftoffx.png" alt="LiftOffX" />
          <span className="sp" />
          <a className="btn ghost hide-sm" href="/">Play demo</a>
          <a className="btn primary" href={MAIL}>Request deck</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap">
          <span className="eyebrow">B2B crash game · operators &amp; aggregators</span>
          <h1>The crash game operators <span className="g">actually earn more from.</span></h1>
          <p className="lead">
            An Aviator-class instant game built for operators that prioritize revenue and
            retention. Provably fair, mobile-first, true shared-round multiplayer, and fully
            deployable under your own brand.
          </p>
          <div className="cta">
            <a className="btn primary" href="/">▶ Play the Live Demo</a>
            <a className="btn ghost" href={MAIL}>Request the Operator Deck</a>
          </div>
          <div className="pills">
            <span className="pill"><b>Provably Fair</b></span>
            <span className="pill"><b>Configurable RTP</b> 97/96/95%</span>
            <span className="pill"><b>Dual Bets</b> + Auto Cash-Out</span>
            <span className="pill"><b>True Multiplayer</b></span>
            <span className="pill"><b>Fully White-Label Ready</b></span>
          </div>
          <div className="shots">
            <img className="shot" src="/preview-3.png" alt="LiftOffX gameplay at €100 stakes" loading="lazy" />
            <img className="shot" src="/preview-1.png" alt="LiftOffX — rocket climbing at 24x with high-roller stakes" loading="lazy" />
            <img className="shot" src="/preview-4.png" alt="LiftOffX — a small-stakes (€20) win" loading="lazy" />
            <img className="shot" src="/preview-2.png" alt="LiftOffX — a big multi-bet win" loading="lazy" />
          </div>
          <p className="shotcap">From €0.10 stakes to high-rollers — the same game scales to every player.</p>
        </div>
      </header>

      {/* BUILT FOR OPERATOR GROWTH */}
      <section>
        <div className="wrap">
          <h2>Built for operator growth.</h2>
          <div className="prose">
            <p className="lead2">Launch under your own brand in days.</p>
            <p>
              LiftOffX delivers an Aviator-class crash experience designed to maximize operator
              performance through stronger monetization, higher retention potential, and complete
              flexibility.
            </p>
            <p>
              Whether you integrate through an aggregator or directly, LiftOffX adapts to your
              commercial strategy — not the other way around.
            </p>
          </div>
        </div>
      </section>

      {/* WHITE-LABEL */}
      <section className="tint">
        <div className="wrap">
          <h2>Fully white-label ready.</h2>
          <p className="subh">Your logo. Your colors. Your player experience.</p>
          <div className="prose">
            <p>
              Deploy LiftOffX entirely under your own brand while maintaining full ownership of the
              customer relationship. No visible third-party branding is required.
            </p>
            <p>Designed for operators who want complete control without sacrificing speed to market.</p>
          </div>
        </div>
      </section>

      {/* MORE MARGIN. BETTER RETENTION. */}
      <section>
        <div className="wrap">
          <h2>More margin. Better retention.</h2>
          <div className="prose">
            <p>
              Configurable RTP options allow operators to align the game with their commercial
              objectives.
            </p>
            <p>
              At the same time, real-time multiplayer dynamics, instant gameplay loops, dual betting,
              and auto cash-out features encourage repeat engagement and longer player sessions.
            </p>
            <p>
              The result is an experience built to support both player enjoyment and operator
              profitability.
            </p>
          </div>
        </div>
      </section>

      {/* SEAMLESS DISTRIBUTION */}
      <section className="tint">
        <div className="wrap">
          <h2>Seamless aggregator distribution.</h2>
          <div className="prose">
            <p>
              Built to integrate efficiently through leading aggregators and direct operator
              partnerships.
            </p>
            <p>Reduce technical overhead, simplify onboarding, and accelerate go-live timelines.</p>
            <p>Launch faster and scale across multiple markets with minimal friction.</p>
          </div>
        </div>
      </section>

      {/* WHY OPERATORS CHOOSE */}
      <section>
        <div className="wrap">
          <h2>Why operators choose LiftOffX.</h2>
          <div className="bullets">
            <div className="bul"><span className="ck">✓</span><span>Proven crash game mechanics players already understand.</span></div>
            <div className="bul"><span className="ck">✓</span><span>True shared-round multiplayer that creates social engagement.</span></div>
            <div className="bul"><span className="ck">✓</span><span>Configurable RTP to support different commercial models.</span></div>
            <div className="bul"><span className="ck">✓</span><span>Fully white-label deployment under your own brand.</span></div>
            <div className="bul"><span className="ck">✓</span><span>Fast integration through aggregators or direct partnerships.</span></div>
            <div className="bul"><span className="ck">✓</span><span>Mobile-first experience optimized for today’s player behavior.</span></div>
            <div className="bul"><span className="ck">✓</span><span>Built to increase retention and repeat play.</span></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="wrap">
          <div className="final">
            <h2>Ready to launch?</h2>
            <p className="sub">
              See the live demo or request the operator deck to explore integration options,
              commercial models, and white-label opportunities.
            </p>
            <div className="cta">
              <a className="btn primary" href="/">▶ Play Live Demo</a>
              <a className="btn ghost" href={MAIL}>Request Operator Deck</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <img className="logo" src="/liftoffx.png" alt="LiftOffX" />
          <span className="sp" />
          <a href="/">Demo</a>
          <a href={MAIL}>Contact</a>
        </div>
        <p className="fnote">
          Powered by LiftOffX technology. Trusted by operators seeking scalable growth, flexible
          deployment, and stronger commercial performance.
        </p>
        <p className="disc">
          LiftOffX uses a provably-fair RNG. It is <b>not yet independently certified</b>
          {' '}(e.g. GLI / iTech) and holds <b>no gaming licences</b>; no certification or regulatory
          approval is claimed. For business / B2B enquiries only — this site is not an offer of
          gambling to consumers. © {new Date().getFullYear()} LiftOffX.
        </p>
      </footer>
    </div>
  );
}
