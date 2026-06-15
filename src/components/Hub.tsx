import type { CSSProperties } from 'react';
import { CATALOG, PUBLISHER } from '@/brand';
import { getTheme } from '@/themes';

// XIT Games hub — the umbrella page listing every title. Each card opens that
// game by path (/bankheistx), or jumps to an external URL for games that are
// deployed separately (LIFTOFF X → liftoffx.com).
export default function Hub() {
  return (
    <main className="hub">
      <div className="hub-head">
        <div className="hub-brand">{PUBLISHER}</div>
        <div className="hub-sub">PROVABLY FAIR CRASH GAMES · 97% RTP</div>
      </div>

      <div className="hub-grid">
        {CATALOG.map((g) => {
          const t = getTheme(g.key);
          return (
            <a
              key={g.key}
              className={`hub-card${g.live ? '' : ' soon'}`}
              href={g.url ?? `/${g.key}`}
              style={{ ['--accent' as keyof CSSProperties]: t.colors.greenHi } as CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="hub-logo" src={t.assets.logo} alt={g.name} />
              <div className="hub-tag">{g.tagline}</div>
              {!g.live && <div className="hub-badge">ART COMING SOON</div>}
              <div className="hub-play">PLAY →</div>
            </a>
          );
        })}
      </div>

      <div className="hub-foot">An {PUBLISHER} network</div>
    </main>
  );
}
