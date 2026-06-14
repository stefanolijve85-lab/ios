import type { Theme } from './types';
import { bankheistx } from './bankheistx/theme';
import { liftoffx } from './liftoffx/theme';

export type { Theme } from './types';

export const THEMES: Record<string, Theme> = {
  bankheistx,
  liftoffx,
};

export const DEFAULT_THEME_KEY = 'bankheistx';

// Map a hostname to a theme key. Each game has its own domain; everything else
// (localhost, render preview, the apex) falls back to the default.
//   bankheistx.com → bankheistx
//   liftoffx.com   → liftoffx
export function themeKeyForHost(host?: string | null): string {
  const h = (host ?? '').toLowerCase();
  for (const key of Object.keys(THEMES)) {
    // match "<key>.com", "www.<key>.com", "<key>.onrender.com", etc.
    if (h.includes(key)) return key;
  }
  return DEFAULT_THEME_KEY;
}

export function getTheme(key?: string | null): Theme {
  return THEMES[key ?? ''] ?? THEMES[DEFAULT_THEME_KEY];
}

// Client-side resolver: ?theme= override → NEXT_PUBLIC_THEME → hostname.
export function resolveClientThemeKey(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_KEY;
  const q = new URLSearchParams(window.location.search).get('theme');
  if (q && THEMES[q]) return q;
  if (process.env.NEXT_PUBLIC_THEME && THEMES[process.env.NEXT_PUBLIC_THEME]) {
    return process.env.NEXT_PUBLIC_THEME;
  }
  return themeKeyForHost(window.location.hostname);
}
