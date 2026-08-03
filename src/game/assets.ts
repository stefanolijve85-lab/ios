// ---------------------------------------------------------------------------
// AssetManager — resolves a symbol id (or any named art asset) to a real URL,
// trying modern formats first and gracefully degrading. The team ships PNG/SVG/
// WEBP/AVIF later; until then every symbol renders as a crafted neon glyph
// (see SymbolTile), so the game is fully playable with zero art on disk.
//
// Drop `public/themes/<theme>/symbols/HERO_F.webp` (etc.) and it is picked up
// automatically — no code change. Resolution is cached; a probe that 404s is
// remembered so we never re-request a missing file.
// ---------------------------------------------------------------------------

const FORMATS = ['avif', 'webp', 'png', 'svg'] as const;

type ProbeState = 'unknown' | 'present' | 'absent';

class AssetManager {
  private base = '';
  private cache = new Map<string, string>(); // key → resolved url ('' = none)
  private probes = new Map<string, ProbeState>();

  configure(themeKey: string) {
    this.base = `/themes/${themeKey}`;
  }

  // Best-guess URL for a symbol without a network probe — used for eager <img>
  // that falls back to a glyph via onError. Returns the webp candidate.
  symbolUrl(id: string): string {
    return `${this.base}/symbols/${id}.webp`;
  }

  // Candidate list (most-preferred first) for a symbol, for <picture> sources.
  symbolCandidates(id: string): { url: string; type: string }[] {
    return FORMATS.map((f) => ({ url: `${this.base}/symbols/${id}.${f}`, type: mime(f) }));
  }

  // Probe whether an asset exists (HEAD). Result is cached. Used to decide
  // between real art and the generated glyph before first paint where needed.
  async has(path: string): Promise<boolean> {
    const state = this.probes.get(path);
    if (state === 'present') return true;
    if (state === 'absent') return false;
    try {
      const res = await fetch(path, { method: 'HEAD', cache: 'force-cache' });
      const ok = res.ok;
      this.probes.set(path, ok ? 'present' : 'absent');
      return ok;
    } catch {
      this.probes.set(path, 'absent');
      return false;
    }
  }

  async resolveSymbol(id: string): Promise<string> {
    const cached = this.cache.get(id);
    if (cached !== undefined) return cached;
    for (const f of FORMATS) {
      const url = `${this.base}/symbols/${id}.${f}`;
      // eslint-disable-next-line no-await-in-loop
      if (await this.has(url)) {
        this.cache.set(id, url);
        return url;
      }
    }
    this.cache.set(id, '');
    return '';
  }

  asset(name: string): string {
    return `${this.base}/${name}`;
  }
}

function mime(f: string): string {
  switch (f) {
    case 'avif': return 'image/avif';
    case 'webp': return 'image/webp';
    case 'png': return 'image/png';
    case 'svg': return 'image/svg+xml';
    default: return 'image/*';
  }
}

export const assets = new AssetManager();
export type { AssetManager };
