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
    ambientRgb: '212,142,78',
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    landingVideo: `${A}/landing-v5.mp4`,
    playButton: `${A}/playbtn-v2.webp`,
    sceneIdle: `${A}/train.webp`,
    sceneIdleVideo: `${A}/scene-idle.mp4`,
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
  // Full TRAINRIDE X audio set: music (cinderscattle / thelasttraintonowhere /
  // stationsteam), FX (cash-out / derailment / countdown) and voice lines.
  audio: {
    motifLow: '/themes/trainridex/audio/motif-low.mp3',
    motifHigh: '/themes/trainridex/audio/motif-high.mp3',
    stash: '/themes/trainridex/audio/stash.mp3',
    crash: '/themes/trainridex/audio/crash.mp3',
    lobby: '/themes/trainridex/audio/lobby.mp3',
    tick: '/themes/trainridex/audio/tick.mp3',
    voiceCrash: [1, 2, 3, 4, 5].map((n) => `/themes/trainridex/audio/voice-crash-${n}.mp3`),
    voiceWin: [1, 2, 3, 4, 5].map((n) => `/themes/trainridex/audio/voice-win-${n}.mp3`),
  },
  copy: {
    cashOut: 'SECURE',
    cashOutSub: 'BEFORE THE DERAILMENT',
    securedVerb: 'secured',
    bagSecured: (amount) => `SECURED ${amount}`,
    crashedTile: 'DERAILED — GONE',
    currentAmount: 'CURRENT WIN',
    wouldBeWorth: 'WIN WOULD BE',
    countdownLabel: 'TRAIN LEAVES IN',
    waitForNext: 'WAITING FOR THE NEXT TRAIN',
    winFlash: 'YOU MADE IT!',
    loseFlash: 'DERAILED!',
    landingAlt: 'TRAINRIDE X — Secure your fortune before the derailment.',
  },
  // Idle clip: hold the first frame (train waiting) through the betting
  // countdown, then play (the train leaves) when the round runs; loop the tail
  // so it keeps racing for the whole round. Result scenes stay as stills.
  ui: {
    motion: { kind: 'speed', color: '#ffe7cc' },
    sceneSpeed: 0.85,
    sceneLoop: false,
    idleTailLoop: 2,
  },
};
