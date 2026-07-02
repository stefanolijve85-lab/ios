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
    sceneIdle: `${A}/scene-idle-poster.webp`,
    sceneIdleVideo: `${A}/ride-intro.mp4`,     // plays through the countdown + first part of the ride (departs at zero)
    sceneIdleLoopVideo: `${A}/ride-loop.mp4`,  // clip 2 takes over seamlessly, then loops while the round runs
    sceneLose: `${A}/derailment.webp`,
    sceneLoseVideo: `${A}/derailment-v1.mp4`, // derailment crash clip (plays once, full speed)
    sceneWin: `${A}/escape.webp`,
    sceneWinVideo: `${A}/escape-v1.mp4`, // the escape/win clip (plays once, full speed)
    sceneSplitVideo: `${A}/halfwin.mp4`,  // half-win (one bet won, one lost) — plays out fully
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
    // no separate "ALL ABOARD!" callout — the countdown clip carries its own
    // clock + all-aboard audio (see ui.countdownSound)
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
  // Two-clip ride pipeline (one continuous film):
  //   1. ride-intro plays right through the betting countdown (idleSyncCountdown)
  //      so the train departs at zero, then keeps rolling for the first stretch
  //   2. ride-loop takes over seamlessly and native-loops while the round runs
  ui: {
    sceneLoop: false,       // intro plays once, then hands off to the loop clip
    idleSyncCountdown: true, // intro plays through the countdown (departs at zero)
    idleSpeed: 1,           // full speed so the 5s of countdown lands the departure on zero
    idleAudioNormal: true,  // play the intro clip's own audio (horn/steam/all-aboard), decoupled, in sync at 1x
    idleAudioMaxSec: 4.8,   // cut the intro audio just after "all aboard" so the scream right after it drops
    idleAudioVol: 0.5,      // the intro audio (incl. "all aboard") plays softer
    loseAudioNormal: true,  // play the derailment clip's own audio so the crash has sound
    splitAudioNormal: true, // play the half-win clip's own audio/voice; suppress the crash alarm
    idleLoopTailSec: 2,     // loop only the loop clip's last 2s (the steady racing), not the whole clip
  },
};
