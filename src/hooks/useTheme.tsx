'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTheme, resolveClientThemeKey, DEFAULT_THEME_KEY } from '@/themes';
import type { Theme } from '@/themes';
import { getAudio } from '@/lib/audio';

const ThemeContext = createContext<Theme>(getTheme(DEFAULT_THEME_KEY));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from the default so SSR markup matches the first client paint
  // (the default theme's palette is baked into globals.css :root).
  const [theme, setTheme] = useState<Theme>(getTheme(DEFAULT_THEME_KEY));

  useEffect(() => {
    const active = getTheme(resolveClientThemeKey());
    setTheme(active);

    // paint the palette tokens (globals.css reads these custom properties)
    const root = document.documentElement;
    const c = active.colors;
    root.style.setProperty('--green', c.green);
    root.style.setProperty('--green-hi', c.greenHi);
    root.style.setProperty('--green-lime', c.greenLime);
    root.style.setProperty('--green-glow', c.greenGlow);
    root.style.setProperty('--green-deep', c.greenDeep);
    root.style.setProperty('--green-muted', c.greenMuted);

    // hand the audio engine this game's clip paths (used on first unlock)
    getAudio().configure(active.audio);
  }, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
