import type { Theme } from '../types';
import { PUBLISHER } from '../../brand';

const A = '/themes/liftoffx';

// LIFTOFF X — rocket / space crash game, now running on the shared engine.
// Ride the rocket and EJECT before she blows. Presentation only; math +
// fairness are inherited unchanged from the engine (one transparent RTP, one
// provably-fair RNG). The "feel" (volatility / pacing) is tuned per-game in
// server/config.js (GROWTH_K, MAX_MULTIPLIER 1000).
//
// Cinematic theme: video start screen + animated video scenes (launch / blow
// up / eject) instead of static stills.
//
// TODO: ships with fallback icons (DEEP DIVE X) and fallback audio
// (BANKHEIST X) until LIFTOFF-native icons + audio land in
// public/themes/liftoffx/{icons,audio}/.
export const liftoffx: Theme = {
  key: 'liftoffx',
  name: 'LIFTOFF X',
  publisher: PUBLISHER,
  meta: {
    title: 'LIFTOFF X — Eject before she blows',
    description:
      'LIFTOFF X: a mobile-first multiplayer crash game. Ride the rocket, cash out before it burns up.',
  },
  colors: {
    green: '#1E73C8',
    greenHi: '#3AA0F0',
    greenLime: '#5FC8FF',
    greenGlow: '#2E9CE6',
    greenDeep: '#0A2E58',
    greenMuted: '#5A8FBE',
    accentRgb: '255,150,46',    // ember orange (matches the LET'S GO button)
    btnTopRgb: '46,20,8',
    btnBotRgb: '24,10,4',
    ambientRgb: '255,150,46',
  },
  assets: {
    logo: `${A}/logo.webp`,
    // cinematic start screen + the designed "LET'S GO" button
    landing: '/brand/card-liftoffx.webp', // fallback poster (video plays over it)
    landingVideo: `${A}/landing-v2.mp4`,
    playButton: `${A}/letsgo.webp`,
    // static fallbacks (used only if a scene video fails to load)
    sceneIdle: '/brand/card-liftoffx.webp',
    sceneLose: '/brand/card-liftoffx.webp',
    sceneWin: '/brand/card-liftoffx.webp',
    // animated scenes: launch (idle, full-frame, countdown-synced) → explosion
    // (crash) → eject (win)
    sceneIdleVideo: `${A}/scene-idle.mp4`,
    sceneLoseVideo: `${A}/explosion.mp4`,
    sceneWinVideo: `${A}/eject.mp4`,
    // fallback icons (DEEP DIVE X) until LIFTOFF-native icons land
    icons: {
      home: '/themes/deepdivex/icons/home.webp',
      history: '/themes/deepdivex/icons/history.webp',
      vault: '/themes/deepdivex/icons/vault.webp',
      leaderboard: '/themes/deepdivex/icons/leaderboard.webp',
      chat: '/themes/deepdivex/icons/chat.webp',
    },
  },
  // fallback audio (BANKHEIST X) until LIFTOFF-native audio lands
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
    cashOut: 'EJECT',
    cashOutSub: 'BANK YOUR ALTITUDE',
    securedVerb: 'ejected',
    bagSecured: (amount) => `EJECTED ${amount}`,
    crashedTile: 'BURNED UP — GONE',
    currentAmount: 'CURRENT WIN',
    wouldBeWorth: 'WIN WOULD BE',
    countdownLabel: 'LIFTOFF IN',
    waitForNext: 'WAITING FOR THE NEXT ROCKET',
    winFlash: 'CLEAN EJECT!',
    loseFlash: 'SHE BLEW UP!',
    landingAlt: 'LIFTOFF X — Ride it. Eject big.',
  },
  // altitude readout (like DEEP DIVE's depth) reads the multiplier as metres of
  // altitude; speed lines convey the climb. sceneZoom crops the black pillarbox
  // margins baked into the scene clips so the rocket fills the box edge to edge.
  // The idle launch clip is full-frame (no zoom) and plays through the betting
  // countdown so the lift-off lands as the round starts (idleSpeed slows the 8s
  // clip to match the 5s countdown). The old crash/win clips still need the
  // pillarbox zoom. Plays once, holds the last frame (rocket in space).
  ui: {
    motion: { kind: 'speed', color: '#ffd9a8' },
    sceneZoom: { lose: 1.9, win: 1.9 },
    sceneSpeed: 0.6,
    sceneLoop: false,
    idleSyncCountdown: true,
    idleSpeed: 0.56,      // launch lands ~as the round starts (was lifting off too early)
    idleTailLoop: 1.5,    // keep the rocket flying while the round runs
  },
};
