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
    // no voice barks — the BANKHEIST heist lines ("they cleaned us out") don't fit
    // a submarine dive; the crash/implosion SFX still play, plus the half-win line
    voiceCrash: [],
    voiceWin: [],
  },
  copy: {
    cashOut: 'SURFACE',
    cashOutSub: 'BEFORE THE BREACH',
    securedVerb: 'secured',
    bagSecured: (amount) => `SECURED ${amount}`,
    crashedTile: 'IMPLODED — LOST',
    currentAmount: 'CURRENT WIN',
    wouldBeWorth: 'WIN WOULD BE',
    countdownLabel: 'DESCENT IN',
    waitForNext: 'WAITING FOR THE NEXT SUBMARINE',
    winFlash: 'TREASURE SECURED!',
    loseFlash: 'IMPLODED!',
    landingAlt: 'DEEP DIVE X — Dive deep. Surface rich.',
  },
  // the DEEP DIVE twist: the ladder + a live readout read as ocean depth. The
  // descent is two clips authored as one continuous film: the intro plays right
  // through the betting countdown (idleSyncCountdown) so the dive begins exactly
  // at zero, then hands off seamlessly to the dive-loop clip while the round
  // runs. The dive clips stay muted (un-muting a looping video freezes it on
  // iOS); the game motif carries the audio.
  ui: {
    depthMeter: true,
    metersPerX: 33,
    idleSyncCountdown: true,
    sceneLoop: false,
    idleSpeedBetting: 0.85, // light slow-mo over the surface during the countdown
    idleSpeed: 0.8,         // dive plays a touch slow so it lasts longer
    idleEndZoom: true,      // when the dive clip ends, slowly zoom the last frame for ambient motion
    idleLoopStartSec: 0.55, // start clip 2 this far in (trim its first 0.55s) to line up with clip 1's last frame
    sceneSpeed: { win: 0.75 }, // surface/win clip in slight slow-mo
    sceneZoom: { lose: 1.16 }, // crop the implosion clip's baked-in top/bottom fade
    // half-win: the muted clip locks on, and the spoken line lands when the case
    // hits the deck (tune delayMs to that beat of the clip)
    sceneVoice: { on: 'split', delayMs: 2500, gain: 1.9 },
    sceneStartSec: { lose: 1.5 }, // skip the buildup — cut to the implosion sooner
  },
};
