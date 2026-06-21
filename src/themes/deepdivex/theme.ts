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
    accentRgb: '47,208,230',   // cyan
    btnTopRgb: '10,58,74',     // dark teal-blue
    btnBotRgb: '6,34,46',
    ambientRgb: '47,208,230',
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    landingVideo: `${A}/landing-v2.mp4`,
    playButton: `${A}/playbtn-v3.webp`,
    sceneIdle: `${A}/descend.webp`,
    sceneIdleVideo: `${A}/dive-intro.mp4`,     // 8s: first 5s = surface (during countdown), last 3s = the dive begins at zero
    sceneIdleLoopVideo: `${A}/dive-main.mp4`,  // the dive continues, then loops while the round runs
    sceneLose: `${A}/implosion.webp`,
    sceneLoseVideo: `${A}/implosion-v1.mp4`, // hull-breach crash clip (plays once, full speed)
    sceneWin: `${A}/surface.webp`,
    sceneWinVideo: `${A}/surface-v1.mp4`,    // surface/win clip (muted — game win SFX plays; can't filter the clip's voices out)
    sceneSplitVideo: `${A}/halfwin.mp4`,     // half-win (one bet won, one lost) — muted clip + a timed "case on deck" voice
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
    sceneVoice: `${A}/audio/halfwin-voice.mp3`, // "case on deck" line over the muted half-win clip
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
    currentAmount: 'CURRENT WIN',
    wouldBeWorth: 'WIN WOULD BE',
    countdownLabel: 'DESCENT IN',
    waitForNext: 'WAITING FOR THE NEXT SUBMARINE',
    winFlash: 'YOU MADE IT OUT!',
    loseFlash: 'HULL BREACH!',
    landingAlt: 'DEEP DIVE X — Dive deep. Surface rich.',
  },
  // the DEEP DIVE twist: the ladder + a live readout read as ocean depth. The
  // descent is two clips authored as one continuous film: the intro plays right
  // through the betting countdown (idleSyncCountdown) so the dive begins exactly
  // at zero, then hands off seamlessly to the dive-loop clip while the round
  // runs. sceneSound plays the clips' underwater audio.
  ui: {
    depthMeter: true,
    metersPerX: 33,
    idleSyncCountdown: true,
    sceneLoop: false,
    sceneSound: ['idle'],
    idleSpeedBetting: 0.85, // light slow-mo over the surface during the countdown
    idleSpeed: 1,           // ramps up to full speed at zero so the dive accelerates downward
    // half-win: the muted clip locks on, and the spoken line lands when the case
    // hits the deck (tune delayMs to that beat of the clip)
    sceneVoice: { on: 'split', delayMs: 2500 },
  },
};
