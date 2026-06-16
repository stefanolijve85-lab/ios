import type { ThemeLocale } from '../types';

// Nederlandse vertaling (eerste opzet — pas de bewoording gerust aan).
// Alleen schermteksten; muziek/SFX zijn universeel. Voice-lines vallen terug op
// het Engels tot er Nederlandse opnames in /themes/<game>/audio/nl/ staan.
export const nl: Record<string, ThemeLocale> = {
  bankheistx: {
    copy: {
      cashOut: 'INCASSEREN',
      cashOutSub: 'ZEKER JE WINST',
      securedVerb: 'veiliggesteld',
      bagSecured: (amount) => `BUIT BINNEN ${amount}`,
      crashedTile: 'TE LAAT — WEG',
      currentAmount: 'HUIDIGE WINST',
      wouldBeWorth: 'WINST ZOU ZIJN',
      countdownLabel: 'KLUIS SLUIT OVER',
      waitForNext: 'WACHTEN OP DE VOLGENDE KLUIS',
      winFlash: 'JE BENT ONTSNAPT!',
      loseFlash: 'ZE ZIJN ERVANDOOR!',
      landingAlt: 'BANKHEIST X — Stel veilig. Cash groots uit.',
    },
  },
  trainridex: {
    copy: {
      cashOut: 'INCASSEREN',
      cashOutSub: 'VOOR DE ONTSPORING',
      securedVerb: 'veiliggesteld',
      bagSecured: (amount) => `BINNEN ${amount}`,
      crashedTile: 'ONTSPOORD — WEG',
      currentAmount: 'HUIDIGE WINST',
      wouldBeWorth: 'WINST ZOU ZIJN',
      countdownLabel: 'TREIN VERTREKT OVER',
      waitForNext: 'WACHTEN OP DE VOLGENDE TREIN',
      winFlash: 'GELUKT!',
      loseFlash: 'ONTSPOORD!',
      landingAlt: 'TRAINRIDE X — Stel je fortuin veilig voor de ontsporing.',
    },
  },
  deepdivex: {
    copy: {
      cashOut: 'OPDUIKEN',
      cashOutSub: 'VOOR DE ROMPBREUK',
      securedVerb: 'opgedoken',
      bagSecured: (amount) => `OPGEDOKEN ${amount}`,
      crashedTile: 'ROMPBREUK — VERLOREN',
      currentAmount: 'HUIDIGE WINST',
      wouldBeWorth: 'WINST ZOU ZIJN',
      countdownLabel: 'AFDALING OVER',
      waitForNext: 'WACHTEN OP DE VOLGENDE DUIKBOOT',
      winFlash: 'JE BENT ONTKOMEN!',
      loseFlash: 'ROMPBREUK!',
      landingAlt: 'DEEP DIVE X — Duik diep. Kom rijk boven.',
    },
  },
  liftoffx: {
    copy: {
      cashOut: 'SPRING ERUIT',
      cashOutSub: 'VERZILVER JE HOOGTE',
      securedVerb: 'ontsnapt',
      bagSecured: (amount) => `ERUIT ${amount}`,
      crashedTile: 'VERBRAND — WEG',
      currentAmount: 'HUIDIGE WINST',
      wouldBeWorth: 'WINST ZOU ZIJN',
      countdownLabel: 'LANCERING OVER',
      waitForNext: 'WACHTEN OP DE VOLGENDE RAKET',
      winFlash: 'VEILIG ERUIT!',
      loseFlash: 'GEËXPLODEERD!',
      landingAlt: 'LIFTOFF X — Vlieg mee. Spring op tijd eruit.',
    },
  },
};
