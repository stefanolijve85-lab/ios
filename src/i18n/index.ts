import type { ThemeLocale } from './types';
import { nl } from './translations/nl';

export type { ThemeLocale } from './types';

// Supported languages. English is the built-in base (every theme ships English
// copy + voice); add a locale here and a translations file to offer it.
export const LOCALES = ['en', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
};

// translations[locale][themeKey] — English has no entry (it's the base in each
// theme); other locales override per key and fall back to English for the rest.
const TRANSLATIONS: Partial<Record<Locale, Record<string, ThemeLocale>>> = {
  nl,
};

export function isLocale(x?: string | null): x is Locale {
  return !!x && (LOCALES as readonly string[]).includes(x);
}

const STORAGE_KEY = 'xit_lang';

// Client-side resolver: an explicit `?lang=` override → a previously chosen
// language (localStorage) → default (English). The browser's language is NOT
// auto-applied — English is the product default everywhere, and a translation
// only shows when explicitly selected.
export function resolveClientLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(q)) { localStorage.setItem(STORAGE_KEY, q); return q; }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage blocked — fall through */
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
}

// The localized overrides for one game in one language (undefined → English).
export function localeFor(themeKey: string, locale: Locale): ThemeLocale | undefined {
  if (locale === DEFAULT_LOCALE) return undefined;
  return TRANSLATIONS[locale]?.[themeKey];
}
