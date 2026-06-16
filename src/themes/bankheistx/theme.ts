import type { Theme } from '../types';
import { PUBLISHER } from '../../brand';

const A = '/themes/bankheistx';

// BANKHEIST X — the heist-vault crash game. This theme reproduces the original
// look exactly; nothing here touches game math or fairness.
export const bankheistx: Theme = {
  key: 'bankheistx',
  name: 'BANKHEIST X',
  publisher: PUBLISHER,
  meta: {
    title: 'BANKHEIST X — Secure the vault before the thieves',
    description:
      'BANKHEIST X: a mobile-first multiplayer crash game. Fill the vault, secure your winnings, or lose it all when the thieves break in.',
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
    ambientRgb: '230,184,77',
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    landingVideo: `${A}/landing-v3.mp4`,
    playButton: `${A}/playbtn-v5.webp`,
    sceneIdle: `${A}/vault.webp`,
    sceneIdleVideo: `${A}/scene-idle-v2.mp4`,
    sceneLose: `${A}/heist.webp`,
    sceneWin: `${A}/caught.webp`,
    sceneWinVideo: `${A}/scene-win-v2.mp4`,
    scenePosters: { idle: `${A}/scene-idle-poster.webp`, win: `${A}/scene-win-poster.webp` },
    icons: {
      home: `${A}/icons/wallet.webp`,
      history: `${A}/icons/trophy.webp`,
      vault: `${A}/icons/vault.webp`,
      leaderboard: `${A}/icons/leaderboard.webp`,
      chat: `${A}/icons/chat.webp`,
    },
  },
  audio: {
    motifLow: `${A}/audio/motif-low.mp3`,
    motifHigh: `${A}/audio/motif-high.mp3`,
    stash: `${A}/audio/stash.mp3`,
    crash: `${A}/audio/crash.mp3`,
    lobby: `${A}/audio/lobby.mp3`,
    tick: `${A}/audio/tick.mp3`,
    voiceCrash: [1, 2, 3, 4, 5].map((n) => `${A}/audio/voice-crash-${n}.mp3`),
    voiceWin: [1, 2, 3, 4, 5].map((n) => `${A}/audio/voice-win-${n}.mp3`),
  },
  copy: {
    cashOut: 'SECURE',
    cashOutSub: 'LOCK YOUR WINNINGS',
    securedVerb: 'secured',
    bagSecured: (amount) => `BAG SECURED ${amount}`,
    crashedTile: 'TOO LATE — STOLEN',
    currentAmount: 'CURRENT AMOUNT',
    wouldBeWorth: 'WOULD BE WORTH',
    countdownLabel: 'VAULT CLOSES IN',
    waitForNext: 'WAITING FOR THE NEXT VAULT',
    winFlash: 'YOU GOT OUT!',
    loseFlash: 'THEY GOT AWAY!',
    landingAlt: 'BANKHEIST X — Lock it in. Cash out big.',
  },
  // (the animated idle scene already shows the money piling up — no sprite overlay)
  // play the scene videos in slow-motion, and DON'T loop — the idle clip plays
  // once and holds on its last frame (full vault) until the round busts, so it
  // never visibly restarts mid-round.
  ui: { sceneSpeed: 0.5, sceneLoop: false },
};
