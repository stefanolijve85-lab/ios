import type { Theme } from './types';
import { bankheistx } from './bankheistx/theme';
import { liftoffx } from './liftoffx/theme';
import { trainridex } from './trainridex/theme';
import { deepdivex } from './deepdivex/theme';

export type { Theme } from './types';

export const THEMES: Record<string, Theme> = {
  bankheistx,
  liftoffx,
  trainridex,
  deepdivex,
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

// Resolve a theme key from a URL path (e.g. "/liftoffx" → "liftoffx"). Works on
// the server and the client, so the right theme can paint on the very first
// render (no flash of the default theme). Path-based routing is how
// xitgames.com/<game> works.
export function themeKeyForPath(pathname?: string | null): string {
  const seg = (pathname ?? '').split('/').filter(Boolean)[0];
  if (seg && THEMES[seg]) return seg;
  return DEFAULT_THEME_KEY;
}

// Client-side resolver: ?theme= override → first path segment (/bankheistx) →
// NEXT_PUBLIC_THEME → hostname. Path segment is how xitgames.com/<game> works.
export function resolveClientThemeKey(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_KEY;
  const q = new URLSearchParams(window.location.search).get('theme');
  if (q && THEMES[q]) return q;
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  if (seg && THEMES[seg]) return seg;
  if (process.env.NEXT_PUBLIC_THEME && THEMES[process.env.NEXT_PUBLIC_THEME]) {
    return process.env.NEXT_PUBLIC_THEME;
  }
  return themeKeyForHost(window.location.hostname);
}
