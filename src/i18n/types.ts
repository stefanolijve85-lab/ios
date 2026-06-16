import type { ThemeCopy } from '@/themes/types';

// One game's localized strings for a given language. Everything is optional and
// merged over the theme's English base, so a translation can fill in as little
// or as much as it wants — missing keys fall back to English automatically.
//
// voiceCrash / voiceWin point at language-specific voice clips (music + SFX are
// universal and never translated). Leave them out to reuse the English voices.
export interface ThemeLocale {
  copy?: Partial<ThemeCopy>;
  voiceCrash?: string[];
  voiceWin?: string[];
}
