import './ui/styles.css';
import { CITY_INFO, CITY_ORDER, MAPS } from './maps';
import { Match, type MatchResult } from './ui/match';
import { loadProgress, recordResult, resetProgress, saveProgress, type Progress } from './save';
import { BALANCE } from './config/balance';
import type { Side } from './sim/game';
import { loadAssets, SLOTS, slotStatus } from './render/assets';

const app = document.getElementById('app')!;
let progress: Progress = loadProgress();
let match: Match | null = null;
let chosenSide: Side = 'defence';
let chosenCity = 'paris';

function cityPlayable(id: string) { return !!MAPS[id]?.playable; }
function cityUnlocked(id: string) { return progress.unlocked.includes(id) || (progress.tutorialDone && cityPlayable(id) && id === 'paris'); }

function menu() {
  match?.dispose(); match = null;
  (window as unknown as { __match: Match | null }).__match = null;
  const bg = CITY_INFO[chosenCity]?.image ?? 'ui/01_map_clean.jpg';
  app.innerHTML = `
  <div class="menu" style="background-image:linear-gradient(180deg,rgba(6,10,20,.55),rgba(6,10,20,.9)),url(${bg})">
    <header><h1>CITY HOLD</h1><p>Urban tower defence & tactical strategy · fictional districts · non-graphic confrontations</p></header>
    <section class="panel side-pick">
      <h2>Choose your side</h2>
      <div class="sides">
        <button class="side def ${chosenSide === 'defence' ? 'on' : ''}" data-side="defence"><img src="ui/12_shield_officer.webp" alt=""><b>DEFENCE</b><span>Protect three stores for ${BALANCE.defence.waves} waves. Keep stock in at least ${BALANCE.defence.storesNeededToWin}.</span></button>
        <button class="side att ${chosenSide === 'looters' ? 'on' : ''}" data-side="looters"><img src="ui/13_looter_box.webp" alt=""><b>LOOTERS</b><span>Extract ${BALANCE.looters.targetStock} stock within ${BALANCE.looters.timeLimit / 60} minutes against an AI defence.</span></button>
      </div>
      <p class="muted">Same district, different objectives. Stats never depend on a character's appearance.</p>
    </section>
    <section class="panel cities">
      <h2>District ${progress.tutorialDone ? '<small>(sandbox selector unlocked)</small>' : '<small>(win Paris to unlock the sandbox selector)</small>'}</h2>
      <div class="citylist">${CITY_ORDER.map((id) => {
        const info = CITY_INFO[id]; const playable = cityPlayable(id); const unlocked = progress.unlocked.includes(id);
        const usable = playable && unlocked && (id === 'paris' || progress.tutorialDone);
        const status = !playable ? 'In development — not playable yet' : !unlocked ? 'Locked — win the previous city' : (id !== 'paris' && !progress.tutorialDone) ? 'Locked' : 'Playable';
        const done = progress.completed[id];
        return `<button class="city ${chosenCity === id ? 'on' : ''}" data-city="${id}" ${usable ? '' : 'disabled'}><img src="${info.image}" alt=""><b>${info.label}</b><span>${info.country}</span><em>${status}${done?.defence ? ' · 🛡✓' : ''}${done?.looters ? ' · 📦✓' : ''}</em></button>`;
      }).join('')}</div>
    </section>
    <div class="menu-actions">
      <button class="primary big" data-act="play">Play ${CITY_INFO[chosenCity].label} · ${chosenSide === 'defence' ? 'Defence' : 'Looters'}</button>
      <button data-act="research">Research (${progress.research} RP)</button>
      <button data-act="settings">Settings</button>
      <button data-act="assets">3D assets</button>
      <button data-act="reset" class="danger">Reset progress</button>
    </div>
    <footer class="muted">Images in this game's menus and cards are the supplied concept references. The 3D district, units and effects are built procedurally.</footer>
  </div>`;
  app.querySelectorAll<HTMLButtonElement>('[data-side]').forEach((b) => b.addEventListener('click', () => { chosenSide = b.dataset.side as Side; menu(); }));
  app.querySelectorAll<HTMLButtonElement>('[data-city]').forEach((b) => b.addEventListener('click', () => { chosenCity = b.dataset.city!; menu(); }));
  app.querySelector('[data-act="play"]')!.addEventListener('click', () => void start());
  app.querySelector('[data-act="research"]')!.addEventListener('click', research);
  app.querySelector('[data-act="settings"]')!.addEventListener('click', settings);
  app.querySelector('[data-act="assets"]')!.addEventListener('click', () => void assetsPanel());
  app.querySelector('[data-act="reset"]')!.addEventListener('click', () => {
    if (confirm('Reset all progress, research and settings?')) { progress = resetProgress(); chosenCity = 'paris'; menu(); }
  });
}

function modal(html: string): HTMLDivElement {
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="panel">${html}<div class="btnrow"><button class="primary" data-close>Close</button></div></div>`;
  app.appendChild(m); m.querySelector('[data-close]')!.addEventListener('click', () => { m.remove(); menu(); });
  return m;
}

function research() {
  const m = modal(`<h2>Research</h2><p>Earned after matches (win +${BALANCE.research.winPoints}, loss +${BALANCE.research.lossPoints}). Available: <b>${progress.research} RP</b></p>
    <div class="perks">${BALANCE.research.perks.map((p) => `<button data-perk="${p.id}" ${progress.perks.includes(p.id) || progress.research < p.cost ? 'disabled' : ''}>${p.name} · ${p.cost} RP${progress.perks.includes(p.id) ? ' ✓' : ''}</button>`).join('')}</div>`);
  m.querySelectorAll<HTMLButtonElement>('[data-perk]').forEach((b) => b.addEventListener('click', () => {
    const p = BALANCE.research.perks.find((pp) => pp.id === b.dataset.perk)!;
    if (progress.research >= p.cost && !progress.perks.includes(p.id)) { progress.research -= p.cost; progress.perks.push(p.id); saveProgress(progress); }
    m.remove(); research();
  }));
}

async function assetsPanel() {
  await loadAssets('models/');
  const rows = SLOTS.map((d) => { const st = slotStatus(d.slot); return `<tr class="st-${st}"><td>${d.label}</td><td><code>${d.slot}</code></td><td>${st === 'final' ? '✔ final' : st === 'placeholder' ? '◐ temporary' : '○ built in code'}</td></tr>`; }).join('');
  const missing = SLOTS.filter((d) => slotStatus(d.slot) !== 'final').length;
  modal(`<h2>3D assets</h2><p>${missing} of ${SLOTS.length} model slots still use temporary models. Drop a final GLB into <code>public/models/</code> and point its slot to it in <code>manifest.json</code> (status "final"). Buildings, shopfronts and the fountain are still generated in code. See <code>ASSETS_TODO.md</code>.</p>
    <div class="assettable"><table><tr><th>Asset</th><th>Slot</th><th>Status</th></tr>${rows}</table></div>`);
}

function settings() {
  const s = progress.settings;
  const m = modal(`<h2>Settings</h2>
    <label>Volume <input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-s="vol"></label>
    <label><input type="checkbox" ${s.reducedFx ? 'checked' : ''} data-s="fx"> Reduced visual effects (fewer particles, no shadows)</label>
    <label><input type="checkbox" ${s.showHints ? 'checked' : ''} data-s="hints"> Show tutorial tips</label>`);
  m.querySelector<HTMLInputElement>('[data-s="vol"]')!.addEventListener('input', (e) => { s.volume = Number((e.target as HTMLInputElement).value); saveProgress(progress); });
  m.querySelector<HTMLInputElement>('[data-s="fx"]')!.addEventListener('change', (e) => { s.reducedFx = (e.target as HTMLInputElement).checked; saveProgress(progress); });
  m.querySelector<HTMLInputElement>('[data-s="hints"]')!.addEventListener('change', (e) => { s.showHints = (e.target as HTMLInputElement).checked; saveProgress(progress); });
}

async function start() {
  const map = MAPS[chosenCity];
  if (!map || !map.playable) return;
  match?.dispose(); match = null;
  (window as unknown as { __match: Match | null }).__match = null;
  app.innerHTML = '<div class="loading"><b>CITY HOLD</b><span data-l>Loading 3D models…</span></div>';
  await loadAssets('models/', (d, t) => { const el = app.querySelector('[data-l]'); if (el) el.textContent = `Loading 3D models… ${d}/${t}`; });
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
menu();
