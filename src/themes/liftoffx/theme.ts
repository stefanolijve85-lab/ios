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
    sceneIdleVideo: `${A}/scene-idle-v2.mp4`,
    sceneLoseVideo: `${A}/scene-lose.mp4`,
    sceneWinVideo: `${A}/scene-win.mp4`,
    // fallback icons (DEEP DIVE X) until LIFTOFF-native icons land
    icons: {
      home: '/themes/deepdivex/icons/home.webp',
      history: '/themes/deepdivex/icons/history.webp',
      vault: '/themes/deepdivex/icons/vault.webp',
      leaderboard: '/themes/deepdivex/icons/leaderboard.webp',
      chat: '/themes/deepdivex/icons/chat.webp',
    },
  },
  // Native LIFTOFF FX restored from the old Rocket Rush project (countdown /
  // explosion / engine); music + voice lines still use the BANKHEIST fallback.
  audio: {
    motifLow: '/themes/bankheistx/audio/motif-low.mp3',
    motifHigh: '/themes/bankheistx/audio/motif-high.mp3',
    stash: '/themes/bankheistx/audio/stash.mp3',
    crash: `${A}/audio/explosion.mp3`,
    launch: `${A}/audio/engine.mp3`,   // rocket roar at lift-off (round start)
    lobby: '/themes/bankheistx/audio/lobby.mp3',
    tick: `${A}/audio/countdown.mp3`,  // the launch countdown over the betting clock
    // no voice lines yet — the BANKHEIST heist barks don't fit LIFTOFF, so stay
    // silent (explosion / stash SFX still play) until native lines land
    voiceCrash: [],
    voiceWin: [],
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
    sceneSpeed: { lose: 1.0 }, // crash at full speed (no slow-mo); win full speed too
    sceneLoop: false,
    idleSyncCountdown: true,
    idleSpeedBetting: 0.5,  // gentler ignition slow-mo through the countdown (less stutter than 0.35)
    idleSpeed: 0.85,        // flight a touch faster so the slow-mo doesn't judder
    idleTailLoop: 1.5,      // keep the rocket flying while the round runs
    tickLeadMs: 3000,       // fire the spoken "3,2,1,LIFTOFF" when the clock hits 3
    tickOffset: 2.05,       // start at the "3" in the clip so it lands on clock 3
  },
};
