import type { Theme } from '../types';
import { PUBLISHER } from '../../brand';

const A = '/themes/trainridex';

// TRAINRIDE X — runaway-train heist crash game. Secure your fortune before the
// derailment. Presentation only; math + fairness come from the shared engine.
export const trainridex: Theme = {
  key: 'trainridex',
  name: 'TRAINRIDE X',
  publisher: PUBLISHER,
  meta: {
    title: 'TRAINRIDE X — Secure your fortune before the derailment',
    description:
      'TRAINRIDE X: a mobile-first multiplayer crash game. Ride the runaway train, cash out before it derails.',
  },
  colors: {
    green: '#36901A',
    greenHi: '#54B22B',
    greenLime: '#6FBE2E',
    greenGlow: '#5BAE2A',
    greenDeep: '#155808',
    greenMuted: '#5FA13A',
    accentRgb: '89,230,42',
    btnTopRgb: '11,42,17',
    btnBotRgb: '6,24,10',
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    sceneIdle: `${A}/train.webp`,
    sceneLose: `${A}/derailment.webp`,
    sceneWin: `${A}/escape.webp`,
    icons: {
      home: `${A}/icons/home.webp`,
      history: `${A}/icons/history.webp`,
      vault: `${A}/icons/vault.webp`,
      leaderboard: `${A}/icons/leaderboard.webp`,
      chat: `${A}/icons/chat.webp`,
    },
  },
  // TODO: drop train-specific audio in /themes/trainridex/audio/ and point here.
  // For now we reuse BANKHEIST X clips so the game isn't silent.
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
    cashOut: 'SECURE',
    cashOutSub: 'BEFORE THE DERAILMENT',
    securedVerb: 'secured',
    bagSecured: (amount) => `SECURED ${amount}`,
    crashedTile: 'DERAILED — GONE',
    currentAmount: 'CURRENT AMOUNT',
    wouldBeWorth: 'WOULD BE WORTH',
    countdownLabel: 'TRAIN LEAVES IN',
    winFlash: 'YOU MADE IT!',
    loseFlash: 'DERAILED!',
    landingAlt: 'TRAINRIDE X — Secure your fortune before the derailment.',
  },
  ui: { motion: { kind: 'steam', color: '#d6dce2' } },
};
