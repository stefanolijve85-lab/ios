import './ui/styles.css';
import { CITY_INFO, CITY_ORDER, MAPS } from './maps';
import { Match, type MatchResult } from './ui/match';
import { loadProgress, recordResult, resetProgress, saveProgress, type Progress } from './save';
import type { Side } from './sim/game';
import { loadAssets, SLOTS, slotStatus } from './render/assets';
import { showroom } from './showroom';
import { Menu, menuState } from './ui/menu';
import { fxroom } from './fxroom';

const app = document.getElementById('app')!;
let progress: Progress = loadProgress();
let match: Match | null = null;
let chosenSide: Side = 'defence';
let chosenCity = 'paris';

function cityPlayable(id: string) { return !!MAPS[id]?.playable; }
function cityUnlocked(id: string) { return progress.unlocked.includes(id) || (progress.tutorialDone && cityPlayable(id) && id === 'paris'); }

let menuUi: Menu | null = null;
function menu() {
  match?.dispose(); match = null;
  (window as unknown as { __match: Match | null }).__match = null;
  if (!menuUi) menuUi = new Menu(app, {
    progress: () => progress,
    save: () => saveProgress(progress),
    reset: () => { progress = resetProgress(); saveProgress(progress); },
    start: (city, side) => { chosenCity = city; chosenSide = side; void start(); },
  });
  menuState.city = chosenCity; menuState.side = chosenSide;
  if (menuState.screen === 'side' || menuState.screen === 'cities') { /* return to where the player left */ }
  menuUi.render();
}

function modal(html: string): HTMLDivElement {
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="panel">${html}<div class="btnrow"><button class="primary" data-close>Close</button></div></div>`;
  app.appendChild(m); m.querySelector('[data-close]')!.addEventListener('click', () => { m.remove(); menu(); });
  return m;
}

/** developer page (not in the player UI): open index.html#assets */
async function assetsPanel() {
  await loadAssets('models/');
  const rows = SLOTS.map((d) => { const st = slotStatus(d.slot); return `<tr class="st-${st}"><td>${d.label}</td><td><code>${d.slot}</code></td><td>${st === 'final' ? '✔ final' : st === 'placeholder' ? '◐ temporary' : '○ built in code'}</td></tr>`; }).join('');
  const missing = SLOTS.filter((d) => slotStatus(d.slot) !== 'final').length;
  modal(`<h2>3D assets</h2><p>${missing} of ${SLOTS.length} model slots still use temporary models. See <code>ASSETS_TODO.md</code>.</p>
    <div class="assettable"><table><tr><th>Asset</th><th>Slot</th><th>Status</th></tr>${rows}</table></div>`);
}

async function start() {
  const map = MAPS[chosenCity];
  if (!map || !map.playable) return;
  match?.dispose(); match = null;
  (window as unknown as { __match: Match | null }).__match = null;
  const nl = progress.settings.language !== 'en';
  app.innerHTML = `<div class="rm-loading" role="status"><span data-l>${nl ? 'Laden' : 'Loading'}…</span></div>`;
  await loadAssets('models/', (d, t) => { const el = app.querySelector('[data-l]'); if (el) el.textContent = `${nl ? 'Laden' : 'Loading'}… ${d}/${t}`; });
  app.innerHTML = '';
  const tutorial = chosenCity === 'paris' && !(progress.completed.paris?.[chosenSide]);
  match = new Match(app, map, chosenSide, progress.settings, progress.perks, tutorial, (r, action) => onExit(r, action));
  match.onSettings = () => saveProgress(progress);
  match.resultInfo = (r: MatchResult) => {
    const unlocked = recordResult(progress, r.cityId, r.side, r.won, r.research, CITY_ORDER).filter(cityPlayable).map((id) => CITY_INFO[id].label);
    saveProgress(progress);
    const g = match!.game; const specs: string[] = [];
    if (g.securitySpec !== 'none') specs.push(g.securitySpec === 'mobile' ? 'Mobile response' : 'Fixed protection');
    if (g.cameraSpec !== 'none') specs.push(g.cameraSpec === 'wide' ? 'Wider coverage' : 'Faster detection');
    if (g.looterUpgrade !== 'none') specs.push(g.looterUpgrade === 'capacity' ? 'Capacity' : 'Speed');
    return { unlocked, research: progress.research, specs };
  };
  (window as unknown as { __match: Match }).__match = match; // exposed for automated browser checks
}

function onExit(_r: MatchResult | null, action: 'menu' | 'restart' | 'next') {
  if (action === 'restart') { void start(); return; }
  if (action === 'next') {
    const i = CITY_ORDER.indexOf(chosenCity);
    const nxt = CITY_ORDER.slice(i + 1).find((id) => cityPlayable(id) && progress.unlocked.includes(id));
    if (nxt) { chosenCity = nxt; void start(); return; }
  }
  menu();
}

void cityUnlocked;
// developer showroom: open index.html#showroom (not linked from the player UI)
if (location.hash === '#showroom') void showroom(app); else if (location.hash === '#fxroom') void fxroom(app); else if (location.hash === '#assets') { menu(); void assetsPanel(); } else menu();
