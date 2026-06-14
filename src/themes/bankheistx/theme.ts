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
  },
  assets: {
    logo: `${A}/logo.webp`,
    landing: `${A}/landing.webp`,
    sceneIdle: `${A}/vault.webp`,
    sceneLose: `${A}/heist.webp`,
    sceneWin: `${A}/caught.webp`,
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
    winFlash: 'YOU GOT OUT!',
    loseFlash: 'THEY GOT AWAY!',
    landingAlt: 'BANKHEIST X — Lock it in. Cash out big.',
  },
};
