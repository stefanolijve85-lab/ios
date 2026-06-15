import type { CSSProperties } from 'react';
import { CATALOG, PUBLISHER } from '@/brand';
import { getTheme } from '@/themes';

// OliveX hub — the umbrella page listing every game. Each card opens that title
// via ?theme=<key> (works on the shared deploy; on its own domain the hostname
// already selects it). Reachable at /games.
export const metadata = {
  title: `${PUBLISHER} — Provably fair crash games`,
  description: `Play the ${PUBLISHER} crash games. Provably fair, 97% RTP.`,
};

export default function GamesHub() {
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
              href={g.url ?? `/?theme=${g.key}`}
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
