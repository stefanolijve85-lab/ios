import type { Metadata } from 'next';
import Link from 'next/link';
import './lobby.css';
import { CATALOG, PUBLISHER } from '@/brand';

// Home lobby. QUANTUM SPIN is the flagship and opens with one tap; the crash
// titles are listed below. The crash-games hub still lives at /games.
export const metadata: Metadata = {
  title: 'QUANTUM SPIN — play the next-gen cyberpunk slot',
  description:
    'Play QUANTUM SPIN, a premium provably-fair cyberpunk video slot, plus the XIT Games crash titles.',
};

// deterministic particle field (no hydration mismatch, no client JS)
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const s = ((i * 2654435761) % 1000) / 1000;
  const s2 = ((i * 40503) % 1000) / 1000;
  const color = i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#a855f7' : '#ffc93c';
  return {
    left: `${Math.round(s * 100)}%`,
    size: 2 + Math.round(s2 * 4),
    dur: `${9 + Math.round(s * 12)}s`,
    delay: `${-Math.round(s2 * 12)}s`,
    color,
  };
});

export default function HomeLobby() {
  const crash = CATALOG; // bankheistx, liftoffx, trainridex

  return (
    <div className="lb">
      <div className="lb-bg" aria-hidden>
        <div className="lb-glow-a" />
        <div className="lb-glow-b" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="lb-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.dur,
              animationDelay: p.delay,
              background: p.color,
              boxShadow: `0 0 8px ${p.color}`,
            }}
          />
        ))}
      </div>

      <div className="lb-wrap">
        <div className="lb-brand">
          <span className="dot" /> {PUBLISHER.toUpperCase()}
        </div>

        {/* flagship */}
        <section className="lb-hero">
          <div className="lb-hero-syms" aria-hidden>
            <img src="/themes/quantumspin/symbols/HERO_F.webp" alt="" />
            <img src="/themes/quantumspin/symbols/WILD.webp" alt="" />
          </div>
          <div className="lb-hero-badge">NEW · FLAGSHIP SLOT</div>
          <h1>QUANTUM<br />SPIN</h1>
          <p>Bend the reels. Break the vault. Quantum Reactor tumbles, a Portal free-spins feature and a four-tier progressive jackpot.</p>

          <div className="lb-cta">
            <Link className="lb-btn" href="/quantum">▶ PLAY NOW</Link>
            <Link className="lb-btn ghost" href="/quantum/verify">Verify fairness</Link>
          </div>

          <div className="lb-tags">
            <span className="lb-tag">Provably fair</span>
            <span className="lb-tag">96% RTP</span>
            <span className="lb-tag">25 lines</span>
            <span className="lb-tag">Max 12,000×</span>
            <span className="lb-tag">Mobile-first</span>
          </div>
        </section>

        {/* other titles */}
        <div className="lb-section-title">MORE GAMES</div>
        <div className="lb-grid">
          <Link className="lb-card big" href="/games">
            <div>
              <h3>All crash games</h3>
              <p>BANKHEIST X · TRAINRIDE X · LIFTOFF X — provably-fair crash titles</p>
            </div>
            <span className="go">Open →</span>
          </Link>

          {crash.map((g) => (
            <Link
              key={g.key}
              className="lb-card"
              href={g.url ?? `/${g.key}`}
              target={g.url ? '_blank' : undefined}
            >
              {g.live && <span className="lb-live">● LIVE</span>}
              <h3>{g.name}</h3>
              <p>{g.tagline}</p>
              <div className="meta">
                <span className="chip">{g.volatility}</span>
                <span className="chip">Max {g.maxX}×</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="lb-foot">
          An {PUBLISHER} project · <Link href="/games">games</Link> · <Link href="/quantum/verify">fairness</Link>
        </div>
      </div>
    </div>
  );
}
