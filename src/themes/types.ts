// A "theme" is the *presentation* skin for one Olive Games crash title.
// It contains ONLY art, copy, colour and audio — never any game logic, math
// or fairness. Those live in the shared engine and are identical for every
// game (one transparent RTP, one provably-fair RNG). A theme can therefore
// never change the odds.

export interface ThemeColors {
  green: string;        // primary gradient middle
  greenHi: string;      // primary CTA / selected / text
  greenLime: string;    // highlight
  greenGlow: string;    // glow
  greenDeep: string;    // dark gradient bottom
  greenMuted: string;   // labels / secondary
  // RGB triplets (e.g. "47,208,230") driving the themeable accent in globals.css
  accentRgb: string;    // bright neon accent (glows/borders/marker/chips)
  btnTopRgb: string;    // CTA button gradient top (dark)
  btnBotRgb: string;    // CTA button gradient bottom (darker)
  ambientRgb: string;   // the game's signature tone (wait box, spinner, ambient)
}

export interface ThemeAssets {
  logo: string;
  landing: string;
  sceneIdle: string;    // the "vault" / idle scene while betting + running
  sceneLose: string;    // the crash / robbery scene
  sceneWin: string;     // the secure / caught scene
  icons: {
    home: string;
    history: string;
    vault: string;
    leaderboard: string;
    chat: string;
  };
}

export interface ThemeAudio {
  motifLow: string;
  motifHigh: string;
  stash: string;
  crash: string;
  lobby: string;
  tick: string;
  voiceCrash: string[]; // random "loss" lines
  voiceWin: string[];   // random "win" lines
}

export interface ThemeCopy {
  // cash-out action
  cashOut: string;        // BANKHEIST: "SECURE"
  cashOutSub: string;     // "LOCK YOUR WINNINGS"
  securedVerb: string;    // past tense for the activity feed: "secured"
  bagSecured: (amount: string) => string; // "BAG SECURED €X"
  // result scene labels
  crashedTile: string;    // "TOO LATE — STOLEN"
  currentAmount: string;  // "CURRENT AMOUNT"
  wouldBeWorth: string;   // "WOULD BE WORTH"
  countdownLabel: string; // "VAULT CLOSES IN"
  // flash banners
  winFlash: string;       // "YOU GOT OUT!"
  loseFlash: string;      // "THEY GOT AWAY!"
  landingAlt: string;
}

// Optional per-theme UI variants (bigger than a skin, opt-in per game).
export interface ThemeUI {
  // Reframe the multiplier ladder + a live readout as a DEPTH meter (DEEP DIVE).
  depthMeter?: boolean;
  metersPerX?: number; // depth(m) = round((multiplier - 1) * metersPerX)
  // Ambient particle motion over the scene; intensity rises with the multiplier.
  motion?: { kind: 'bubbles' | 'embers' | 'steam' | 'speed'; color: string };
  // Loot that piles up as the multiplier climbs (sprite stacks revealed one by one).
  growth?: { sprites: string[] };
}

export interface Theme {
  key: string;            // "bankheistx"
  name: string;           // "BANKHEIST X"
  publisher: string;      // "Olive Games"
  meta: { title: string; description: string };
  colors: ThemeColors;
  assets: ThemeAssets;
  audio: ThemeAudio;
  copy: ThemeCopy;
  ui?: ThemeUI;
}
