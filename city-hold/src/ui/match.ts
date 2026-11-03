import { BALANCE, KIND_LABEL, type AttKind, type DefKind } from '../config/balance';
import { Game, type GameEvent, type Side } from '../sim/game';
import type { MapDef } from '../maps/types';
import { MatchView, type Pick } from '../render/view';
import { Sfx, type Listener } from '../audio/sfx';
import { music } from '../audio/music';
import type { Settings } from '../save';
import { translateLive } from './i18n_nl';
import { setFigureChoices } from '../render/character';

type BuildKind = 'barrier' | 'concrete' | 'camera';

const DEF_CARDS: { kind: DefKind | BuildKind; label: string; img: string; note: string }[] = [
  { kind: 'security', label: 'Security', img: 'ui/10_security_officer.webp', note: 'Fast · intercepts one offender' },
  { kind: 'shield', label: 'Shield team', img: 'ui/fx_shield_officer.webp', note: 'Slow · holds up to 3' },
  { kind: 'barrier', label: 'Barrier', img: 'ui/15_barrier.webp', note: 'Slows a lane · breakable' },
  { kind: 'concrete', label: 'Concrete', img: 'ui/31_concrete_barriers.webp', note: '2× durability · large socket' },
  { kind: 'camera', label: 'Camera', img: 'ui/16_camera_mast.webp', note: 'Detection · no damage' },
  { kind: 'firefighter', label: 'Firefighter', img: 'ui/fx_firefighter_hose.webp', note: 'Extinguishes fires' },
];

const ATT_CARDS: { kind: AttKind; label: string; img: string | null; note: string }[] = [
  { kind: 'runner', label: 'Runner', img: 'ui/26_runner.webp', note: `Fast · carries ${BALANCE.units.runner.capacity}` },
  { kind: 'carrier', label: 'Carrier', img: 'ui/06_puffer_electronics_box.webp', note: `Normal · carries ${BALANCE.units.carrier.capacity}` },
  { kind: 'heavy', label: 'Heavy carrier', img: 'ui/28_heavy_carrier.webp', note: `Carries ${BALANCE.units.heavy.capacity} (2× runner) · 20% slower than carrier` },
  { kind: 'thrower', label: 'Thrower', img: 'ui/thr_masked_1.webp', note: `Throws at the target store or cars · ${BALANCE.throw.throwsPerUnit} throws · carries ${BALANCE.units.thrower.capacity}` },
  { kind: 'vandal', label: 'Vandal', img: 'ui/01_tracksuit_arms_spread.webp', note: `Breaks shutters ${Math.round(BALANCE.units.vandal.breakRate / BALANCE.units.carrier.breakRate)}× faster · carries ${BALANCE.units.vandal.capacity}` },
];

interface Hint { title: string; text: string; done: (m: Match) => boolean }

export interface MatchResult { won: boolean; title: string; detail: string; research: number; side: Side; cityId: string; extracted: number; storesHeld: number; intercepted: number }

export class Match {
  game: Game;
  view: MatchView;
  sfx: Sfx;
  root: HTMLDivElement;
  speed = 1;
  paused = false;
  placing: BuildKind | null = null;
  /** a barrier waiting to be turned before it is put down: its socket and angle (degrees) */
  pending: { socket: string; x: number; z: number; rot: number } | null = null;
  /** tear gas armed: the next tap on the ground is where the canister lands */
  gasAim = false;
  /** which grenade the next tap throws */
  aimKind: 'gas' | 'flash' = 'gas';
  private raf = 0;
  private last = 0;
  private acc = 0;
  private hints: Hint[] = [];
  private hintIdx = 0;
  movedOnce = false;
  private resultShown = false;
  private hudRefreshT = 0;
  private el: Record<string, HTMLElement> = {};

  constructor(private host: HTMLElement, readonly map: MapDef, readonly side: Side, private settings: Settings, private perks: string[], private tutorial: boolean,
    private onExit: (r: MatchResult | null, action: 'menu' | 'restart' | 'next') => void, crew: AttKind[] = []) {
    setFigureChoices(settings.figures);
    const urlSeed = Number(new URLSearchParams(location.search).get('seed')); // fixed seed for automated tests (?seed=N)
    this.game = new Game(map, side, { seed: urlSeed > 0 ? urlSeed : (Date.now() & 0xffff) + 1, perks, mobile: settings.reducedFx, difficulty: settings.difficulty, crew });
    this.sfx = new Sfx(settings.volume);
    this.root = document.createElement('div'); this.root.className = 'match';
    host.appendChild(this.root);
    this.view = new MatchView(this.root, map, side, { onTap: (p, sx, sy) => this.onTap(p, sx, sy) }, settings.reducedFx);
    this.buildHud();
    this.sfx.lang = settings.language === 'en' ? 'en' : 'nl';
    if (settings.language !== 'en') this.stopI18n = translateLive(this.root); // Dutch HUD, labels and messages
    this.root.style.setProperty('--ui-scale', String(settings.uiScale || 1));
    // overlays sit right under the top bar, whatever its height (it wraps to two or three rows on narrow phones)
    const tb = this.root.querySelector<HTMLElement>('.topbar');
    if (tb && 'ResizeObserver' in window) { const ro = new ResizeObserver(() => this.root.style.setProperty('--tb', `${tb.offsetHeight}px`)); ro.observe(tb); this.stopTb = () => ro.disconnect(); }
    // iOS only plays Web Audio after a touch: unlock on the first one (also starts the street ambience)
    // iOS only grants sound on a released tap (touchend/click), not on pointerdown
    for (const ev of ['pointerdown', 'touchend', 'click']) this.root.addEventListener(ev, () => this.sfx.unlock(), { capture: true });
    this.renderCycle();
    this.setupHints();
    this.refreshHud(true);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private stopI18n: (() => void) | null = null;
  private stopTb: (() => void) | null = null;
  private buzz(ms: number | number[]) { if (this.settings.vibration) try { navigator.vibrate?.(ms); } catch { /* not supported */ } }
  dispose() {
    this.stopI18n?.(); this.stopTb?.(); this.sfx.dispose();
    cancelAnimationFrame(this.raf);
    this.view.dispose();
    this.root.remove();
  }

  private loop = (t: number) => {
    const dt = Math.min(0.1, (t - this.last) / 1000); this.last = t;
    if (!this.paused && !this.game.over) {
      this.acc += dt * this.speed;
      const step = 1 / BALANCE.tickRate;
      let n = 0;
      while (this.acc >= step && n < 8) { this.game.step(step); this.acc -= step; n++; }
    }
    this.handleEvents(this.game.drainEvents());
    this.view.render(this.game, this.paused ? 0 : dt * this.speed);
    this.updateAudio(dt);
    music.setIntensity(this.paused || this.game.over ? 0.2 : (this.game.phase === 'wave' || this.game.phase === 'running') ? 1 : 0.3);
    this.hudRefreshT -= dt;
    if (this.hudRefreshT <= 0) { this.refreshHud(false); this.hudRefreshT = 0.15; }
    if (this.game.over && !this.resultShown) { this.resultShown = true; setTimeout(() => this.showResult(), 900); }
    this.raf = requestAnimationFrame(this.loop);
  };

  // ------------------------------------------------------------------ HUD construction
  private buildHud() {
    const isDef = this.side === 'defence';
    const h = document.createElement('div'); h.className = 'hud ' + (isDef ? 'side-def' : 'side-att');
    h.innerHTML = `
      <div class="topbar">
        <div class="brand"><b>RIOTS</b><span>${this.map.city.toUpperCase()} / ${this.map.district.toUpperCase()}</span></div>
        <div class="badge">${isDef ? '🛡 DEFENCE' : '📦 LOOTERS'}</div>
        <div class="stat"><small>BUDGET</small><b data-k="budget"></b></div>
        <div class="stat"><small>${isDef ? 'WAVE' : 'TIME LEFT'}</small><b data-k="wave"></b></div>
        <div class="stat"><small>${isDef ? 'STORES WITH STOCK' : 'EXTRACTED'}</small><b data-k="obj"></b></div>
        <div class="tbtns">
          <button data-a="pause" title="Pause (P)">⏸</button>
          <button data-a="speed" title="Speed">1×</button>
          <button data-a="restart" title="Restart">⟲</button>
          <button data-a="settings" title="Settings">⚙</button>
          <button data-a="menu" title="Menu">☰</button>
        </div>
      </div>
      <div class="hint" data-k="hint"><b></b><p></p><button data-a="skiphint">Skip tips</button></div>
      <div class="cycle" data-k="cycle"></div>
      <div class="toasts" data-k="toasts"></div>
      <div class="info" data-k="info"></div>
      <div class="bottom">
        <div class="cards" data-k="cards"></div>
        <div class="actions" data-k="actions"></div>
      </div>
      <div class="pausebox" data-k="pausebox">PAUSED</div>
      <div class="modal hidden" data-k="modal"></div>`;
    this.root.appendChild(h);
    h.querySelectorAll<HTMLElement>('[data-k]').forEach((e) => (this.el[e.dataset.k!] = e));
    h.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => b.addEventListener('click', () => this.action(b.dataset.a!, b)));
    const cards = this.el.cards;
    if (isDef) {
      for (const c of DEF_CARDS) {
        const b = document.createElement('button'); b.className = 'card'; b.dataset.kind = c.kind;
        const cost = BALANCE.defence.costs[c.kind];
        // the fire crew wears the city's own kit (ui/firefighters/<city>.webp); falls back to the generic picture
        const img = c.kind === 'firefighter' ? `ui/firefighters/${this.game.map.id}.webp` : c.img;
        b.innerHTML = `<img src="${img}" alt="" onerror="this.onerror=null;this.src='${c.img}'"><span class="cl">${c.label}</span><span class="cc">${cost}</span><span class="cn">${c.note}</span>`;
        b.addEventListener('click', () => this.cardDef(c.kind));
        cards.appendChild(b);
      }
    } else {
      for (const c of ATT_CARDS) {
        const b = document.createElement('button'); b.className = 'card'; b.dataset.kind = c.kind;
        b.innerHTML = `${c.img ? `<img src="${c.img}" alt="">` : '<i class="glyph">✕</i>'}<span class="cl">${c.label}</span><span class="cc">${BALANCE.looters.costs[c.kind]}</span><span class="cn">${c.note}</span>`;
        b.addEventListener('click', () => { const r = this.game.recruit(c.kind); if (r.ok) { this.sfx.play('buy'); this.showRecruit(c.img, c.label); } this.refreshHud(true); });
        cards.appendChild(b);
      }
    }
    window.addEventListener('keydown', this.onKey);
    if (!isDef && this.game.squad.length) setTimeout(() => this.toast(`Your crew is back: ${this.game.squad.length} rioters from the last mission joined the group`, 'good'), 600);
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.root.isConnected) { window.removeEventListener('keydown', this.onKey); return; }
    if (e.key === 'p' || e.key === ' ') { this.action('pause'); e.preventDefault(); }
    if (e.key === 'Escape') { this.pending = null; this.view.setGhost(null, null, false); this.placing = null; this.view.showSockets = null; this.view.refreshSockets(this.game); this.view.selected.clear(); this.refreshHud(true); }
  };

  private action(a: string, btn?: HTMLElement) {
    this.sfx.play('click');
    switch (a) {
      case 'pause': this.paused = !this.paused; break;
      case 'speed': this.speed = this.speed === 1 ? 2 : 1; if (btn) btn.textContent = `${this.speed}×`; break;
      case 'restart': this.onExit(null, 'restart'); return;
      case 'menu': this.onExit(null, 'menu'); return;
      case 'settings': this.showSettings(); return;
      case 'skiphint': this.hints = []; this.el.hint.style.display = 'none'; break;
      case 'startwave': { this.game.startWave(); break; } // the waveStart event plays the siren
      case 'dispatch': { this.game.dispatch(); break; } // the dispatch event plays the crowd
      case 'gas': case 'flash': {
        const kind = a === 'gas' ? 'gas' : 'flash';
        const r = this.game.canTearGas(kind);
        if (!r.ok) { this.toast(r.reason ?? 'Not available', 'bad'); this.sfx.play('deny'); break; }
        this.gasAim = !(this.gasAim && this.aimKind === kind); this.aimKind = kind; this.placing = null; this.view.showSockets = null;
        if (this.gasAim) this.toast(kind === 'gas' ? 'Tear gas: tap where it should land' : 'Flashbang: tap where it should land', 'info');
        break;
      }
      case 'rotl': case 'rotr': if (this.pending && this.placing) { this.pending.rot = (this.pending.rot + (a === 'rotl' ? 22.5 : -22.5) + 360) % 360; this.view.setGhost(this.placing, this.pending, this.game.canPlace(this.placing, this.pending.socket, this.pending.rot).ok); } break;
      case 'putdown': if (this.pending && this.placing) {
        const r = this.game.place(this.placing, this.pending.socket, this.pending.rot);
        if (r.ok) { this.sfx.play('place'); this.placing = null; this.pending = null; this.view.setGhost(null, null, false); this.view.showSockets = null; this.view.refreshSockets(this.game); }
        else { this.sfx.play('deny'); this.toast(r.reason ?? 'Not available', 'bad'); }
      } break;
      case 'cancel': this.pending = null; this.view.setGhost(null, null, false); this.gasAim = false; this.placing = null; this.view.showSockets = null; this.view.refreshSockets(this.game); break;
      case 'selall': this.view.selected = new Set(this.game.defenders().filter((d) => d.kind === 'security').map((d) => d.id)); break;
      case 'selsquad': this.view.selected = new Set(this.game.attackers().filter((u) => u.state === 'approach').map((d) => d.id)); break;
      case 'route': {
        const sp = this.map.entries.filter((e) => e.spawn); const i = sp.findIndex((e) => e.id === this.game.looterRoute);
        this.game.setLooterRoute(sp[(i + 1) % sp.length].id); break;
      }
    }
    this.refreshHud(true);
  }

  private cardDef(kind: DefKind | BuildKind) {
    this.sfx.play('click');
    if (kind === 'barrier' || kind === 'concrete' || kind === 'camera') {
      if (this.game.budget < BALANCE.defence.costs[kind]) { this.toast('Insufficient budget', 'bad'); this.sfx.play('deny'); return; }
      this.placing = this.placing === kind ? null : kind; this.pending = null; this.view.setGhost(null, null, false);
      this.view.showSockets = this.placing ? (id) => this.game.canPlace(this.placing!, id).ok : null;
      this.view.refreshSockets(this.game);
      if (this.placing) this.toast(`Tap a green socket to place the ${kind === 'concrete' ? 'concrete barrier (large sockets)' : kind}`, 'info');
    } else {
      const r = this.game.buyUnit(kind);
      if (r.ok) { this.sfx.play('buy'); const u = this.game.defenders()[this.game.defenders().length - 1]; this.view.selected = new Set([u.id]); this.toast(`${KIND_LABEL[kind]} ready at the van — tap the map to move it`, 'good'); }
    }
    this.refreshHud(true);
  }

  // ------------------------------------------------------------------ taps
  private onTap(p: Pick, _sx: number, _sy: number) {
    const g = this.game; const isDef = this.side === 'defence';
    if (g.over) return;
    if (this.gasAim && isDef) {
      this.gasAim = false;
      if (p.type === 'socket' || p.type === 'entry') { this.refreshHud(true); return; }
      const x = p.x, z = p.z;
      const r = g.throwGrenade(this.aimKind, x, z);
      if (r.ok) this.view.showDestination(x, z, null, 0xe8e4d8); else { this.toast(r.reason ?? 'Not available', 'bad'); this.sfx.play('deny'); }
      this.refreshHud(true); return;
    }
    if (this.placing && this.pending) {
      // turning the barrier: a tap anywhere points it there (any angle); the buttons turn it in steps and put it down
      if (p.type === 'socket' && p.id !== this.pending.socket) { const s = g.map.sockets.find((so) => so.id === p.id)!; this.pending = { socket: s.id, x: s.x, z: s.z, rot: this.pending.rot }; }
      else { const a = Math.atan2(-(p.z - this.pending.z), p.x - this.pending.x); this.pending.rot = Math.round(((a * 180) / Math.PI) / 5) * 5; }
      this.view.setGhost(this.placing, this.pending, g.canPlace(this.placing, this.pending.socket, this.pending.rot).ok);
      this.refreshHud(true); return;
    }
    if (this.placing) {
      if (p.type === 'socket' && this.placing !== 'camera') {
        const s = g.map.sockets.find((so) => so.id === p.id)!;
        if (!g.canPlace(this.placing, p.id).ok) { this.sfx.play('deny'); this.toast(g.canPlace(this.placing, p.id).reason ?? 'Not available', 'bad'); this.refreshHud(true); return; }
        this.pending = { socket: s.id, x: s.x, z: s.z, rot: s.rot };
        this.view.setGhost(this.placing, this.pending, true); this.sfx.play('click');
        this.toast('Turn it: tap where it should point, or use the arrows · then Place', 'info');
        this.refreshHud(true); return;
      }
      if (p.type === 'socket') {
        const r = g.place(this.placing, p.id);
        if (r.ok) { this.sfx.play('place'); this.placing = null; this.view.showSockets = null; }
        else this.sfx.play('deny');
        this.view.refreshSockets(g);
      } else { this.toast('Not a legal build socket — placement cancelled', 'bad'); this.placing = null; this.view.showSockets = null; this.view.refreshSockets(g); }
      this.refreshHud(true); return;
    }
    if (p.type === 'unit') {
      const u = g.unit(p.id); if (!u) return;
      if (isDef) {
        if (u.side === 'def') { this.toggleSelect(u.id); }
        else {
          const sel = [...this.view.selected];
          if (sel.length && g.orderEngage(sel, u.id).ok) { this.sfx.play('click'); this.view.showDestination(u.x, u.z, null, 0x36e0ff); this.toast('Intercept ordered', 'info'); }
          else this.toast(`${KIND_LABEL[u.kind]} · ${u.state}${u.carrying ? ` · carrying ${u.carrying}` : ''}`, 'info');
        }
      } else {
        if (u.side === 'att') this.toggleSelect(u.id);
        else this.toast(`AI ${KIND_LABEL[u.kind]} · ${u.state}`, 'info');
      }
    } else if (p.type === 'store') {
      if (isDef) { this.view.selectedStore = this.view.selectedStore === p.idx ? -1 : p.idx; if (this.view.selectedStore >= 0) this.infoCollapsed = false; }
      else {
        const sel = [...this.view.selected].filter((id) => g.unit(id)?.state === 'approach');
        if (sel.length) { if (g.retarget(sel, p.idx).ok) this.sfx.play('click'); }
        else { g.setLooterTarget(p.idx); this.view.highlightStore = p.idx; this.sfx.play('click'); }
      }
    } else if (p.type === 'entry') {
      if (!isDef) { g.setLooterRoute(p.id); this.sfx.play('click'); this.toast(`Route: ${this.map.entries.find((e) => e.id === p.id)!.name}`, 'info'); }
    } else if (p.type === 'fire') {
      const sel = [...this.view.selected];
      if (isDef && sel.length) { if (g.orderExtinguish(sel, p.id).ok) this.sfx.play('click'); }
      else this.toast('Fire — select a firefighter, then tap the fire', 'info');
    } else if (p.type === 'socket') {
      // sockets only pick while placing
    } else {
      const sel = [...this.view.selected];
      if (isDef && sel.length) {
        const first = g.unit(sel[0]);
        const path = first ? g.pathPreview(first.id, p.x, p.z) : null;
        const r = g.moveUnits(sel, p.x, p.z);
        if (r.ok) { this.movedOnce = true; this.view.showDestination(p.x, p.z, path, 0x36e0ff); this.sfx.play('click'); }
        else { this.view.showDestination(p.x, p.z, null, 0xff4a4a); this.sfx.play('deny'); }
      } else { this.view.selected.clear(); this.view.selectedStore = -1; }
    }
    this.refreshHud(true);
  }

  private toggleSelect(id: number) {
    if (this.view.selected.has(id) && this.view.selected.size === 1) this.view.selected.clear();
    else this.view.selected = new Set([id]);
    this.sfx.play('click');
  }

  // ------------------------------------------------------------------ events
  /** the core loop, ticked off as it happens: build -> start -> protect/plunder -> intercept/extract -> reward -> upgrade */
  cycle = [false, false, false, false, false, false];
  private cycleLabels() {
    return this.side === 'defence'
      ? ['Place defences', 'Start a wave', 'Protect a store', 'Intercept loot', 'Wave reward', 'Buy an upgrade']
      : ['Recruit a group', 'Dispatch', 'Loot a store', 'Extract the loot', 'Extraction reward', 'Buy an upgrade'];
  }
  private markCycle(i: number) { if (!this.cycle[i]) { this.cycle[i] = true; this.renderCycle(); } }
  renderCycle() {
    const done = this.cycle.filter(Boolean).length;
    this.el.cycle.innerHTML = `<small>GAME LOOP ${done}/6</small>` + this.cycleLabels().map((l, i) => `<div class="${this.cycle[i] ? 'done' : ''}">${this.cycle[i] ? '✔' : '○'} ${l}</div>`).join('');
    this.el.cycle.classList.toggle('complete', done === 6);
  }

  private trackCycle(e: GameEvent) {
    const d = this.side === 'defence';
    switch (e.type) {
      case 'purchase': this.markCycle(0); break;
      case 'waveStart': case 'dispatch': this.markCycle(1); break;
      case 'held': case 'intercept': if (d) this.markCycle(2); if (d && e.type === 'intercept') this.markCycle(3); break;
      case 'collect': case 'breach': if (!d) this.markCycle(2); break;
      case 'recovered': if (d) this.markCycle(3); break;
      case 'extract': if (!d) { this.markCycle(3); this.markCycle(4); } break;
      case 'waveEnd': if (d) this.markCycle(4); break;
      case 'upgrade': this.markCycle(5); break;
    }
  }

  /** where a sound at (x, z) sits for the listener: stereo position from the screen, quieter off-screen and zoomed out */
  private hear(x: number, z: number): Listener {
    const sc = this.view.toScreen(x, 0.8, z); const w = this.root.clientWidth || 1, h = this.root.clientHeight || 1;
    const pan = Math.max(-1, Math.min(1, (sc.x / w) * 2 - 1)) * 0.85;
    const out = Math.max(0, -sc.x, sc.x - w, -sc.y, sc.y - h) / Math.max(w, h); // how far off-screen (screen sizes)
    const zoom = Math.max(0.45, Math.min(1.15, 48 / this.view.dist));
    return { pan, gain: zoom * Math.max(0.25, 1 - out * 1.5) };
  }
  private updateAudio(dt: number) {
    const g = this.game;
    const near = (list: { x: number; z: number }[], max: number) => list.slice(0, max).map((p) => this.hear(p.x, p.z));
    const hammering = g.units.filter((u) => (u.state === 'barrier' || u.state === 'breach') && !u.moving);
    const hoses = g.units.filter((u) => u.kind === 'firefighter' && u.state === 'extinguish' && !u.moving);
    this.sfx.update(dt, {
      crowd: g.attackers().length,
      fires: near(g.fires.filter((f) => !f.out), 4),
      hammering: near(hammering, 4),
      hoses: near(hoses, 2),
      active: g.phase === 'wave' || g.phase === 'running',
      paused: this.paused || g.over,
      fountain: this.map.fountain ? this.hear(this.map.fountain.x, this.map.fountain.z) : null,
      gas: near(g.gas.filter((c) => c.landed && c.r > 0.5), 3),
      panic: (() => { const at = g.attackers(); if (!at.length) return 0; const p = at.filter((u) => u.gasT > 0.3 || u.state === 'flee' || u.state === 'held' || u.staggerUntil > g.time).length; return Math.min(1, p / Math.max(3, at.length * 0.6)); })(),
      smashing: hammering.length,
    });
  }

  private handleEvents(evs: GameEvent[]) {
    for (const e of evs) {
      this.trackCycle(e);
      switch (e.type) {
        case 'denied': this.toast(e.text, 'bad'); this.sfx.play('deny'); break;
        case 'intercept': this.sfx.play('intercept', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.buzz(20); if (e.x !== undefined) { this.view.fx.burst(e.x, e.z!, 'cyan'); this.view.floatText(e.x, e.z!, 'INTERCEPTED', 'cyan'); } break;
        case 'recovered': if (e.x !== undefined) this.sfx.play('recovered', this.hear(e.x, e.z!)); if (e.x !== undefined) this.view.floatText(e.x, e.z! + 0.6, `+${e.amount} recovered`, 'cyan'); break;
        case 'extract': this.sfx.play('extract', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); if (e.x !== undefined) this.view.floatText(e.x, e.z!, `−${e.amount} stock`, 'orange'); this.toast(e.text, this.side === 'defence' ? 'bad' : 'good'); break;
        case 'breach': this.buzz(60); if (e.x !== undefined) this.view.fx.event(`breach:${e.x}:${e.z}:${this.game.time.toFixed(1)}`, 'sparks', e.x, e.z!); this.sfx.play('breach', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.toast(e.text, this.side === 'defence' ? 'bad' : 'good'); break;
        case 'fire': this.sfx.play('fire', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.buzz([40, 40, 40]); this.toast(e.text, 'bad'); break;
        case 'impact': if (e.x !== undefined) this.view.fx.event(`impact:${e.id}`, 'explosion', e.x, e.z!); this.sfx.play('impact', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); break;
        case 'held': this.sfx.play(e.text === 'Baton strike' ? 'strike' : 'held', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); break;
        case 'waveStart': this.sfx.play('wave'); this.toast(e.text, 'info'); break;
        case 'waveEnd': this.sfx.play('win'); this.buzz(30); this.banner('WAVE SECURED', e.text); break;
        case 'supply': this.sfx.play('supply', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.toast(e.text, 'good'); if (e.x !== undefined) this.view.floatText(e.x, e.z!, `+${e.amount}`, 'cyan'); break;
        case 'won': if (!(this.side === 'defence' && this.sfx.victory())) this.sfx.play('win'); this.buzz([60, 60, 120]); break;
        case 'lost': this.sfx.play('lose'); this.buzz(250); break;
        case 'upgrade': this.sfx.play('upgrade'); this.toast(e.text, 'good'); break;
        case 'purchase': if (e.x !== undefined && e.amount) this.view.floatText(e.x, e.z!, `−${e.amount}`, 'muted'); break;
        case 'barrierBroken': this.sfx.play('barrierBroken', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.toast(e.text, 'info'); break;
        case 'extinguished': this.sfx.play('extinguished', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.toast(e.text, 'info'); break;
        case 'dispatch': this.sfx.play('dispatch'); this.toast(e.text, 'info'); break;
        case 'info': this.toast(e.text, 'info'); break;
        case 'gasThrow': this.sfx.play('gasThrow', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); break;
        case 'flashBang': this.sfx.play('flashBang', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); if (e.x !== undefined) this.view.flashBang(e.x, e.z!); this.buzz([30, 20, 80]); break;
        case 'throwBack': this.sfx.play('throwBack', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); if (this.side === 'defence') this.toast(e.text, 'bad'); break;
        case 'gasLand': this.sfx.play('gasLand', e.x !== undefined ? this.hear(e.x, e.z!) : undefined); this.buzz(40); break;
        case 'alarm': if (this.side === 'defence') { this.toast(e.text, 'bad'); if (e.x !== undefined) this.view.showDestination(e.x, e.z!, null, 0xff4a3a); this.sfx.play('deny'); } break;
        case 'collect': if (e.x !== undefined) this.sfx.play('collect', this.hear(e.x, e.z!)); break;
        case 'release': if (e.x !== undefined) this.sfx.play('release', this.hear(e.x, e.z!)); break;
      }
    }
  }

  /** a short enlarged look at the figure just added to the group (pointer-transparent: never blocks the next tap) */
  private recruitPop: HTMLDivElement | null = null; private recruitT = 0;
  private showRecruit(img: string | null, label: string) {
    if (!img) return;
    if (!this.recruitPop) { this.recruitPop = document.createElement('div'); this.recruitPop.className = 'recruit-pop'; this.root.appendChild(this.recruitPop); }
    const el = this.recruitPop; el.innerHTML = `<img src="${img}" alt=""><b>${label}</b><small>+1 · ${this.game.squad.length}</small>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(this.recruitT); this.recruitT = window.setTimeout(() => el.classList.remove('show'), 1100);
  }

  toast(text: string, kind: 'good' | 'bad' | 'info') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = text;
    this.el.toasts.prepend(t);
    while (this.el.toasts.children.length > 4) this.el.toasts.lastChild!.remove();
    setTimeout(() => t.classList.add('fade'), 2600); setTimeout(() => t.remove(), 3300);
  }

  private banner(title: string, text: string) {
    const b = document.createElement('div'); b.className = 'banner'; b.innerHTML = `<b>${title}</b><p>${text}</p>`;
    this.root.appendChild(b); setTimeout(() => b.remove(), 3200);
  }

  // ------------------------------------------------------------------ hints
  private setupHints() {
    if (!this.tutorial || !this.settings.showHints) { this.el.hint.style.display = 'none'; return; }
    if (this.side === 'defence') this.hints = [
      { title: 'BUILD A BARRIER', text: 'Spend budget to slow one approach: tap the Barrier card, then a green socket.', done: (m) => m.game.barriers.length > 0 },
      { title: 'ADD CAMERA COVERAGE', text: 'Cameras detect offenders sooner and extend your teams\' response range. Tap Camera, then a socket.', done: (m) => m.game.cameras.length > 0 },
      { title: 'MOVE THE RESERVE', text: 'Tap your security team (cyan ring), then tap the ground near a store.', done: (m) => m.movedOnce },
      { title: 'UPGRADE THE STOREFRONT', text: 'Tap a store label, then Upgrade shutter. Level 2 adds 60 structure.', done: (m) => m.game.stores.some((s) => s.shutterLevel > 1) },
      { title: 'START THE WAVE', text: 'Orange arrows mark where offenders will enter. Press Start wave when ready.', done: (m) => m.game.phase === 'wave' || m.game.wave > 1 },
      { title: 'HOLD THE DISTRICT', text: 'Teams intercept detected offenders automatically. Loaded carriers are slower — only extracted goods are lost.', done: (m) => m.game.wave > 1 },
    ];
    else this.hints = [
      { title: 'CHOOSE A TARGET', text: 'Tap one of the three stores to mark it as your target.', done: (m) => m.game.looterTarget >= 0 },
      { title: 'CHOOSE A ROUTE', text: 'Tap an orange arrow (or Route) to pick the approach and extraction route.', done: (m) => m.game.looterRoute !== m.map.entries[0].id || m.game.squad.length > 0 },
      { title: 'RECRUIT A GROUP', text: 'Recruit runners and carriers. Carriers are slower but hold more.', done: (m) => m.game.squad.length > 0 || m.game.attackers().length > 0 },
      { title: 'DISPATCH', text: 'Press Dispatch. You can retarget approaching units by selecting them and tapping another store.', done: (m) => m.game.attackers().length > 0 || m.game.extracted > 0 },
      { title: 'ESCAPE WITH THE LOOT', text: `Carriers move slower when loaded. Only extracted goods count — reach ${this.game.lootTarget}.`, done: (m) => m.game.extracted > 0 },
    ];
  }

  private updateHint() {
    if (!this.hints.length) return;
    while (this.hintIdx < this.hints.length && this.hints[this.hintIdx].done(this)) this.hintIdx++;
    if (this.hintIdx >= this.hints.length) { this.el.hint.style.display = 'none'; return; }
    const hnt = this.hints[this.hintIdx];
    (this.el.hint.querySelector('b') as HTMLElement).textContent = hnt.title;
    (this.el.hint.querySelector('p') as HTMLElement).textContent = hnt.text;
  }

  // ------------------------------------------------------------------ HUD refresh
  refreshHud(full: boolean) {
    const g = this.game; const isDef = this.side === 'defence';
    this.el.budget.textContent = g.budget.toLocaleString('en');
    if (isDef) {
      this.el.wave.textContent = `${Math.min(g.wave, BALANCE.defence.waves)} / ${BALANCE.defence.waves}${g.phase === 'prep' ? ' · prep' : ''}`;
      this.el.obj.textContent = `${g.storesWithStock()} / ${g.stores.length} (need ${BALANCE.defence.storesNeededToWin})`;
    } else {
      const t = Math.ceil(g.timeLeft); this.el.wave.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
      this.el.obj.textContent = `${g.extracted} / ${g.lootTarget}`;
    }
    this.el.pausebox.style.display = this.paused ? 'block' : 'none';
    // cards affordability
    this.el.cards.querySelectorAll<HTMLButtonElement>('.card').forEach((c) => {
      const k = c.dataset.kind!;
      const cost = isDef ? BALANCE.defence.costs[k as keyof typeof BALANCE.defence.costs] : BALANCE.looters.costs[k as AttKind];
      c.disabled = g.budget < cost || g.over;
      c.classList.toggle('active', this.placing === k);
    });
    this.updateHint();
    if (!full) { this.refreshDynamicInfo(); return; }
    this.renderActions(); this.renderInfo();
    // entry arrows: incoming wave (defence) or selectable routes (looters)
    if (isDef) this.view.setEntryArrows(g.phase === 'prep' ? g.nextWavePlan.entries : null, '#ff8a2a');
    else {
      this.view.setEntryArrows(this.map.entries.filter((e) => e.spawn).map((e) => e.id), '#ff8a2a', g.looterRoute);
      this.view.highlightStore = g.looterTarget;
      if (g.looterTarget >= 0) {
        const e = this.map.entries.find((en) => en.id === g.looterRoute)!;
        const door = g.stores[g.looterTarget].door;
        const inP = g.nav.findPath({ x: e.x, z: e.z }, door, 'att');
        this.view.setRouteLines(inP ? [{ pts: inP, color: 0xff9a2e }] : []);
      } else this.view.setRouteLines([]);
    }
  }

  private lastPhase = '';

  private refreshDynamicInfo() {
    const dyn = this.el.info.querySelector('[data-dyn]');
    if (dyn) dyn.innerHTML = this.dynInfo();
    if (this.side === 'defence') {
      const gb = this.el.actions.querySelector<HTMLButtonElement>('[data-gas]');
      if (gb) { const left = Math.ceil(this.game.gasReadyAt - this.game.time); gb.disabled = this.game.phase !== 'wave' || left > 0 || this.game.budget < BALANCE.tearGas.cost; gb.textContent = left > 0 ? `Tear gas · ${left} s` : `Tear gas · ${BALANCE.tearGas.cost}`; }
      const fb = this.el.actions.querySelector<HTMLButtonElement>('[data-flash]');
      if (fb) { const left = Math.ceil(this.game.flashReadyAt - this.game.time); fb.disabled = this.game.phase !== 'wave' || left > 0 || this.game.budget < BALANCE.flashBang.cost; fb.textContent = left > 0 ? `Flashbang · ${left} s` : `Flashbang · ${BALANCE.flashBang.cost}`; }
      const sw = this.el.actions.querySelector<HTMLButtonElement>('[data-a="startwave"]');
      if (sw) sw.disabled = this.game.phase !== 'prep';
      const inc = this.el.actions.querySelector('[data-inc]'); if (inc) inc.innerHTML = this.incomingHtml();
      if (this.game.phase !== this.lastPhase) { this.lastPhase = this.game.phase; this.refreshHud(true); }
    } else {
      const sq = this.el.actions.querySelector('[data-squad]'); if (sq && sq.childElementCount !== this.game.squad.length) this.renderActions();
    }
  }

  private incomingHtml() {
    const g = this.game;
    if (g.phase !== 'prep') return `<small>WAVE ${g.wave} IN PROGRESS</small><div>${g.attackers().length + g.spawnQueue.length} offenders remaining</div>`;
    const counts = new Map<string, number>(); for (const k of g.nextWavePlan.kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
    const ents = g.nextWavePlan.entries.map((id) => this.map.entries.find((e) => e.id === id)!.name).join(', ');
    return `<small>INCOMING · WAVE ${g.wave}</small><div class="chips">${[...counts].map(([k, n]) => `<span class="chip k-${k}">${n}× ${KIND_LABEL[k as AttKind]}</span>`).join('')}</div><div class="from">from ${ents}</div>`;
  }

  private renderActions() {
    const g = this.game; const a = this.el.actions;
    if (this.side === 'defence') {
      a.innerHTML = `<div class="incoming" data-inc>${this.incomingHtml()}</div>
        ${this.pending ? `<div class="btnrow rotrow"><button data-a="rotl" aria-label="Turn left">⟲</button><span class="rotdeg">${Math.round(((this.pending.rot % 360) + 360) % 360)}°</span><button data-a="rotr" aria-label="Turn right">⟳</button><button class="primary" data-a="putdown">Place</button></div>` : ''}
        <div class="btnrow">${this.placing ? '<button data-a="cancel">Cancel placement</button>' : ''}${this.gasAim ? `<button data-a="cancel">${this.aimKind === 'gas' ? 'Cancel tear gas' : 'Cancel flashbang'}</button>` : ''}<button data-a="selall">Select all security</button>
        <button class="gas ${this.gasAim && this.aimKind === 'gas' ? 'active' : ''}" data-a="gas" data-gas ${g.phase !== 'wave' ? 'disabled' : ''}>Tear gas · ${BALANCE.tearGas.cost}</button>
        <button class="gas ${this.gasAim && this.aimKind === 'flash' ? 'active' : ''}" data-a="flash" data-flash ${g.phase !== 'wave' ? 'disabled' : ''}>Flashbang · ${BALANCE.flashBang.cost}</button>
        <button class="primary" data-a="startwave" ${g.phase !== 'prep' ? 'disabled' : ''}>Start wave ${Math.min(g.wave, BALANCE.defence.waves)}</button></div>`;
    } else {
      const tgt = g.looterTarget >= 0 ? g.stores[g.looterTarget] : null;
      const route = this.map.entries.find((e) => e.id === g.looterRoute)!;
      a.innerHTML = `<div class="squad"><small>GROUP (${g.squad.length})</small><div data-squad class="chips">${g.squad.map((k, i) => `<button class="chip k-${k}" data-rm="${i}">${KIND_LABEL[k]} ✕</button>`).join('') || '<span class="muted">Recruit units with the cards</span>'}</div></div>
        <div class="tgt"><small>TARGET</small><b>${tgt ? `${tgt.name} · stock ${tgt.stock}` : 'Tap a store'}</b></div>
        <div class="tgt"><small>ROUTE</small><button data-a="route">${route.name} ⟳</button></div>
        <div class="btnrow"><button data-a="selsquad">Select approaching</button><button class="primary" data-a="dispatch" ${g.squad.length && tgt ? '' : 'disabled'}>Dispatch</button></div>`;
      a.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach((b) => b.addEventListener('click', () => { g.unrecruit(Number(b.dataset.rm)); this.refreshHud(true); }));
    }
    a.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => b.addEventListener('click', () => this.action(b.dataset.a!, b)));
  }

  private dynInfo(): string {
    const g = this.game;
    const sel = [...this.view.selected].map((id) => g.unit(id)).filter(Boolean);
    let s = '';
    if (sel.length) {
      const u = sel[0]!;
      s += `<div class="selrow"><b>${sel.length > 1 ? `${sel.length} units` : KIND_LABEL[u.kind]}</b> · ${u.state}${u.carrying ? ` · carrying ${u.carrying}` : ''}${u.side === 'att' && u.state === 'approach' ? ` → ${g.stores[u.targetStore].name}` : ''}</div>`;
    }
    if (this.view.selectedStore >= 0 && this.side === 'defence') {
      const st = g.stores[this.view.selectedStore];
      s += `<div class="selrow"><b>${st.name}</b> · structure ${Math.ceil(st.structure)}/${st.maxStructure} · stock ${st.stock}${st.reserved ? ` (${st.reserved} being carried off)` : ''} · shutter L${st.shutterLevel}</div>`;
    }
    return s || '<div class="muted">Tap a unit or store for details.</div>';
  }

  infoCollapsed = true;

  private renderInfo() {
    const g = this.game; const i = this.el.info;
    i.classList.toggle('collapsed', this.infoCollapsed);
    let html = `<button class="infotoggle" data-tog>${this.infoCollapsed ? 'Details & upgrades ▾' : 'Hide ▴'}</button><div data-dyn>${this.dynInfo()}</div>`;
    if (this.side === 'defence') {
      const si = this.view.selectedStore;
      if (si >= 0) {
        const st = g.stores[si]; const nx = g.shutterNext(si);
        html += `<div class="upg"><small>SHUTTER · ${st.name.toUpperCase()}</small><div>Level ${st.shutterLevel}: max ${st.maxStructure} structure</div>${nx ? `<div class="next">Next: level ${nx.level} → max ${st.maxStructure + nx.addCapacity} (+${nx.addCapacity}, repairs only the added capacity)</div><button data-u="shutter" ${g.budget < nx.cost ? 'disabled' : ''}>Upgrade shutter · ${nx.cost}</button>` : '<div class="next">Maximum level</div>'}
          <div>Boards ${Math.ceil(st.boards)}/${st.boardsMax} · protection layer (does not repair)</div>
          <button data-u="boards" ${g.budget < BALANCE.defence.costs.boards || st.boards >= st.boardsMax ? 'disabled' : ''}>Board up · ${BALANCE.defence.costs.boards}<br><small>absorbs ${st.boardsMax} damage before the shutter</small></button>
          <button data-u="repair" ${g.budget < BALANCE.defence.costs.repair || st.structure >= st.maxStructure || g.phase !== 'prep' ? 'disabled' : ''}>Repair glass & shutter · ${BALANCE.defence.costs.repair}<br><small>between waves · stock is not refilled</small></button></div>`;
      }
      const tr = BALANCE.upgrades.securityTraining, sp = BALANCE.upgrades.securitySpec;
      html += `<div class="upg"><small>SECURITY TEAMS</small>`;
      if (!g.securityTrained) html += `<div>Level 1 · speed ${BALANCE.units.security.speed} m/s · restraint ${BALANCE.units.security.restrainTime}s</div><div class="next">Level 2: speed ${(BALANCE.units.security.speed * tr.speedMul).toFixed(1)} m/s · restraint ${(BALANCE.units.security.restrainTime * tr.restrainMul).toFixed(1)}s · unlocks specialisation</div><button data-u="train" ${g.budget < tr.cost ? 'disabled' : ''}>Train to level 2 · ${tr.cost}</button>`;
      else if (g.securitySpec === 'none') html += `<div>Level 2 · choose one specialisation</div><button data-u="mobile" ${g.budget < sp.cost ? 'disabled' : ''}>Mobile response · ${sp.cost}<br><small>+20% speed, +${sp.mobile.sightAdd} m response</small></button><button data-u="fixed" ${g.budget < sp.cost ? 'disabled' : ''}>Fixed protection · ${sp.cost}<br><small>40% faster restraint near post</small></button>`;
      else html += `<div>Level 2 · ${g.securitySpec === 'mobile' ? 'Mobile response' : 'Fixed protection'}</div>`;
      html += `</div><div class="upg"><small>CAMERAS (${g.cameras.length})</small>`;
      if (g.cameraSpec === 'none') html += `<div>Radius ${BALANCE.camera.radius} m · detection ${BALANCE.camera.detectDelay}s</div><button data-u="wide" ${g.budget < BALANCE.upgrades.cameraSpec.cost || !g.cameras.length ? 'disabled' : ''}>Wider coverage · ${BALANCE.upgrades.cameraSpec.cost}<br><small>radius → ${BALANCE.camera.wideRadius} m</small></button><button data-u="fast" ${g.budget < BALANCE.upgrades.cameraSpec.cost || !g.cameras.length ? 'disabled' : ''}>Faster detection · ${BALANCE.upgrades.cameraSpec.cost}<br><small>${BALANCE.camera.detectDelay}s → ${BALANCE.camera.fastDelay}s</small></button>`;
      else html += `<div>${g.cameraSpec === 'wide' ? `Wide coverage · radius ${BALANCE.camera.wideRadius} m` : `Fast detection · ${BALANCE.camera.fastDelay}s`}</div>`;
      html += `</div>`;
    } else {
      const lc = BALANCE.looters.upgradeCost;
      html += `<div class="upg"><small>GROUP UPGRADE (choose one)</small>`;
      if (g.looterUpgrade === 'none') html += `<button data-u="capacity" ${g.budget < lc ? 'disabled' : ''}>Carrying capacity · ${lc}<br><small>carrier ${BALANCE.units.carrier.capacity} → ${Math.round(BALANCE.units.carrier.capacity * BALANCE.looters.capacityUpgrade)}</small></button><button data-u="speedup" ${g.budget < lc ? 'disabled' : ''}>Speed · ${lc}<br><small>carrier ${BALANCE.units.carrier.speed} → ${(BALANCE.units.carrier.speed * BALANCE.looters.speedUpgrade).toFixed(2)} m/s</small></button>`;
      else html += `<div>${g.looterUpgrade === 'capacity' ? 'Capacity +30%' : 'Speed +15%'} active</div>`;
      html += `<div class="muted">Each extracted stock point earns ${BALANCE.looters.budgetPerExtractedStock} budget.</div></div>`;
      const tg = g.looterTarget >= 0 ? g.stores[g.looterTarget] : null;
      if (tg) html += `<div class="upg"><small>TARGET STORE</small><div>${tg.name}: structure ${Math.ceil(tg.structure)}/${tg.maxStructure} · stock ${tg.stock}</div></div>`;
    }
    i.innerHTML = html;
    i.querySelector('[data-tog]')!.addEventListener('click', () => { this.infoCollapsed = !this.infoCollapsed; this.renderInfo(); });
    i.querySelectorAll<HTMLButtonElement>('[data-u]').forEach((b) => b.addEventListener('click', () => {
      const u = b.dataset.u!; let r;
      if (u === 'shutter') r = g.upgradeShutter(this.view.selectedStore);
      else if (u === 'boards') r = g.boardUp(this.view.selectedStore);
      else if (u === 'repair') r = g.repairStore(this.view.selectedStore);
      else if (u === 'train') r = g.upgradeSecurity();
      else if (u === 'mobile' || u === 'fixed') r = g.chooseSecuritySpec(u);
      else if (u === 'wide' || u === 'fast') r = g.chooseCameraSpec(u);
      else if (u === 'capacity') r = g.looterUpgradeChoose('capacity');
      else if (u === 'speedup') r = g.looterUpgradeChoose('speed');
      if (r?.ok) this.sfx.play('upgrade');
      this.refreshHud(true);
    }));
  }

  // ------------------------------------------------------------------ settings & result
  private showSettings() {
    const m = this.el.modal; this.paused = true;
    m.classList.remove('hidden');
    m.innerHTML = `<div class="panel"><h2>Settings</h2>
      <label>Volume <input type="range" min="0" max="1" step="0.05" value="${this.settings.volume}" data-s="vol"></label>
      <label>Music <input type="range" min="0" max="1" step="0.05" value="${this.settings.music ?? 0.5}" data-s="mus"></label>
      <label><input type="checkbox" ${this.settings.reducedFx ? 'checked' : ''} data-s="fx"> Mobile quality — lighter: no reflections, glow or shadows (applies on restart)</label>
      <label><input type="checkbox" ${this.settings.showHints ? 'checked' : ''} data-s="hints"> Show tutorial tips</label>
      <label>HUD size <select data-s="ui">${[[1, '100%'], [1.15, '115%'], [1.3, '130%']].map(([v, l]) => `<option value="${v}" ${Number(this.settings.uiScale || 1) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label><input type="checkbox" ${this.settings.vibration ? 'checked' : ''} data-s="vib"> Vibrate on events</label>
      <p class="muted">Controls: drag to pan · wheel / pinch to zoom · tap a unit, then the ground to move · P pause · WASD pan.</p>
      <div class="btnrow"><button class="primary" data-s="close">Resume</button></div></div>`;
    m.querySelector<HTMLInputElement>('[data-s="mus"]')!.addEventListener('input', (e) => { this.settings.music = Number((e.target as HTMLInputElement).value); music.setVolume(this.settings.music); this.onSettings?.(); });
    m.querySelector<HTMLInputElement>('[data-s="vol"]')!.addEventListener('input', (e) => { this.settings.volume = Number((e.target as HTMLInputElement).value); this.sfx.volume = this.settings.volume; this.onSettings?.(); });
    m.querySelector<HTMLInputElement>('[data-s="fx"]')!.addEventListener('change', (e) => { this.settings.reducedFx = (e.target as HTMLInputElement).checked; this.onSettings?.(); });
    m.querySelector<HTMLInputElement>('[data-s="hints"]')!.addEventListener('change', (e) => { this.settings.showHints = (e.target as HTMLInputElement).checked; this.el.hint.style.display = this.settings.showHints && this.hints.length ? '' : 'none'; this.onSettings?.(); });
    m.querySelector<HTMLSelectElement>('[data-s="ui"]')!.addEventListener('change', (e) => { this.settings.uiScale = Number((e.target as HTMLSelectElement).value); this.root.style.setProperty('--ui-scale', String(this.settings.uiScale)); this.onSettings?.(); });
    m.querySelector<HTMLInputElement>('[data-s="vib"]')!.addEventListener('change', (e) => { this.settings.vibration = (e.target as HTMLInputElement).checked; this.buzz(30); this.onSettings?.(); });
    m.querySelector('[data-s="close"]')!.addEventListener('click', () => { m.classList.add('hidden'); this.paused = false; });
  }
  onSettings: (() => void) | null = null;

  resultInfo: ((r: MatchResult) => { unlocked: string[]; research: number; specs: string[] }) | null = null;

  private showResult() {
    const g = this.game; const r = g.result!;
    const res: MatchResult = { won: g.phase === 'won', title: r.title, detail: r.detail, research: r.research, side: this.side, cityId: this.map.id, extracted: g.extracted, storesHeld: r.storesHeld, intercepted: g.intercepted };
    const extra = this.resultInfo?.(res) ?? { unlocked: [], research: 0, specs: [] };
    const m = this.el.modal; m.classList.remove('hidden');
    const isDef = this.side === 'defence';
    m.innerHTML = `<div class="panel result ${res.won ? 'won' : 'lost'}"><h2>${res.won ? 'VICTORY' : 'DEFEAT'} — ${r.title}</h2><p>${r.detail}</p>
      <ul class="stats">
        ${isDef ? `<li>Stores holding stock: <b>${r.storesHeld} / ${g.stores.length}</b></li><li>Waves cleared: <b>${g.wavesCleared} / ${BALANCE.defence.waves}</b></li><li>Stock lost (extracted): <b>${g.extracted}</b></li>` : `<li>Stock extracted: <b>${g.extracted} / ${g.lootTarget}</b></li><li>Time used: <b>${Math.floor(g.time / 60)}:${String(Math.floor(g.time % 60)).padStart(2, '0')}</b></li>`}
        <li>Interceptions: <b>${g.intercepted}</b> · goods recovered: <b>${g.recovered}</b></li>
        <li>Research points earned: <b>+${r.research}</b> (total ${extra.research})</li>
        ${extra.specs.length ? `<li>Specialisations used: <b>${extra.specs.join(', ')}</b></li>` : ''}
        ${extra.unlocked.length ? `<li class="unlock">Unlocked: <b>${extra.unlocked.join(', ')}</b></li>` : ''}
      </ul>
      <div class="btnrow"><button data-r="restart">Restart</button><button data-r="menu">Menu</button>${extra.unlocked.length ? '<button class="primary" data-r="next">Next city</button>' : ''}</div></div>`;
    m.querySelectorAll<HTMLButtonElement>('[data-r]').forEach((b) => b.addEventListener('click', () => this.onExit(res, b.dataset.r as 'menu' | 'restart' | 'next')));
  }
}
