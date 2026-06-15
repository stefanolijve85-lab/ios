import type { Theme } from '../types';
import { PUBLISHER } from '../../brand';

const A = '/themes/deepdivex';

// DEEP DIVE X — abyssal submarine crash game. Descend for treasure, surface
// before the hull breaches. Presentation only; math + fairness are shared.
export const deepdivex: Theme = {
  key: 'deepdivex',
  name: 'DEEP DIVE X',
  publisher: PUBLISHER,
  meta: {
    title: 'DEEP DIVE X — Dive deep, surface rich',
    description:
      'DEEP DIVE X: a mobile-first multiplayer crash game. Dive for treasure and surface before the hull breaches.',
  },
  colors: {
    green: '#0E9FB8',
    greenHi: '#2FD0E6',
    greenLime: '#5FE6F5',
    greenGlow: '#27B8D6',
    greenDeep: '#08566B',
    greenMuted: '#4FA8BA',
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    sceneIdle: `${A}/descend.webp`,
    sceneLose: `${A}/implosion.webp`,
    sceneWin: `${A}/surface.webp`,
    icons: {
      home: `${A}/icons/home.webp`,
      history: `${A}/icons/history.webp`,
      vault: `${A}/icons/vault.webp`,
      leaderboard: `${A}/icons/leaderboard.webp`,
      chat: `${A}/icons/chat.webp`,
    },
  },
  // TODO: drop dive-specific audio in /themes/deepdivex/audio/. For now reuse
  // BANKHEIST X clips so the game isn't silent.
  audio: {
    motifLow: '/themes/bankheistx/audio/motif-low.mp3',
    motifHigh: '/themes/bankheistx/audio/motif-high.mp3',
    stash: '/themes/bankheistx/audio/stash.mp3',
    crash: '/themes/bankheistx/audio/crash.mp3',
    lobby: '/themes/bankheistx/audio/lobby.mp3',
    tick: '/themes/bankheistx/audio/tick.mp3',
    voiceCrash: [1, 2, 3, 4, 5].map((n) => `/themes/bankheistx/audio/voice-crash-${n}.mp3`),
    voiceWin: [1, 2, 3, 4, 5].map((n) => `/themes/bankheistx/audio/voice-win-${n}.mp3`),
  },
  copy: {
    cashOut: 'SURFACE',
    cashOutSub: 'BEFORE THE BREACH',
    securedVerb: 'surfaced',
    bagSecured: (amount) => `SURFACED ${amount}`,
    crashedTile: 'HULL BREACH — LOST',
    currentAmount: 'CURRENT HAUL',
    wouldBeWorth: 'WOULD BE WORTH',
    countdownLabel: 'DESCENT IN',
    winFlash: 'YOU MADE IT OUT!',
    loseFlash: 'HULL BREACH!',
    landingAlt: 'DEEP DIVE X — Dive deep. Surface rich.',
  },
  // the DEEP DIVE twist: the ladder + a live readout read as ocean depth
  ui: { depthMeter: true, metersPerX: 33 },
};
