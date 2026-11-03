import '@fontsource/anton/400.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import './menu.css';
import { BALANCE, DIFFICULTY, type Difficulty } from '../config/balance';
import { Sfx } from '../audio/sfx';
import { music } from '../audio/music';
import { renderBriefing } from './briefing';

/** one-line explanation of what a difficulty changes, per side */
const DIFF_NOTE: Record<'nl' | 'en', Record<Side, Record<Difficulty, string>>> = {
  nl: { defence: { normal: '', hard: 'Meer en snellere relschoppers per golf.', expert: 'Bijna dubbele golven, nog sneller.' }, looters: { normal: '', hard: 'Rijkere beveiliging, sneller versterking, hoger buitdoel.', expert: 'Snellere beveiliging, meer versterking, veel hoger buitdoel.' } },
  en: { defence: { normal: '', hard: 'More and faster rioters per wave.', expert: 'Nearly double waves, even faster.' }, looters: { normal: '', hard: 'Richer security, faster reinforcements, higher loot target.', expert: 'Faster security, more reinforcements, much higher loot target.' } },
};
import { CITY_ORDER, MAPS } from '../maps';
import type { Progress } from '../save';
import type { Side } from '../sim/game';

// RIOTS menu, built from assets/riots_ui (references 02-04). Real semantic UI; the artwork is text-free crops
// (tools/prepare_menu_art.py) and existing city concept images. Screen order:
// main → cities → side → mission (existing preparation phase). Progress and settings branch off the main menu.

type Screen = 'main' | 'cities' | 'side' | 'progress' | 'settings' | 'gallery';
type Lang = 'nl' | 'en';

/** Dutch names for the research perks (the config keeps the English ones used in the HUD). */
const PERK_NL: Record<string, string> = { budget: '+100 startbudget (beide kanten)', restrain: 'Verdedigers houden 10% sneller vast', carry: 'Plunderaars dragen +1 voorraad' };

const T: Record<Lang, Record<string, string>> = {
  nl: {
    tagline: 'Elke straat telt.', play: 'SPELEN', progress: 'VOORTGANG', collection: 'COLLECTIE', settings: 'INSTELLINGEN', footer: 'Tactische stadsstrategie',
    back: 'TERUG', chooseCity: 'KIES JE STAD', next: 'VERDER', available: 'Beschikbaar', chooseSide: 'KIES JE KANT',
    defend: 'VERDEDIGEN', loot: 'PLUNDEREN', defendDesc: 'Bescherm winkels en houd de straat veilig.', lootDesc: 'Verzamel buit en bereik de uitgang.',
    difficulty: 'MOEILIJKHEID', normal: 'NORMAAL', hard: 'MOEILIJK', expert: 'EXPERT', start: 'START MISSIE',
    objDef: `Bescherm de winkels tegen ${BALANCE.defence.waves} opeenvolgende golven.`, objLoot: `Buit {n} voorraad en ontsnap binnen ${BALANCE.looters.timeLimit / 60} minuten.`,
    notPlayable: 'Nog niet speelbaar', lockedWin: 'Win {prev} om {city} vrij te spelen.',
    volume: 'Geluid', musicVol: 'Muziek', quality: 'Grafische kwaliteit', qHigh: 'Hoog (pc)', qMobile: 'Mobiel (licht)', hints: 'Speltips tonen', language: 'Taal', uiScale: 'HUD-grootte', vibration: 'Trillen bij gebeurtenissen',
    danger: 'Gevarenzone', reset: 'VOORTGANG WISSEN', resetConfirm: 'Weet je het zeker? Alle steden, onderzoek en instellingen worden gewist.', resetYes: 'JA, WISSEN', cancel: 'ANNULEREN',
    campaign: 'CAMPAGNE', research: 'ONDERZOEK', points: 'punten', buy: 'KOPEN', owned: 'IN BEZIT', won: 'gewonnen', matches: 'Gespeelde missies',
    defShort: 'verdedigd', lootShort: 'geplunderd', hudNote: 'De speelinterface is (nog) Engelstalig.',
  },
  en: {
    tagline: 'Every street counts.', play: 'PLAY', progress: 'PROGRESS', collection: 'COLLECTION', settings: 'SETTINGS', footer: 'Tactical city strategy',
    back: 'BACK', chooseCity: 'CHOOSE YOUR CITY', next: 'NEXT', available: 'Available', chooseSide: 'CHOOSE YOUR SIDE',
    defend: 'DEFEND', loot: 'LOOT', defendDesc: 'Protect shops and keep the street safe.', lootDesc: 'Collect loot and reach the exit.',
    difficulty: 'DIFFICULTY', normal: 'NORMAL', hard: 'HARD', expert: 'EXPERT', start: 'START MISSION',
    objDef: `Protect the shops through ${BALANCE.defence.waves} consecutive waves.`, objLoot: `Loot {n} stock and escape within ${BALANCE.looters.timeLimit / 60} minutes.`,
    notPlayable: 'Not playable yet', lockedWin: 'Win {prev} to unlock {city}.',
    volume: 'Sound', musicVol: 'Music', quality: 'Graphics quality', qHigh: 'High (desktop)', qMobile: 'Mobile (light)', hints: 'Show tips', language: 'Language', uiScale: 'HUD size', vibration: 'Vibrate on events',
    danger: 'Danger zone', reset: 'ERASE PROGRESS', resetConfirm: 'Are you sure? All cities, research and settings will be erased.', resetYes: 'YES, ERASE', cancel: 'CANCEL',
    campaign: 'CAMPAIGN', research: 'RESEARCH', points: 'points', buy: 'BUY', owned: 'OWNED', won: 'won', matches: 'Missions played',
    defShort: 'defended', lootShort: 'looted', hudNote: 'The in-game interface is in English.',
  },
};

const CITY: Record<string, { nl: string; en: string; cnl: string; cen: string; hero: string; card: string }> = {
  paris: { nl: 'PARIJS', en: 'PARIS', cnl: 'FRANKRIJK', cen: 'FRANCE', hero: 'menu/hero_paris_riot.jpg', card: 'menu/card_paris_riot.jpg' },
  amsterdam: { nl: 'AMSTERDAM', en: 'AMSTERDAM', cnl: 'NEDERLAND', cen: 'NETHERLANDS', hero: 'menu/hero_amsterdam_riot.jpg', card: 'menu/card_amsterdam_riot.jpg' },
  london: { nl: 'LONDEN', en: 'LONDON', cnl: 'VERENIGD KONINKRIJK', cen: 'UNITED KINGDOM', hero: 'menu/hero_london_riot.jpg', card: 'menu/card_london_riot.jpg' },
  milan: { nl: 'MILAAN', en: 'MILAN', cnl: 'ITALIË', cen: 'ITALY', hero: 'menu/hero_milan_riot.jpg', card: 'menu/card_milan_riot.jpg' },
  berlin: { nl: 'BERLIJN', en: 'BERLIN', cnl: 'DUITSLAND', cen: 'GERMANY', hero: 'menu/hero_berlin_riot.jpg', card: 'menu/card_berlin_riot.jpg' },
  saopaulo: { nl: 'SÃO PAULO', en: 'SÃO PAULO', cnl: 'BRAZILIË', cen: 'BRAZIL', hero: 'menu/hero_saopaulo_riot.jpg', card: 'menu/card_saopaulo_riot.jpg' },
};

export interface MenuHost {
  progress(): Progress;
  save(): void;
  reset(): void;
  start(city: string, side: Side): void;
}

/** menu UI state (kept while navigating back and forth; separate from campaign data) */
export const menuState = { screen: 'main' as Screen, city: 'paris', side: 'defence' as Side, history: [] as Screen[] };

const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';
const CHEV_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" d="M9 5l7 7-7 7"/></svg>';
const CHEV_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" d="M15 5l-7 7 7 7"/></svg>';

export class Menu {
  private onKey = (e: KeyboardEvent) => {
    if (!this.app.querySelector('main.rm')) return; // a match or loading screen is showing
    if (e.key === 'Escape' || e.key === 'Backspace' && !(e.target instanceof HTMLInputElement)) { if (menuState.screen !== 'main') { e.preventDefault(); this.back(); } }
  };
  /** soft click on every menu button (same synthesised sounds as in the match) */
  private ui = new Sfx(0);
  private onClick = (e: Event) => {
    if (!(e.target as HTMLElement).closest?.('button')) return;
    this.ui.volume = this.host.progress().settings.volume; this.ui.play('click');
  };
  constructor(private app: HTMLElement, private host: MenuHost) { window.addEventListener('keydown', this.onKey); app.addEventListener('click', this.onClick, true); }
  dispose() { window.removeEventListener('keydown', this.onKey); this.app.removeEventListener('click', this.onClick, true); this.ui.dispose(); }

  private get t() { return T[this.host.progress().settings.language ?? 'nl']; }
  private get lang(): Lang { return this.host.progress().settings.language ?? 'nl'; }
  private cityName(id: string) { return CITY[id][this.lang]; }

  /** existing unlock rules (main.ts): playable map, unlocked in the campaign, Paris first */
  cityStatus(id: string): { usable: boolean; text: string } {
    const p = this.host.progress();
    if (!MAPS[id]?.playable) return { usable: false, text: this.t.notPlayable };
    const unlocked = p.unlocked.includes(id) && (id === 'paris' || p.tutorialDone);
    if (unlocked) return { usable: true, text: this.t.available };
    const prev = CITY_ORDER[CITY_ORDER.indexOf(id) - 1] ?? 'paris';
    return { usable: false, text: this.t.lockedWin.replace('{prev}', this.cityName(prev).toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())).replace('{city}', this.cityName(id).toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())) };
  }

  go(s: Screen) { if (s !== menuState.screen) menuState.history.push(menuState.screen); menuState.screen = s; this.render(); }
  back() { menuState.screen = menuState.history.pop() ?? 'main'; this.render(); }

  render() {
    document.title = 'RIOTS';
    const s = menuState.screen;
    this.galleryOff?.(); this.galleryOff = null;
    if (s === 'main') this.main(); else if (s === 'cities') this.cities(); else if (s === 'side') this.side(); else if (s === 'progress') this.progress(); else if (s === 'gallery') this.gallery(); else this.settings();
    const first = this.app.querySelector<HTMLElement>('[data-autofocus]');
    // focus for keyboard/screen readers without drawing the focus ring on a mouse/touch visit
    first?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  }

  private wire(sel: string, fn: (el: HTMLElement) => void) { this.app.querySelectorAll<HTMLElement>(sel).forEach((el) => el.addEventListener('click', () => fn(el))); }
  private backBtn() { return `<button class="rm-back" data-back aria-label="${this.t.back}">${CHEV_L}<span>${this.t.back}</span></button>`; }

  // ---------------------------------------------------------------- collection: every figure, object, building and shop
  private galleryOff: (() => void) | null = null;
  private gallery() {
    const t = this.t;
    this.app.innerHTML = `<main class="rm rm-sub rm-gallery">
      <header class="rm-top"><div class="rm-logo-sm">RIOTS</div>${this.backBtn()}</header>
      <h1 class="rm-h1">${t.collection}</h1>
      <div class="rm-galwrap" data-gal></div></main>`;
    this.wire('[data-back]', () => this.back());
    const host = this.app.querySelector<HTMLElement>('[data-gal]')!;
    let off: (() => void) | null = null; let gone = false;
    this.galleryOff = () => { gone = true; off?.(); };
    void import('./gallery').then((g) => g.mountGallery(host, { settings: this.host.progress().settings, save: () => this.host.save(), lang: this.lang })).then((d) => { if (gone) d(); else off = d; });
  }

  // ---------------------------------------------------------------- 02 main menu
  private main() {
    const t = this.t;
    this.app.innerHTML = `<main class="rm rm-main">
      <div class="rm-street" aria-hidden="true"></div>
      <div class="rm-col">
        <h1 class="rm-title" aria-label="RIOTS"><span>RIOTS</span></h1>
        <div class="rm-brush" aria-hidden="true"></div>
        <nav class="rm-nav">
          <button class="rm-cta" data-go="cities" data-autofocus>${t.play}</button>
          <button class="rm-link" data-go="progress">${t.progress}</button>
          <button class="rm-link" data-go="gallery">${t.collection}</button>
          <button class="rm-link" data-go="settings">${t.settings}</button>
        </nav>
      </div></main>`;
    this.wire('[data-go]', (el) => this.go(el.dataset.go as Screen));
    this.intro();
  }

  /** cinematic intro (video/intro.mp4: shield wall, Milan looters, Amsterdam firefighters) once per visit, over the main menu;
   *  any tap or key skips it. Not shown to automated browsers, so test clicks reach the menu directly. */
  private intro() {
    let seen = false; try { seen = sessionStorage.getItem('riots.intro') === '1'; sessionStorage.setItem('riots.intro', '1'); } catch { /* private mode: show it */ }
    if (seen || navigator.webdriver || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nl = this.lang === 'nl';
    const el = document.createElement('div'); el.className = 'rm-intro';
    el.innerHTML = `<video src="video/intro.mp4" poster="video/intro_poster.jpg" autoplay muted playsinline preload="auto"></video><button class="rm-intro-skip">${nl ? 'Overslaan' : 'Skip'}</button>`;
    document.body.appendChild(el);
    const v = el.querySelector('video')!;
    let done = false;
    const close = () => { if (done) return; done = true; el.classList.add('out'); window.removeEventListener('keydown', close, true); setTimeout(() => el.remove(), 600); };
    v.addEventListener('ended', close); v.addEventListener('error', close);
    el.addEventListener('pointerdown', close); window.addEventListener('keydown', close, true);
    void v.play().catch(() => { /* autoplay blocked: the poster stays until a tap */ });
  }

  // ---------------------------------------------------------------- 03 city selection
  private cities() {
    const t = this.t; const id = menuState.city; const st = this.cityStatus(id); const c = CITY[id];
    this.app.innerHTML = `<main class="rm rm-cities">
      <div class="rm-hero" style="background-image:url(${c.hero})" aria-hidden="true"></div>
      <header class="rm-top"><div class="rm-logo-sm">RIOTS</div>${this.backBtn()}</header>
      <h1 class="rm-h1">${t.chooseCity}</h1>
      <section class="rm-cityinfo" aria-live="polite">
        <h2 class="rm-cityname">${this.cityName(id)}</h2>
        <p class="rm-country">${this.lang === 'nl' ? c.cnl : c.cen}</p>
        <p class="rm-status ${st.usable ? 'ok' : 'locked'}">${st.text}</p>
      </section>
      <button class="rm-cta rm-next" data-next ${st.usable ? '' : 'disabled'} data-autofocus>${t.next}${CHEV_R}</button>
      <div class="rm-cards" role="listbox" aria-label="${t.chooseCity}">${CITY_ORDER.map((cid) => {
        const s2 = this.cityStatus(cid);
        return `<button class="rm-card ${cid === id ? 'on' : ''} ${s2.usable ? '' : 'is-locked'}" role="option" aria-selected="${cid === id}" data-city="${cid}" style="background-image:url(${CITY[cid].card})"><span class="rm-card-label">${this.cityName(cid)}</span>${s2.usable ? '' : `<span class="rm-lock" title="${s2.text}">${LOCK}</span>`}</button>`;
      }).join('')}</div></main>`;
    this.wire('[data-back]', () => this.back());
    this.wire('[data-city]', (el) => { menuState.city = el.dataset.city!; this.render(); this.app.querySelector<HTMLElement>(`[data-city="${menuState.city}"]`)?.focus({ preventScroll: true }); });
    this.wire('[data-next]', () => { if (this.cityStatus(menuState.city).usable) this.go('side'); });
    this.app.querySelector(`[data-city="${id}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  // ---------------------------------------------------------------- 04 side selection
  private side() {
    const t = this.t; const p = this.host.progress(); const id = menuState.city; const sd = menuState.side;
    if (!this.cityStatus(id).usable) { menuState.screen = 'cities'; this.render(); return; } // never start a locked city
    const diffs: Difficulty[] = ['normal', 'hard', 'expert'];
    const thumb = id === 'paris' ? 'menu/mission_paris.jpg' : CITY[id].card;
    this.app.innerHTML = `<main class="rm rm-side">
      <div class="rm-sidebg" aria-hidden="true"></div>
      <header class="rm-top"><div class="rm-logo">RIOT<span>S</span></div>${this.backBtn()}</header>
      <h1 class="rm-h1 center">${t.chooseSide}</h1><div class="rm-brush center" aria-hidden="true"></div>
      <div class="rm-sides" role="radiogroup" aria-label="${t.chooseSide}">
        ${(['defence', 'looters'] as Side[]).map((s2) => `<button class="rm-sidecard ${sd === s2 ? 'on' : ''}" role="radio" aria-checked="${sd === s2}" data-side="${s2}" ${sd === s2 ? 'data-autofocus' : ''}>
          <span class="rm-sideart" style="background-image:url(menu/side_${s2 === 'defence' ? 'defence' : 'looters'}.jpg)"></span>
          <span class="rm-sidetitle">${s2 === 'defence' ? t.defend : t.loot}</span>
          <span class="rm-sidedesc">${s2 === 'defence' ? t.defendDesc : t.lootDesc}</span></button>`).join('')}
      </div>
      <section class="rm-mission">
        <span class="rm-mthumb" style="background-image:url(${thumb})" aria-hidden="true"></span>
        <div class="rm-mtext">
          <h2 class="rm-mcity">${this.cityName(id)} <button class="rm-info" data-brief>${this.lang === 'nl' ? 'STADSINFO' : 'CITY INFO'}</button></h2>
          <div class="rm-diff" role="radiogroup" aria-label="${t.difficulty}"><span class="rm-difflabel">${t.difficulty}</span>${diffs.map((d) => `<button role="radio" aria-checked="${p.settings.difficulty === d}" class="rm-diffbtn ${p.settings.difficulty === d ? 'on' : ''}" data-diff="${d}">${t[d]}</button>`).join('')}</div>
          <p class="rm-obj">${sd === 'defence' ? t.objDef : t.objLoot.replace('{n}', String(Math.round(BALANCE.looters.targetStock * DIFFICULTY[p.settings.difficulty].lootTargetMul)))}${DIFF_NOTE[p.settings.language === 'en' ? 'en' : 'nl'][sd][p.settings.difficulty] ? `<span class="rm-objnote">${DIFF_NOTE[p.settings.language === 'en' ? 'en' : 'nl'][sd][p.settings.difficulty]}</span>` : ''}</p>
        </div>
        <button class="rm-cta rm-start" data-start>${t.start}${CHEV_R}</button>
      </section></main>`;
    this.wire('[data-back]', () => this.back());
    this.wire('[data-side]', (el) => { menuState.side = el.dataset.side as Side; this.render(); });
    this.wire('[data-diff]', (el) => { p.settings.difficulty = el.dataset.diff as Difficulty; this.host.save(); this.render(); });
    const go = () => { if (this.cityStatus(menuState.city).usable) this.host.start(menuState.city, menuState.side); };
    this.wire('[data-brief]', () => this.briefing(id, null));
    this.wire('[data-start]', () => {
      // the first time a city is started its briefing comes first
      const seen = p.settings.briefed ?? [];
      if (!seen.includes(id)) { p.settings.briefed = [...seen, id]; this.host.save(); this.briefing(id, go); } else go();
    });
  }

  /** city briefing overlay: schematic map + what is special about this city; `onStart` adds a start button */
  private briefing(id: string, onStart: (() => void) | null) {
    const nl = this.lang === 'nl';
    const ov = document.createElement('div'); ov.className = 'bf-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="bf-box"><div class="bf-body"></div><footer class="bf-foot">
      <button class="rm-ghost" data-bf-close>${onStart ? (nl ? 'TERUG' : 'BACK') : (nl ? 'SLUITEN' : 'CLOSE')}</button>
      ${onStart ? `<button class="rm-cta" data-bf-start>${nl ? 'START MISSIE' : 'START MISSION'}${CHEV_R}</button>` : ''}</footer></div>`;
    this.app.appendChild(ov);
    renderBriefing(ov.querySelector('.bf-body')!, MAPS[id], id, this.lang, this.cityName(id));
    const close = () => { ov.remove(); document.removeEventListener('keydown', key); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    ov.querySelector('[data-bf-close]')!.addEventListener('click', close);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('[data-bf-start]')?.addEventListener('click', () => { close(); onStart?.(); });
    (ov.querySelector<HTMLElement>('[data-bf-start]') ?? ov.querySelector<HTMLElement>('[data-bf-close]'))?.focus();
  }

  // ---------------------------------------------------------------- progress (campaign + research)
  private progress() {
    const t = this.t; const p = this.host.progress();
    this.app.innerHTML = `<main class="rm rm-sub">
      <div class="rm-street dim" aria-hidden="true"></div>
      <header class="rm-top"><div class="rm-logo-sm">RIOTS</div>${this.backBtn()}</header>
      <h1 class="rm-h1">${t.progress}</h1>
      <div class="rm-panels">
        <section class="rm-panel"><h2>${t.campaign}</h2><ul class="rm-camp">${CITY_ORDER.map((cid) => { const s2 = this.cityStatus(cid); const d = p.completed[cid];
          return `<li class="${s2.usable ? '' : 'locked'}"><b>${this.cityName(cid)}</b><span>${s2.usable ? [d?.defence ? '✓ ' + t.defShort : '', d?.looters ? '✓ ' + t.lootShort : ''].filter(Boolean).join(' · ') || t.available : s2.text}</span></li>`; }).join('')}</ul>
          <p class="rm-muted">${t.matches}: ${p.matches}</p></section>
        <section class="rm-panel"><h2>${t.research} <small>${p.research} ${t.points}</small></h2>
          ${BALANCE.research.perks.map((pk) => { const own = p.perks.includes(pk.id); return `<div class="rm-perk"><span>${(this.lang === 'nl' && PERK_NL[pk.id]) || pk.name}</span><button class="rm-small" data-perk="${pk.id}" ${own || p.research < pk.cost ? 'disabled' : ''}>${own ? t.owned : `${t.buy} · ${pk.cost}`}</button></div>`; }).join('')}
        </section>
      </div></main>`;
    this.wire('[data-back]', () => this.back());
    this.wire('[data-perk]', (el) => {
      const pk = BALANCE.research.perks.find((x) => x.id === el.dataset.perk)!;
      if (p.research >= pk.cost && !p.perks.includes(pk.id)) { p.research -= pk.cost; p.perks.push(pk.id); this.host.save(); }
      this.render();
    });
  }

  // ---------------------------------------------------------------- settings (sound, language, graphics, erase deep inside)
  private settings(confirmReset = false) {
    const t = this.t; const s = this.host.progress().settings;
    this.app.innerHTML = `<main class="rm rm-sub">
      <div class="rm-street dim" aria-hidden="true"></div>
      <header class="rm-top"><div class="rm-logo-sm">RIOTS</div>${this.backBtn()}</header>
      <h1 class="rm-h1">${t.settings}</h1>
      <div class="rm-panels one"><section class="rm-panel">
        <label class="rm-row"><span>${t.volume}</span><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-s="vol"></label>
        <label class="rm-row"><span>${t.musicVol}</span><input type="range" min="0" max="1" step="0.05" value="${s.music ?? 0.5}" data-s="mus"></label>
        <div class="rm-row"><span>${t.language}</span><span class="rm-seg">${(['nl', 'en'] as Lang[]).map((l) => `<button class="rm-diffbtn ${s.language === l ? 'on' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</span></div>
        <div class="rm-row"><span>${t.quality}</span><span class="rm-seg"><button class="rm-diffbtn ${!s.reducedFx ? 'on' : ''}" data-q="high">${t.qHigh}</button><button class="rm-diffbtn ${s.reducedFx ? 'on' : ''}" data-q="mobile">${t.qMobile}</button></span></div>
        <label class="rm-row"><span>${t.hints}</span><input type="checkbox" ${s.showHints ? 'checked' : ''} data-s="hints"></label>
        <div class="rm-row"><span>${t.uiScale}</span><span class="rm-seg">${[1, 1.15, 1.3].map((v) => `<button class="rm-diffbtn ${Number(s.uiScale || 1) === v ? 'on' : ''}" data-ui="${v}">${Math.round(v * 100)}%</button>`).join('')}</span></div>
        <label class="rm-row"><span>${t.vibration}</span><input type="checkbox" ${s.vibration ? 'checked' : ''} data-s="vib"></label>
        <p class="rm-muted">${t.hudNote}</p>
        <details class="rm-danger" ${confirmReset ? 'open' : ''}><summary>${t.danger}</summary>
          ${confirmReset ? `<p>${t.resetConfirm}</p><div class="rm-seg"><button class="rm-small warn" data-reset-yes>${t.resetYes}</button><button class="rm-small" data-reset-no>${t.cancel}</button></div>` : `<button class="rm-small warn" data-reset>${t.reset}</button>`}
        </details>
      </section></div></main>`;
    this.wire('[data-back]', () => this.back());
    this.app.querySelector<HTMLInputElement>('[data-s="mus"]')!.addEventListener('input', (e) => { s.music = Number((e.target as HTMLInputElement).value); music.setVolume(s.music); this.host.save(); });
    this.app.querySelector<HTMLInputElement>('[data-s="vol"]')!.addEventListener('input', (e) => { s.volume = Number((e.target as HTMLInputElement).value); this.host.save(); });
    this.app.querySelector<HTMLInputElement>('[data-s="hints"]')!.addEventListener('change', (e) => { s.showHints = (e.target as HTMLInputElement).checked; this.host.save(); });
    this.wire('[data-lang]', (el) => { s.language = el.dataset.lang as Lang; this.host.save(); this.settings(); });
    this.wire('[data-q]', (el) => { s.reducedFx = el.dataset.q === 'mobile'; this.host.save(); this.settings(); });
    this.wire('[data-ui]', (el) => { s.uiScale = Number(el.dataset.ui); this.host.save(); this.settings(); });
    this.app.querySelector<HTMLInputElement>('[data-s="vib"]')!.addEventListener('change', (e) => { s.vibration = (e.target as HTMLInputElement).checked; this.host.save(); try { if (s.vibration) navigator.vibrate?.(30); } catch { /* not supported */ } });
    this.wire('[data-reset]', () => this.settings(true));
    this.wire('[data-reset-no]', () => this.settings(false));
    this.wire('[data-reset-yes]', () => { this.host.reset(); menuState.city = 'paris'; menuState.history = []; menuState.screen = 'main'; this.render(); });
  }
}
