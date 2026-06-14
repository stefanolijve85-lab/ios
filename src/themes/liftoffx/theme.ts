import type { Theme } from '../types';

const A = '/themes/liftoffx';

// LIFTOFF X — rocket / space crash game (STUB).
// Drop the artwork + audio into public/themes/liftoffx/ using the filenames
// below, then this game is live on liftoffx.com. Game math + fairness are
// inherited unchanged from the shared engine; only the "feel" (volatility /
// pacing) will be tuned later via a per-game gameConfig.
export const liftoffx: Theme = {
  key: 'liftoffx',
  name: 'LIFTOFF X',
  publisher: 'Olive Games',
  meta: {
    title: 'LIFTOFF X — Eject before she blows',
    description:
      'LIFTOFF X: a mobile-first multiplayer crash game. Ride the rocket, cash out before it burns up.',
  },
  colors: {
    // placeholder space palette (blue/cyan) — replace when art lands
    green: '#1E73C8',
    greenHi: '#3AA0F0',
    greenLime: '#5FC8FF',
    greenGlow: '#2E9CE6',
    greenDeep: '#0A2E58',
    greenMuted: '#5A8FBE',
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    sceneIdle: `${A}/launchpad.webp`,
    sceneLose: `${A}/explosion.webp`,
    sceneWin: `${A}/eject.webp`,
    icons: {
      home: `${A}/icons/home.webp`,
      history: `${A}/icons/history.webp`,
      vault: `${A}/icons/rocket.webp`,
      leaderboard: `${A}/icons/leaderboard.webp`,
      chat: `${A}/icons/chat.webp`,
    },
  },
  audio: {
    motifLow: `${A}/audio/motif-low.mp3`,
    motifHigh: `${A}/audio/motif-high.mp3`,
    stash: `${A}/audio/eject.mp3`,
    crash: `${A}/audio/explosion.mp3`,
    lobby: `${A}/audio/lobby.mp3`,
    tick: `${A}/audio/countdown.mp3`,
    voiceCrash: [1, 2, 3, 4, 5].map((n) => `${A}/audio/voice-crash-${n}.mp3`),
    voiceWin: [1, 2, 3, 4, 5].map((n) => `${A}/audio/voice-win-${n}.mp3`),
  },
  copy: {
    cashOut: 'EJECT',
    cashOutSub: 'BANK YOUR ALTITUDE',
    securedVerb: 'ejected',
    bagSecured: (amount) => `EJECTED ${amount}`,
    crashedTile: 'BURNED UP — GONE',
    currentAmount: 'CURRENT PAYOUT',
    wouldBeWorth: 'WOULD BE WORTH',
    countdownLabel: 'LIFTOFF IN',
    winFlash: 'CLEAN EJECT!',
    loseFlash: 'SHE BLEW UP!',
    landingAlt: 'LIFTOFF X — Ride it. Eject big.',
  },
};
