'use client';
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { getTheme, resolveClientThemeKey, themeKeyForPath, DEFAULT_THEME_KEY } from '@/themes';
import type { Theme } from '@/themes';
import { getAudio } from '@/lib/audio';
import {
  DEFAULT_LOCALE, LOCALES, localeFor, persistLocale, resolveClientLocale,
} from '@/i18n';
import type { Locale } from '@/i18n';

const ThemeContext = createContext<Theme>(getTheme(DEFAULT_THEME_KEY));

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  locales: readonly Locale[];
}
const LocaleContext = createContext<LocaleCtx>({
  locale: DEFAULT_LOCALE, setLocale: () => {}, locales: LOCALES,
});

// Merge a language's overrides over the theme's English base. Copy keys missing
// from the translation fall back to English; voice clips fall back too. Music +
// SFX are universal and never touched.
function localize(theme: Theme, locale: Locale): Theme {
  const tr = localeFor(theme.key, locale);
  if (!tr) return theme;
  const copy = tr.copy ? { ...theme.copy, ...tr.copy } : theme.copy;
  const audio =
    tr.voiceCrash || tr.voiceWin
      ? {
          ...theme.audio,
          voiceCrash: tr.voiceCrash ?? theme.audio.voiceCrash,
          voiceWin: tr.voiceWin ?? theme.audio.voiceWin,
        }
      : theme.audio;
  return { ...theme, copy, audio };
}

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
  // the correct game theme paints immediately — no flash of the default theme.
  const [themeKey, setThemeKey] = useState<string>(() => themeKeyForPath(pathname));
  // Locale starts at the default (English) so SSR + first client paint match;
  // an effect swaps in the user's language right after mount.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // refine the theme key on navigation (covers ?theme= / bare game domains)
  useEffect(() => { setThemeKey(resolveClientThemeKey()); }, [pathname]);
  // resolve the language once (client-only signals: ?lang= / saved / browser)
  useEffect(() => { setLocaleState(resolveClientLocale()); }, []);

  const setLocale = useCallback((l: Locale) => {
    persistLocale(l);
    setLocaleState(l);
  }, []);

  const theme = useMemo(() => localize(getTheme(themeKey), locale), [themeKey, locale]);

  // paint the palette tokens on :root and hand the audio engine this game's
  // (localized) clip paths whenever the active theme/language changes
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
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
    getAudio().configure(theme.audio);
  }, [theme]);

  const localeCtx = useMemo<LocaleCtx>(
    () => ({ locale, setLocale, locales: LOCALES }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={localeCtx}>
      <ThemeContext.Provider value={theme}>
        <div style={paletteVars(theme)}>{children}</div>
      </ThemeContext.Provider>
    </LocaleContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useLocale(): LocaleCtx {
  return useContext(LocaleContext);
}
