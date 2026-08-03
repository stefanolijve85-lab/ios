// ---------------------------------------------------------------------------
// Theme Engine for the slot. A theme is PURE PRESENTATION — colours, symbol
// art definitions, background layers and copy. It never touches math, RTP or
// fairness (those are server-side and identical for every skin), so a new theme
// (Egypt, Samurai, Steampunk…) is added as one config object with no code
// change. The active theme is resolved by key.
// ---------------------------------------------------------------------------

import type { SymbolId } from './config';

export type SymbolKind = 'royal' | 'premium' | 'feature';

// How one symbol is drawn when no image asset is present (the shipped default).
export interface SymbolSkin {
  label: string; // text shown for royals (A/K/Q/J) or badge for features
  kind: SymbolKind;
  hue: number; // base neon hue (0-360)
  icon?: string; // emoji/glyph layered on premium & feature tiles
  accent?: string; // optional secondary colour
}

export interface BackgroundLayer {
  // A parallax layer: a CSS background (gradient/radial) + a depth factor.
  css: string;
  depth: number; // 0 = static far, 1 = moves with foreground
  blur?: number;
}

export interface SlotTheme {
  key: string;
  name: string;
  tagline: string;
  publisher: string;
  meta: { title: string; description: string };
  colors: {
    bgTop: string;
    bgBottom: string;
    neon: string; // primary neon (frame / spin button)
    neon2: string; // secondary neon (accents)
    gold: string; // win / jackpot gold
    panel: string; // glass panel base
    panelBorder: string;
    text: string;
    textDim: string;
  };
  jackpotColors: Record<string, { from: string; to: string; glow: string }>;
  background: BackgroundLayer[];
  symbols: Record<SymbolId, SymbolSkin>;
  // Optional image art for HUD chrome (relative to /themes/<key>/). When a file
  // is present the component uses it; otherwise it falls back to styled markup,
  // so a skin without art still renders perfectly.
  ui?: {
    jackpotBadges?: Partial<Record<string, string>>;
    spinButton?: string;
  };
  copy: {
    spin: string;
    turbo: string;
    auto: string;
    buyFeature: string;
    freeSpins: string;
    win: string;
    bigWin: string;
    megaWin: string;
    ultraWin: string;
    featureIntro: string; // Quantum Portal splash
    featureName: string;
  };
}

export const quantumspin: SlotTheme = {
  key: 'quantumspin',
  name: 'QUANTUM SPIN',
  tagline: 'Bend the reels. Break the vault.',
  publisher: 'XIT Games',
  meta: {
    title: 'QUANTUM SPIN — Next-gen cyberpunk slot',
    description:
      'A premium, provably-fair cyberpunk video slot. Quantum Reactor tumbles, a Quantum Portal free-spins feature and a four-tier progressive jackpot.',
  },
  colors: {
    bgTop: '#1a0b3a',
    bgBottom: '#050418',
    neon: '#22d3ee', // cyan
    neon2: '#a855f7', // violet
    gold: '#ffc93c',
    panel: 'rgba(16, 14, 48, 0.62)',
    panelBorder: 'rgba(129, 140, 248, 0.35)',
    text: '#f0f4ff',
    textDim: '#9aa7d8',
  },
  jackpotColors: {
    GRAND: { from: '#ffd54a', to: '#ff8a1e', glow: 'rgba(255,180,40,0.65)' },
    MAJOR: { from: '#38e8ff', to: '#1f8bff', glow: 'rgba(40,190,255,0.6)' },
    MINOR: { from: '#ff7ae0', to: '#a340ff', glow: 'rgba(220,90,230,0.6)' },
    MINI: { from: '#8dff6a', to: '#22c55e', glow: 'rgba(120,240,90,0.55)' },
  },
  background: [
    { css: 'radial-gradient(120% 90% at 50% -10%, #3a1b7a 0%, #1a0b3a 45%, #050418 100%)', depth: 0 },
    { css: 'radial-gradient(60% 40% at 50% 22%, rgba(168,85,247,0.55), transparent 70%)', depth: 0.15, blur: 30 },
    { css: 'radial-gradient(40% 30% at 78% 30%, rgba(34,211,238,0.35), transparent 70%)', depth: 0.25, blur: 20 },
  ],
  symbols: {
    WILD: { label: 'WILD', kind: 'feature', hue: 45, icon: '✦', accent: '#ffc93c' },
    SCATTER: { label: 'PORTAL', kind: 'feature', hue: 190, icon: '🌀', accent: '#22d3ee' },
    HERO_F: { label: '', kind: 'premium', hue: 320, icon: '👩‍🚀', accent: '#ff5ec4' },
    HERO_M: { label: '', kind: 'premium', hue: 210, icon: '🧑‍🚀', accent: '#4aa3ff' },
    GEM: { label: '', kind: 'premium', hue: 275, icon: '💎', accent: '#b06bff' },
    PLANET: { label: '', kind: 'premium', hue: 265, icon: '🪐', accent: '#9b6bff' },
    ORB_B: { label: '', kind: 'premium', hue: 200, icon: '🔵', accent: '#3fd8ff' },
    ORB_O: { label: '', kind: 'premium', hue: 30, icon: '🟠', accent: '#ffab3d' },
    A: { label: 'A', kind: 'royal', hue: 275, accent: '#c07bff' },
    K: { label: 'K', kind: 'royal', hue: 5, accent: '#ff6b5e' },
    Q: { label: 'Q', kind: 'royal', hue: 200, accent: '#43c6ff' },
    J: { label: 'J', kind: 'royal', hue: 140, accent: '#5ef08a' },
  },
  copy: {
    spin: 'SPIN',
    turbo: 'TURBO',
    auto: 'AUTO',
    buyFeature: 'BUY FEATURE',
    freeSpins: 'FREE SPINS',
    win: 'WIN',
    bigWin: 'BIG WIN',
    megaWin: 'MEGA WIN',
    ultraWin: 'ULTRA WIN',
    featureIntro: 'QUANTUM PORTAL OPEN',
    featureName: 'QUANTUM PORTAL',
  },
  ui: {
    jackpotBadges: {
      GRAND: 'ui/jp-grand.webp',
      MAJOR: 'ui/jp-major.webp',
      MINOR: 'ui/jp-minor.webp',
      MINI: 'ui/jp-mini.webp',
    },
    spinButton: 'ui/spin.webp',
  },
};

// A second ready-made skin proves the engine is theme-agnostic (used by the
// admin/theme switcher). Same math, totally different look.
export const neonsamurai: SlotTheme = {
  ...quantumspin,
  key: 'neonsamurai',
  name: 'NEON SAMURAI',
  tagline: 'Draw your blade. Split the jackpot.',
  meta: {
    title: 'NEON SAMURAI — cyber-feudal slot',
    description: 'A neon cyber-feudal reskin of the Quantum engine. Same provably-fair math, new world.',
  },
  colors: {
    ...quantumspin.colors,
    bgTop: '#2a0812',
    bgBottom: '#0a0206',
    neon: '#ff3b6b',
    neon2: '#ffb020',
    gold: '#ffd66b',
  },
  background: [
    { css: 'radial-gradient(120% 90% at 50% -10%, #6a0f2a 0%, #2a0812 45%, #0a0206 100%)', depth: 0 },
    { css: 'radial-gradient(60% 40% at 50% 22%, rgba(255,59,107,0.5), transparent 70%)', depth: 0.15, blur: 30 },
    { css: 'radial-gradient(40% 30% at 25% 32%, rgba(255,176,32,0.3), transparent 70%)', depth: 0.25, blur: 20 },
  ],
  copy: { ...quantumspin.copy, featureName: 'BLADE STORM', featureIntro: 'BLADE STORM UNLEASHED' },
  ui: undefined, // no bespoke art yet → falls back to styled badges/spin button
};

export const SLOT_THEMES: Record<string, SlotTheme> = {
  quantumspin,
  neonsamurai,
};

export const DEFAULT_SLOT_THEME = 'quantumspin';

export function getSlotTheme(key?: string | null): SlotTheme {
  return SLOT_THEMES[key ?? ''] ?? SLOT_THEMES[DEFAULT_SLOT_THEME];
}
