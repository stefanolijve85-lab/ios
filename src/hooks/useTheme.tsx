'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getTheme, resolveClientThemeKey, themeKeyForPath, DEFAULT_THEME_KEY } from '@/themes';
import type { Theme } from '@/themes';
import { getAudio } from '@/lib/audio';

const ThemeContext = createContext<Theme>(getTheme(DEFAULT_THEME_KEY));

// The CSS custom properties globals.css reads for the palette/accent. Setting
// these inline (on a display:contents wrapper) means the right colours paint on
// the first render too — not just after the effect runs.
function paletteVars(t: Theme): React.CSSProperties {
  const c = t.colors;
  return {
    display: 'contents',
    '--green': c.green,
    '--green-hi': c.greenHi,
    '--green-lime': c.greenLime,
    '--green-glow': c.greenGlow,
    '--green-deep': c.greenDeep,
    '--green-muted': c.greenMuted,
    '--accent-rgb': c.accentRgb,
    '--btn-top': c.btnTopRgb,
    '--btn-bot': c.btnBotRgb,
    '--ambient-rgb': c.ambientRgb,
  } as React.CSSProperties;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Resolve from the path on the very first render (server + client agree) so
  // the correct game theme paints immediately — no flash of the default
  // (vault) button / logo / palette before an effect swaps it in.
  const [theme, setTheme] = useState<Theme>(() => getTheme(themeKeyForPath(pathname)));

  useEffect(() => {
    // client-only refinement: ?theme= override or a bare game domain (hostname),
    // neither of which is visible during SSR. Path-based routing already
    // resolved above, so for /<game> this is a no-op.
    const active = getTheme(resolveClientThemeKey());
    setTheme(active);

    // also paint the palette tokens on :root so the body/global chrome matches
    const root = document.documentElement;
    const c = active.colors;
    root.style.setProperty('--green', c.green);
    root.style.setProperty('--green-hi', c.greenHi);
    root.style.setProperty('--green-lime', c.greenLime);
    root.style.setProperty('--green-glow', c.greenGlow);
    root.style.setProperty('--green-deep', c.greenDeep);
    root.style.setProperty('--green-muted', c.greenMuted);
    root.style.setProperty('--accent-rgb', c.accentRgb);
    root.style.setProperty('--btn-top', c.btnTopRgb);
    root.style.setProperty('--btn-bot', c.btnBotRgb);
    root.style.setProperty('--ambient-rgb', c.ambientRgb);

    // hand the audio engine this game's clip paths (used on first unlock)
    getAudio().configure(active.audio);
  }, [pathname]); // re-resolve when navigating between games (no stale effects)

  return (
    <ThemeContext.Provider value={theme}>
      <div style={paletteVars(theme)}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
