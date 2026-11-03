import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import type { Game, Unit } from '../sim/game';
import type { MapDef, Vec2 } from '../maps/types';
import { buildBarrierModel, buildMastModel, buildWorld, buildTruck, skyTexture, type WorldHandles } from './world';
import { type Pose } from './humans';
import { Effects } from './effects';
import { Post } from './post';
import { cloneModel, slotStatus } from './assets';
import { IncendiaryPool } from './thrown';
import { createCharacter, type CharacterVisual } from './character';
import { buildWetStreet } from './wet';
import { groundTexture } from './textures';
import type { Reflector } from 'three/addons/objects/Reflector.js';
import { arrowTexture } from './textures';
import { BALANCE } from '../config/balance';

export type Pick =
  | { type: 'unit'; id: number; x: number; z: number }
  | { type: 'store'; idx: number; x: number; z: number }
  | { type: 'socket'; id: string; x: number; z: number }
  | { type: 'entry'; id: string; x: number; z: number }
  | { type: 'fire'; id: number; x: number; z: number }
  | { type: 'ground'; x: number; z: number };

export interface ViewInput {
  onTap(p: Pick, sx: number, sy: number): void;
}

const PITCH = THREE.MathUtils.degToRad(40); // oblique view of images 02/03: shopfronts readable, fountain in the middle

export class MatchView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly world: WorldHandles;
  readonly fx: Effects;
  target = new THREE.Vector2();
  dist = 50;
  private minDist = 13; private maxDist = 78;
  private humans = new Map<number, CharacterVisual>();
  private barriers = new Map<number, THREE.Group>();
  private masts = new Map<number, THREE.Object3D>();
  private dropMarkers = new Map<number, THREE.Group>();
  private tmpV = new THREE.Vector3();
  private npcVis = new Map<number, CharacterVisual>();
  private projPool!: IncendiaryPool;
  private truck: THREE.Group | null = null;
  private rings = new Map<number, THREE.Mesh>();
  private ringGeo = new THREE.RingGeometry(0.55, 0.68, 32).rotateX(-Math.PI / 2);
  private ringMatDef = new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: 0.95, depthWrite: false });
  private ringMatAtt = new THREE.MeshBasicMaterial({ color: 0xff9a2e, transparent: true, opacity: 0.95, depthWrite: false });
  private destMarker: THREE.Mesh;
  private destT = 0;
  private pathLine: THREE.Line;
  private routeLines: THREE.Group = new THREE.Group();
  private socketMarkers = new THREE.Group();
  /** faint permanent build-spot markers shown during the preparation phase */
  private idleSockets = new THREE.Group();
  private entryArrows = new THREE.Group();
  private coverage = new THREE.Group();
  private overlay: HTMLDivElement;
  private storeLabels: HTMLDivElement[] = [];
  private bars = new Map<string, HTMLDivElement>();
  private floaters: { el: HTMLDivElement; x: number; z: number; t: number }[] = [];
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private pointers = new Map<number, { x: number; y: number; sx: number; sy: number }>();
  private dragging = false; private pinchDist = 0; private lastMid: { x: number; y: number } | null = null;
  private time = 0;
  selected = new Set<number>();
  selectedStore = -1;
  highlightStore = -1;
  showSockets: null | ((id: string) => boolean) = null;
  private disposed = false;
  private post: Post | null = null;
  private wet: Reflector | null = null;
  private keys = new Set<string>();

  constructor(readonly container: HTMLElement, readonly map: MapDef, readonly side: 'defence' | 'looters', private input: ViewInput, readonly reducedFx: boolean) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !reducedFx, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedFx ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.42;
    this.renderer.shadowMap.enabled = !reducedFx; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'game-canvas';
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.5, 400);
    const pm = new THREE.PMREMGenerator(this.renderer);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = env; this.scene.environmentIntensity = 0.25;
    // blue-hour HDRI (tools/make_hdri.py) replaces the neutral room environment once loaded
    new HDRLoader().loadAsync('env/blue_hour.hdr').then((hdr) => {
      if (this.disposed) return;
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const t = pm.fromEquirectangular(hdr).texture; hdr.dispose();
      this.scene.environment = t; this.scene.environmentIntensity = 0.55;
    }).catch(() => { /* keep fallback */ });
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0x1a2440, 70, 190);
    this.scene.add(new THREE.HemisphereLight(0x8a9ac8, 0x4a3e30, 0.85)); // blue-hour sky, cool wet ground bounce
    const moon = new THREE.DirectionalLight(0xa9bcff, 0.7);
    moon.position.set(-30, 60, 25); moon.target.position.set(0, 0, 0);
    moon.castShadow = !reducedFx; (moon.shadow as THREE.LightShadow & { intensity: number }).intensity = 0.7; // soft, subtle shadows moon.shadow.mapSize.set(2048, 2048);
    const sc = moon.shadow.camera; sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 10; sc.far = 160; moon.shadow.bias = -0.0005;
    this.scene.add(moon, moon.target);
    this.world = buildWorld(map, this.scene, reducedFx);
    if (!reducedFx) {
      this.wet = buildWetStreet(map.bounds, groundTexture(map.ground), container.clientWidth || 1280, container.clientHeight || 720);
      this.scene.add(this.wet);
      this.post = new Post(this.renderer, this.scene, this.camera);
    }
    this.fx = new Effects(this.scene, reducedFx);
    this.projPool = new IncendiaryPool(this.scene, reducedFx ? BALANCE.throw.maxActive.mobile : BALANCE.throw.maxActive.desktop);
    this.destMarker = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.75, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: 0.0, depthWrite: false }));
    this.destMarker.position.y = 0.05; this.scene.add(this.destMarker);
    this.pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0x36e0ff, dashSize: 0.5, gapSize: 0.35, transparent: true, opacity: 0.9 }));
    this.scene.add(this.pathLine, this.routeLines, this.socketMarkers, this.entryArrows, this.coverage, this.idleSockets);
    if (side === 'defence') {
      const plate = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.22, depthWrite: false });
      for (const so of map.sockets) {
        const geo = so.size === 'large' ? new THREE.RingGeometry(1.45, 1.6, 4, 1, Math.PI / 4) : new THREE.RingGeometry(0.62, 0.72, 24);
        const mk = new THREE.Mesh(geo.rotateX(-Math.PI / 2), plate); mk.position.set(so.x, 0.07, so.z); if (so.rot === 90) mk.rotation.y = Math.PI / 2;
        this.idleSockets.add(mk);
      }
    }
    this.target.set(map.camera.x, map.camera.z); this.dist = map.camera.dist;
    // overlay for labels/bars
    this.overlay = document.createElement('div'); this.overlay.className = 'overlay-layer'; container.appendChild(this.overlay);
    map.stores.forEach((s, i) => {
      const el = document.createElement('div'); el.className = 'store-label';
      el.innerHTML = `<svg class="sl-shield" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1.5 22 5v8.2c0 6.3-4.3 10.9-10 13.3C6.3 24.1 2 19.5 2 13.2V5z"/><path class="sl-check" d="M7.5 13.5l3.2 3.2 5.8-6.4"/></svg><div class="sl-name">${s.name.toUpperCase()}</div><div class="bar struct"><i></i></div><div class="bar stock"><i></i></div><div class="sl-num"></div>`;
      el.setAttribute('aria-label', s.name);
      el.addEventListener('pointerup', (e) => { e.stopPropagation(); this.input.onTap({ type: 'store', idx: i, x: s.front.x, z: s.front.z }, e.clientX, e.clientY); });
      el.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.overlay.appendChild(el); this.storeLabels.push(el);
    });
    this.bindInput();
    this.resize();
    if (container.clientWidth < container.clientHeight) this.dist = Math.min(this.maxDist, map.camera.dist * 1.7);
    window.addEventListener('resize', this.resize);
  }

  resize = () => {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    const pr = this.renderer.getPixelRatio();
    this.post?.setSize(w, h, pr);
    this.wet?.getRenderTarget().setSize(Math.round(w * pr * 0.5), Math.round(h * pr * 0.5));
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.maxDist = w < h ? 110 : 78;
    this.fx.setViewport(h);
  };

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown); window.removeEventListener('keyup', this.onKeyUp);
    this.post?.dispose(); this.wet?.dispose(); this.fx.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove(); this.overlay.remove();
  }

  // ------------------------------------------------------------------ camera
  private clampCamera() {
    const b = this.map.bounds;
    this.dist = THREE.MathUtils.clamp(this.dist, this.minDist, this.maxDist);
    this.target.x = THREE.MathUtils.clamp(this.target.x, b.x0 + 4, b.x1 - 4);
    this.target.y = THREE.MathUtils.clamp(this.target.y, b.z0 + 6, b.z1 - 2);
  }
  private updateCamera() {
    this.clampCamera();
    const t = this.target;
    this.camera.position.set(t.x, Math.sin(PITCH) * this.dist, t.y + Math.cos(PITCH) * this.dist);
    this.camera.lookAt(t.x, 0, t.y);
  }
  zoomBy(f: number) { this.dist *= f; this.clampCamera(); }
  focus(x: number, z: number) { this.target.set(x, z); }

  groundAt(sx: number, sy: number): Vec2 | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((sx - r.left) / r.width) * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, p) ? { x: p.x, z: p.z } : null;
  }

  toScreen(x: number, y: number, z: number): { x: number; y: number; behind: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height, behind: v.z > 1 };
  }

  // ------------------------------------------------------------------ input
  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.key.toLowerCase()); if (e.key === '+' || e.key === '=') this.zoomBy(0.9); if (e.key === '-') this.zoomBy(1.1); };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };

  private bindInput() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
    window.addEventListener('keydown', this.onKeyDown); window.addEventListener('keyup', this.onKeyUp);
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      if (this.pointers.size === 1) this.dragging = false;
      if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y); this.lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; this.dragging = true; }
    });
    el.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId); if (!p) return;
      const px = p.x, py = p.y; p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size === 1) {
        if (!this.dragging && Math.hypot(p.x - p.sx, p.y - p.sy) > 9) this.dragging = true;
        if (this.dragging) this.panScreen(px, py, p.x, p.y);
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinchDist > 0) this.dist *= this.pinchDist / d;
        this.pinchDist = d;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (this.lastMid) this.panScreen(this.lastMid.x, this.lastMid.y, mid.x, mid.y);
        this.lastMid = mid;
        this.clampCamera();
      }
    });
    const up = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId); if (!p) return;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) {
        if (!this.dragging) this.input.onTap(this.pick(e.clientX, e.clientY), e.clientX, e.clientY);
        this.dragging = false; this.lastMid = null; this.pinchDist = 0;
      } else if (this.pointers.size === 1) { this.lastMid = null; this.pinchDist = 0; }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  private panScreen(x0: number, y0: number, x1: number, y1: number) {
    const a = this.groundAt(x0, y0), b = this.groundAt(x1, y1);
    if (!a || !b) return;
    this.target.x -= b.x - a.x; this.target.y -= b.z - a.z;
    this.updateCamera();
  }

  /** screen-space picking with generous touch targets */
  pick(sx: number, sy: number): Pick {
    const r = this.renderer.domElement.getBoundingClientRect();
    const lx = sx - r.left, ly = sy - r.top;
    const near = (x: number, y: number, z: number, rad: number) => { const s = this.toScreen(x, y, z); const d = Math.hypot(s.x - lx, s.y - ly); return d < rad ? d : Infinity; };
    const touchR = Math.max(26, 900 / this.dist);
    if (this.showSockets) {
      let best: Pick | null = null; let bd = Infinity;
      for (const s of this.map.sockets) { const d = near(s.x, 0.2, s.z, touchR * 1.3); if (d < bd) { bd = d; best = { type: 'socket', id: s.id, x: s.x, z: s.z }; } }
      if (best) return best;
    }
    let bu: Pick | null = null; let bd = Infinity;
    for (const [id, h] of this.humans) { const d = near(h.root.position.x, 1.0, h.root.position.z, touchR); if (d < bd) { bd = d; bu = { type: 'unit', id, x: h.root.position.x, z: h.root.position.z }; } }
    if (bu) return bu;
    if (this.gameRef) {
      for (const f of this.gameRef.fires) { if (f.out) continue; const d = near(f.x, 1, f.z, touchR * 1.4); if (d < bd) { bd = d; bu = { type: 'fire', id: f.id, x: f.x, z: f.z }; } }
      if (bu) return bu;
    }
    if (this.entryArrows.visible) {
      for (const e of this.map.entries) { if (!e.spawn) continue; const d = near(e.x, 0.2, e.z, touchR * 1.6); if (d < bd) { bd = d; bu = { type: 'entry', id: e.id, x: e.x, z: e.z }; } }
      if (bu && this.side === 'looters') return bu;
    }
    const ndc = new THREE.Vector2((lx / r.width) * 2 - 1, -(ly / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.world.stores.map((s) => s.hit), false);
    if (hits.length) { const idx = hits[0].object.userData.store as number; const s = this.map.stores[idx]; return { type: 'store', idx, x: s.front.x, z: s.front.z }; }
    const g = this.groundAt(sx, sy) ?? { x: 0, z: 0 };
    return { type: 'ground', x: g.x, z: g.z };
  }

  private gameRef: Game | null = null;

  // ------------------------------------------------------------------ markers
  showDestination(x: number, z: number, path: Vec2[] | null, color: number) {
    this.destMarker.position.set(x, 0.05, z); (this.destMarker.material as THREE.MeshBasicMaterial).color.setHex(color); this.destT = 1.6;
    if (path && path.length > 1) {
      const pts = path.map((p) => new THREE.Vector3(p.x, 0.08, p.z));
      this.pathLine.geometry.dispose(); this.pathLine.geometry = new THREE.BufferGeometry().setFromPoints(pts); this.pathLine.computeLineDistances();
      (this.pathLine.material as THREE.LineDashedMaterial).color.setHex(color);
      this.pathLine.visible = true;
    }
  }

  setRouteLines(paths: { pts: Vec2[]; color: number }[]) {
    for (const c of [...this.routeLines.children]) { this.routeLines.remove(c); (c as THREE.Line).geometry.dispose(); }
    for (const p of paths) {
      if (p.pts.length < 2) continue;
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.pts.map((q) => new THREE.Vector3(q.x, 0.09, q.z))), new THREE.LineDashedMaterial({ color: p.color, dashSize: 0.8, gapSize: 0.5, transparent: true, opacity: 0.85 }));
      l.computeLineDistances(); this.routeLines.add(l);
    }
  }

  setEntryArrows(ids: string[] | null, color: string, highlight?: string) {
    for (const c of [...this.entryArrows.children]) this.entryArrows.remove(c);
    this.entryArrows.visible = !!ids && ids.length > 0;
    if (!ids) return;
    const b = this.map.bounds; const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    for (const id of ids) {
      const e = this.map.entries.find((en) => en.id === id); if (!e) continue;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), new THREE.MeshBasicMaterial({ map: arrowTexture(id === highlight ? '#ffd23a' : color), transparent: true, depthWrite: false, opacity: 0.9 }));
      m.rotation.x = -Math.PI / 2;
      const ang = Math.atan2(cx - e.x, cz - e.z);
      m.rotation.z = Math.PI - ang; // point inwards
      const g = new THREE.Group(); g.add(m); g.position.set(e.x + Math.sin(ang) * 2.2, 0.07, e.z + Math.cos(ang) * 2.2);
      m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, 0, 0); g.rotation.y = ang + Math.PI;
      this.entryArrows.add(g);
    }
  }

  private rebuildSockets(g: Game) {
    for (const c of [...this.socketMarkers.children]) this.socketMarkers.remove(c);
    if (!this.showSockets) return;
    for (const s of this.map.sockets) {
      const ok = this.showSockets(s.id);
      const geom = s.size === 'large' ? new THREE.RingGeometry(1.5, 1.8, 4, 1, Math.PI / 4) : new THREE.RingGeometry(0.75, 0.95, 24);
      const m = new THREE.Mesh(geom.rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: ok ? 0x46ff9a : 0xff4a4a, transparent: true, opacity: ok ? 0.9 : 0.45, depthWrite: false }));
      m.position.set(s.x, 0.08, s.z); if (s.rot === 90) m.rotation.y = Math.PI / 2;
      this.socketMarkers.add(m);
    }
    void g;
  }
  refreshSockets(g: Game) { this.rebuildSockets(g); }

  // ------------------------------------------------------------------ per-frame sync
  /** visual motion from how far the figure really travelled (not the sim's "moving" flag): no walking on the spot when
   *  someone is blocked, and the step slows down with the body before it settles into idle */
  private motionState = new Map<number, { x: number; z: number; v: number; on: boolean }>();
  private motion(id: number, p: THREE.Vector3, dt: number): { moving: boolean; speed: number } {
    let m = this.motionState.get(id);
    if (!m) { m = { x: p.x, z: p.z, v: 0, on: false }; this.motionState.set(id, m); }
    if (dt > 1e-4) {
      const inst = Math.hypot(p.x - m.x, p.z - m.z) / dt;
      m.v += (Math.min(inst, 8) - m.v) * Math.min(1, dt * 9);
    }
    m.x = p.x; m.z = p.z;
    m.on = m.on ? m.v > 0.22 : m.v > 0.55; // hysteresis: no flicker between walk and idle
    return { moving: m.on, speed: m.v };
  }

  private gasVis = new Map<number, { can: THREE.Mesh; haze: THREE.Mesh }>();
  private hazeTex: THREE.Texture | null = null;
  private drawGas(g: Game) {
    const T = BALANCE.tearGas; const live = new Set<number>();
    if (!this.hazeTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
      const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128); this.hazeTex = new THREE.CanvasTexture(c);
    }
    for (const c of g.gas) {
      live.add(c.id);
      let v = this.gasVis.get(c.id);
      if (!v) {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.6, roughness: 0.4 }));
        const haze = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.hazeTex, color: 0xb9b8b2, transparent: true, opacity: 0, depthWrite: false }));
        haze.renderOrder = 2; this.scene.add(can, haze); v = { can, haze }; this.gasVis.set(c.id, v);
      }
      if (!c.landed) {
        const k = Math.min(1, c.t / T.flight);
        v.can.position.set(c.fromX + (c.x - c.fromX) * k, 1.5 + Math.sin(k * Math.PI) * 3.2 - k * 1.4, c.fromZ + (c.z - c.fromZ) * k);
        v.can.rotation.set(c.t * 9, 0, c.t * 5);
        this.fx.emit(`gast:${c.id}`, 'tear_gas', v.can.position.x, v.can.position.y, v.can.position.z, 0.05, 0.8, 0.35); // thin trail
        continue;
      }
      v.can.position.set(c.x, 0.06, c.z); v.can.rotation.set(Math.PI / 2, 0, c.id);
      const life = Math.max(0, 1 - Math.max(0, c.t - (T.life - 3)) / 3);
      // the cloud: jet at the canister plus puffs around it, spread to the cloud's radius
      this.fx.emit(`gasc:${c.id}`, 'tear_gas', c.x, 0.25, c.z, 0.4, 2.2 * life, 1.1);
      for (let i = 0; i < 4; i++) {
        const a = i * 1.57 + c.id, rr = c.r * 0.55;
        this.fx.emit(`gas${i}:${c.id}`, 'tear_gas', c.x + Math.cos(a) * rr, 0.4, c.z + Math.sin(a) * rr, c.r * 0.4, 0.9 * life, 1.5);
      }
      v.haze.position.set(c.x, 0.09, c.z); v.haze.scale.setScalar(Math.max(0.1, c.r * 1.35));
      (v.haze.material as THREE.MeshBasicMaterial).opacity = 0.3 * Math.min(1, c.t / 1.2) * life;
    }
    for (const [id, v] of this.gasVis) if (!live.has(id)) { this.scene.remove(v.can, v.haze); v.can.geometry.dispose(); v.haze.geometry.dispose(); this.gasVis.delete(id); }
  }

  /** a scenery fire keeps burning until a firefighter has put out the game fire at that spot */
  private ambientBurning(g: Game, f: { x: number; z: number }) { return g.fires.some((ff) => ff.ambient && !ff.out && Math.hypot(ff.x - f.x, ff.z - f.z) < 0.5); }

  private poseOf(u: Unit): Pose {
    switch (u.state) {
      case 'breach': return 'breach';
      case 'barrier': return 'barrier';
      case 'collect': return 'collect';
      case 'held': return 'held';
      case 'restrained': return 'brace'; // pushed back by the officer, bracing
      case 'escorted': return u.escortSolo ? 'flee' : 'walk'; // pushed ahead by the officer, then runs off empty-handed
      case 'restrain': return 'restrain';
      case 'escort': return 'escort';
      case 'extinguish': return u.moving ? 'walk' : 'extinguish';
      case 'throw': return 'throw';
    }
    if (u.kind === 'shield' && !u.moving) return 'brace';
    return u.moving ? 'walk' : 'idle';
  }

  private bar(key: string, x: number, y: number, z: number, frac: number, color: string, label?: string) {
    let el = this.bars.get(key);
    if (!el) { el = document.createElement('div'); el.className = 'pbar'; el.innerHTML = '<i></i><span></span>'; this.overlay.appendChild(el); this.bars.set(key, el); }
    const s = this.toScreen(x, y, z);
    el.style.transform = `translate(${s.x - 22}px, ${s.y}px)`;
    const i = el.firstChild as HTMLElement; i.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`; i.style.background = color;
    (el.lastChild as HTMLElement).textContent = label ?? '';
    el.dataset.seen = '1';
  }

  floatText(x: number, z: number, text: string, cls: string) {
    const el = document.createElement('div'); el.className = 'floater ' + cls; el.textContent = text; this.overlay.appendChild(el);
    this.floaters.push({ el, x, z, t: 0 });
  }

  render(g: Game, dt: number) {
    if (this.disposed) return;
    this.gameRef = g;
    this.time += dt;
    // keyboard pan
    const kp = this.dist * 0.9 * dt;
    if (this.keys.has('a') || this.keys.has('arrowleft')) this.target.x -= kp;
    if (this.keys.has('d') || this.keys.has('arrowright')) this.target.x += kp;
    if (this.keys.has('w') || this.keys.has('arrowup')) this.target.y -= kp;
    if (this.keys.has('s') || this.keys.has('arrowdown')) this.target.y += kp;
    this.updateCamera();
    const isDef = this.side === 'defence';
    // units
    const seen = new Set<number>();
    for (const u of g.units) {
      seen.add(u.id);
      let h = this.humans.get(u.id);
      if (!h) { h = createCharacter(u.kind, u.variant); this.humans.set(u.id, h); this.scene.add(h.root); h.root.position.set(u.x, 0, u.z); }
      // smooth visual position (sim runs at fixed rate)
      const k = 1 - Math.exp(-dt * 20);
      // looting: the looter walks in through the broken front, grabs the goods inside and comes back out carrying them
      // (cosmetic only: the sim keeps him at the door). in = 0..1 how far inside he is, phase drives pose and facing.
      let tx = u.x, tz = u.z; let lootPhase: 'in' | 'inside' | 'out' | null = null;
      if (u.state === 'collect' && u.targetStore >= 0) {
        const sd = this.map.stores[u.targetStore]; const total = u.pending * BALANCE.collectTimePerStock + 0.6; const p = u.stateT / Math.max(0.5, total);
        const inn = p < 0.28 ? p / 0.28 : p < 0.72 ? 1 : Math.max(0, 1 - (p - 0.72) / 0.28);
        lootPhase = p < 0.28 ? 'in' : p < 0.72 ? 'inside' : 'out';
        const lat = Math.max(-sd.width / 2 + 0.9, Math.min(sd.width / 2 - 0.9, (u.x - sd.front.x) * sd.normal.z - (u.z - sd.front.z) * sd.normal.x));
        const ix = sd.front.x + sd.normal.z * lat - sd.normal.x * 1.7, iz = sd.front.z - sd.normal.x * lat - sd.normal.z * 1.7;
        const e = inn * inn * (3 - 2 * inn); tx = u.x + (ix - u.x) * e; tz = u.z + (iz - u.z) * e;
      }
      h.root.position.x += (tx - h.root.position.x) * k; h.root.position.z += (tz - h.root.position.z) * k;
      // standing guards watch the street: they turn towards a rioter nearby, otherwise look around on their own rhythm
      let face = u.facing;
      if (lootPhase === 'out' && u.targetStore >= 0) { const n = this.map.stores[u.targetStore].normal; face = Math.atan2(n.x, n.z); } // walking back out
      if (u.side === 'def' && !u.moving && (u.state === 'idle' || u.state === 'return')) {
        let best = 12; for (const a of g.units) if (a.side === 'att') { const d = Math.hypot(a.x - u.x, a.z - u.z); if (d < best) { best = d; face = Math.atan2(a.x - u.x, a.z - u.z); } }
        if (best >= 12) face += Math.sin(this.time * (0.18 + (u.id % 5) * 0.04) + u.id * 1.7) * 0.55;
      }
      let df = face - h.root.rotation.y; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
      h.root.rotation.y += df * Math.min(1, dt * (u.moving ? 12 : 3)); // standing turns are unhurried
      const mv = this.motion(u.id, h.root.position, dt);
      let pose = this.poseOf(u); if (pose === 'walk' || pose === 'idle') pose = mv.moving ? 'walk' : (u.kind === 'shield' ? 'brace' : 'idle');
      else if (pose === 'brace' && mv.moving) pose = 'walk';
      if (lootPhase) pose = mv.moving ? 'walk' : 'collect'; // walks in/out, rummages inside
      else if (u.side === 'att' && u.gasT > 0.3 && (pose === 'walk' || pose === 'idle')) pose = 'flee'; // arms up over the face, coughing
      let action = u.state === 'throw' ? u.stateT / BALANCE.throw.duration : 0;
      if (u.kind === 'shield' && g.time - u.strikeAt < 0.6) { pose = 'strike'; action = (g.time - u.strikeAt) / 0.6; } // baton swing
      if (u.side === 'def' && g.time - u.gasThrowAt < BALANCE.throw.duration) { pose = 'throw'; action = (g.time - u.gasThrowAt) / BALANCE.throw.duration; } // lobs the canister
      h.update(pose, mv.moving, mv.speed, u.carrying > 0 || lootPhase === 'out', dt * (g.over ? 0.3 : 1), action);
      // small flame on the cloth while the object is in the hand
      if (u.state === 'throw' && h.heldWick && h.heldWick(this.tmpV)) this.fx.emit(`held:${u.id}`, 'fire', this.tmpV.x, this.tmpV.y, this.tmpV.z, 0.02, 1, 0.22);
      // attackers outside detection are shown dimmer icons in defence mode (information from cameras)
      const det = u.side === 'att' ? g.isDetected(u) : true;
      (h.icon.material as THREE.SpriteMaterial).opacity = det ? 1 : 0.35;
      h.icon.scale.setScalar(Math.max(0.42, this.dist / 90));
      // selection ring
      let ring = this.rings.get(u.id);
      if (this.selected.has(u.id)) {
        if (!ring) { ring = new THREE.Mesh(this.ringGeo, u.side === 'def' ? this.ringMatDef : this.ringMatAtt); this.scene.add(ring); this.rings.set(u.id, ring); }
        ring.position.set(h.root.position.x, 0.05, h.root.position.z);
      } else if (ring) { this.scene.remove(ring); this.rings.delete(u.id); }
      // progress bars: restraint, shield hold, collection, barrier
      if ((u.state === 'restrained' || u.state === 'held') && u.restrainP > 0) this.bar('r' + u.id, u.x, 2.4, u.z, u.restrainP, '#36e0ff', u.state === 'held' ? 'HOLD' : '');
      else if (u.state === 'held') this.bar('r' + u.id, u.x, 2.4, u.z, 1 - u.holdT / BALANCE.units.shield.holdTime, '#8fb4ff', 'HOLD');
      if (u.state === 'collect' && u.pending > 0) this.bar('c' + u.id, u.x, 2.4, u.z, u.stateT / (u.pending * BALANCE.collectTimePerStock + 0.6), '#ff9a2e');
      if (u.carrying > 0 && !isDef) this.bar('k' + u.id, u.x, 2.5, u.z, 1, '#ff9a2e', String(u.carrying));
    }
    // neutral people (no selection, no faction icon)
    const nseen = new Set<number>();
    for (const n of g.npcs) {
      if (n.state === 'gone') continue;
      nseen.add(n.id);
      let c = this.npcVis.get(n.id);
      if (!c) {
        c = createCharacter(n.role === 'patron' ? 'civilian' : n.role === 'police' ? 'security' : n.role, n.variant);
        if (n.role === 'police') c.icon.visible = false; // decorative police line: no faction icon, not selectable
        this.npcVis.set(n.id, c); this.scene.add(c.root); c.root.position.set(n.x, 0, n.z); }
      const k = 1 - Math.exp(-dt * 20);
      c.root.position.x += (n.x - c.root.position.x) * k; c.root.position.z += (n.z - c.root.position.z) * k;
      let df = n.facing - c.root.rotation.y; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
      c.root.rotation.y += df * Math.min(1, dt * 10);
      const nm = this.motion(-n.id, c.root.position, dt);
      c.update(n.state === 'flee' && nm.moving ? 'flee' : n.state === 'guide' ? 'guide' : nm.moving ? 'walk' : 'idle', nm.moving, nm.speed, n.carrying, dt);
    }
    for (const [id, c] of this.npcVis) if (!nseen.has(id)) { this.scene.remove(c.root); this.npcVis.delete(id); this.motionState.delete(-id); }
    for (const [id, h] of this.humans) if (!seen.has(id)) {
      this.scene.remove(h.root); this.humans.delete(id); this.motionState.delete(id);
      const ring = this.rings.get(id); if (ring) { this.scene.remove(ring); this.rings.delete(id); }
      this.selected.delete(id);
    }
    // stores
    g.stores.forEach((s, i) => {
      const v = this.world.stores[i];
      v.update(s.structure / s.maxStructure, s.stock / 100, s.shutterLevel, s.structure <= 0, s.boards / s.boardsMax);
      v.setScorched?.(s.scorched);
      if (v.justBroke) this.fx.event(`glass:${i}:${Math.round(g.time * 10)}`, 'glass', s.door.x, s.door.z);
      const el = this.storeLabels[i]; const sd = this.map.stores[i];
      const scr = this.toScreen(sd.front.x + sd.normal.x * 0.5, 4.7, sd.front.z + sd.normal.z * 0.5);
      // keep store labels below the top bar on short screens
      const minY = (this.container.querySelector('.topbar') as HTMLElement | null)?.offsetHeight ?? 0;
      el.style.transform = `translate(${scr.x}px, ${Math.max(scr.y, minY + el.offsetHeight + 4)}px) translate(-50%, -100%)`;
      (el.querySelector('.struct i') as HTMLElement).style.width = `${(s.structure / s.maxStructure) * 100}%`;
      (el.querySelector('.stock i') as HTMLElement).style.width = `${s.stock}%`;
      (el.querySelector('.sl-num') as HTMLElement).textContent = `${Math.ceil(s.structure)}/${s.maxStructure} · stock ${s.stock}${s.reserved ? ` (−${s.reserved} moving)` : ''}`;
      el.classList.toggle('selected', this.selectedStore === i);
      el.classList.toggle('target', this.highlightStore === i);
      el.classList.toggle('empty', s.stock <= 0);
      el.classList.toggle('damaged', s.structure < s.maxStructure * 0.6 && s.stock > 0);
      if (s.structure < s.maxStructure && s.structure > 0 && g.units.some((u) => u.state === 'breach' && u.targetStore === i)) this.bar('s' + i, s.door.x, 3.2, s.door.z, s.structure / s.maxStructure, '#ff5a3a', 'SHUTTER');
    });
    // barriers
    const bseen = new Set<number>();
    for (const b of g.barriers) {
      bseen.add(b.id);
      let m = this.barriers.get(b.id);
      if (!m) { const slot = b.kind === 'barrier' ? 'prop.barrier' : 'prop.concrete'; m = ((slotStatus(slot) === 'final' ? cloneModel(slot) : null) as THREE.Group | null) ?? buildBarrierModel(b.kind === 'barrier' ? 'small' : 'large', b.size === 'large'); m.position.set(b.x, 0, b.z); m.rotation.y = b.rot === 90 ? Math.PI / 2 : 0; this.scene.add(m); this.barriers.set(b.id, m); }
      if (b.broken) { m.rotation.z = Math.min(1.45, b.brokenT * 4) * (b.size === 'small' ? 1 : 0.15); m.position.y = b.size === 'small' ? 0.05 : 0; if (b.size === 'large') m.children.forEach((c, i) => { c.rotation.y = i * 0.4; c.position.z = (i % 2) * 0.8; }); }
      else if (b.hp < b.maxHp) this.bar('b' + b.id, b.x, 1.6, b.z, b.hp / b.maxHp, '#e0e0e0');
    }
    for (const [id, m] of this.barriers) if (!bseen.has(id)) { this.scene.remove(m); this.barriers.delete(id); }
    // camera masts + coverage
    for (const c of g.cameras) {
      if (this.masts.has(c.id)) continue;
      const m = (slotStatus('prop.camera_mast') === 'final' ? cloneModel('prop.camera_mast') : null) ?? buildMastModel(); m.position.set(c.x, 0, c.z); this.scene.add(m); this.masts.set(c.id, m);
    }
    this.coverage.clear();
    if (isDef || this.reducedFx === false) {
      for (const c of g.cameras) {
        const r = g.cameraRadius();
        const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: isDef ? 0.07 : 0.05, depthWrite: false }));
        disc.position.set(c.x, 0.06, c.z); this.coverage.add(disc);
        const edge = new THREE.Mesh(new THREE.RingGeometry(r - 0.12, r, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: 0.35, depthWrite: false }));
        edge.position.set(c.x, 0.065, c.z); this.coverage.add(edge);
      }
    }
    // cars that caught fire
    for (const idx of g.burnedProps) { const c = this.world.cars.get(idx); if (c && c.intact.visible) { c.intact.visible = false; c.burned.visible = true; const pp = this.map.props[idx]; this.fx.event(`car:${idx}`, 'explosion', pp.x, pp.z); } }
    // tear gas: the canister arcs from the officer, lands and vents a thick low cloud with a ground haze under it
    this.drawGas(g);
    // fires
    // thrown objects in flight (pooled visuals); flame at the cloth tip and a thin smoke trail
    const alive = new Set<number>();
    for (const p of g.projectiles) {
      alive.add(p.id);
      const o = this.projPool.get(p.id); if (!o) continue;
      o.position.set(p.x, p.y, p.z);
      o.rotation.set(p.t * p.spin, Math.atan2(p.tx - p.sx, p.tz - p.sz), 0);
      o.getObjectByName('wick')!.getWorldPosition(this.tmpV);
      this.fx.emit(`proj:${p.id}`, 'fire', this.tmpV.x, this.tmpV.y, this.tmpV.z, 0.02, 1, 0.25);
      this.fx.emit(`projs:${p.id}`, 'smoke', this.tmpV.x, this.tmpV.y, this.tmpV.z, 0.05, 0.6, 0.3);
    }
    this.projPool.sweep(alive);
    const activeFires = g.fires.filter((f) => !f.out);
    for (const f of activeFires) {
      if (!f.ambient) this.fx.burn(String(f.id), f.x, f.z, 1 - f.progress * 0.7); // scenery fires keep their own bigger blaze
      // clear indicator on every burning object: remaining fire (red) or extinguishing progress (blue)
      if (f.progress > 0) this.bar('f' + f.id, f.x, 2.8, f.z, f.progress, '#9fe3ff', 'EXTINGUISHING');
      else if (!f.ambient) this.bar('f' + f.id, f.x, 2.8, f.z, 1, '#ff5a2a', f.ttl >= 0 ? 'FIRE (burns out)' : '🔥 FIRE — send firefighter');
    }
    // decorative fires (burning barricade far up the side street): flames, smoke and flicker, never part of the game
    this.world.ambientFires.forEach((f, i) => { if (!this.ambientBurning(g, f)) return; this.fx.emit(`fire:amb${i}`, 'fire', f.x, 0.3, f.z, 1.4, 1, 1.8); this.fx.emit(`smoke:amb${i}`, 'smoke', f.x, 2.6, f.z, 1.2, 0.7, 1.8); });
    this.fx.setFireLights([...activeFires.filter((f) => !f.ambient), ...this.world.ambientFires.filter((f) => this.ambientBurning(g, f))], this.time);
    for (const u of g.units) if (u.kind === 'firefighter' && u.state === 'extinguish' && !u.moving) { const f = g.fires.find((ff) => ff.id === u.fireId); if (f) this.fx.sprayAt(u.x, u.z, f.x, f.z, dt, String(u.id)); }
    (window as unknown as { __fx?: unknown }).__fx = this.fx;
    // dropped goods markers
    const dseen = new Set<number>();
    for (const d of g.drops) {
      dseen.add(d.id);
      let m = this.dropMarkers.get(d.id);
      if (!m) {
        m = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: 0.9, depthWrite: false }));
        ring.position.y = 0.06; m.add(ring); m.position.set(d.x, 0, d.z); this.scene.add(m); this.dropMarkers.set(d.id, m);
        this.fx.dropBox(d.x, d.z);
      }
      m.rotation.y += dt; (m.children[0] as THREE.Mesh).scale.setScalar(1 + Math.sin(this.time * 6) * 0.08);
    }
    for (const [id, m] of this.dropMarkers) if (!dseen.has(id)) { this.scene.remove(m); this.dropMarkers.delete(id); }
    // supply truck
    if (g.truck && this.map.supply) {
      if (!this.truck) { this.truck = buildTruck(); this.scene.add(this.truck); }
      this.truck.position.set(g.truck.x, 0, g.truck.z); this.truck.rotation.y = g.truck.facing;
      this.truck.visible = g.truck.active || !g.truck.done;
    }
    // van lights flash
    this.world.vanLights.forEach((l, i) => ((l.material as THREE.MeshBasicMaterial).color.setHex(Math.sin(this.time * 9 + i * Math.PI) > 0 ? 0x3a6aff : 0x0a1440)));
    this.world.fireGlows.forEach((gl, i) => { gl.visible = this.ambientBurning(g, this.world.ambientFires[i]); const k = 1 + Math.sin(this.time * 17 + i) * 0.08 + Math.sin(this.time * 5.3) * 0.06; gl.scale.set(7 * k, 7 * k, 1); });
    this.world.policeLights.forEach((l, i) => { (l.material as THREE.MeshBasicMaterial).opacity = Math.sin(this.time * 9 + i) > 0 ? 1 : 0.15; });
    // shop detail levels by camera distance (decoration only; gameplay objects are unaffected)
    for (const sh of [...this.world.stores, ...this.world.decorShops]) if (sh.setLod && sh.group) sh.setLod(this.camera.position.distanceTo(sh.group.position));
    // camera heads turn slowly on their pivots (decorative; detection range comes from the rules)
    for (const [id, mst] of this.masts) for (let k = 1; k <= 3; k++) { const pv = mst.getObjectByName(`cam_pivot_${k}`); if (pv) pv.rotation.y = Math.sin(this.time * 0.35 + k * 2 + id) * 0.7; }
    for (const sc of this.world.animated) { sc.tex.offset.x += sc.vx * dt; sc.tex.offset.y += sc.vy * dt; }
    // fountain spray
    if (this.world.fountainWater) {
      const pa = this.world.fountainWater.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pa.count; i++) {
        const t = ((this.time * 0.6 + i / pa.count) % 1); const a = i * 2.399;
        const rr = 0.3 + t * 1.4; pa.setXYZ(i, Math.cos(a) * rr, 3.9 + t * 0.9 - t * t * 3.2, Math.sin(a) * rr);
      }
      pa.needsUpdate = true;
    }
    // destination marker / path preview fade
    if (this.destT > 0) { this.destT -= dt; (this.destMarker.material as THREE.MeshBasicMaterial).opacity = Math.min(1, this.destT); this.pathLine.visible = this.destT > 0; (this.pathLine.material as THREE.LineDashedMaterial).opacity = Math.min(0.9, this.destT); }
    this.idleSockets.visible = g.phase === 'prep' && !this.showSockets;
    // socket markers pulse
    this.socketMarkers.children.forEach((m) => m.scale.setScalar(1 + Math.sin(this.time * 5) * 0.06));
    this.entryArrows.children.forEach((m, i) => (m.position.y = 0.07 + Math.abs(Math.sin(this.time * 3 + i)) * 0.0));
    this.fx.update(dt);
    // fade foreground roofs/arcades that hide units
    this.fadeOccluders(g);
    // floaters
    for (const f of this.floaters) {
      f.t += dt; const s = this.toScreen(f.x, 2.6 + f.t * 1.2, f.z);
      f.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`; f.el.style.opacity = String(Math.max(0, 1 - f.t / 1.8));
    }
    this.floaters = this.floaters.filter((f) => { if (f.t > 1.8) { f.el.remove(); return false; } return true; });
    for (const [k, el] of this.bars) { if (el.dataset.seen !== '1') { el.remove(); this.bars.delete(k); } else el.dataset.seen = '0'; }
    if (this.post) this.post.render(this.time); else this.renderer.render(this.scene, this.camera);
  }

  private fadeOccluders(g: Game) {
    const ray = new THREE.Ray(); const cam = this.camera.position; const tmp = new THREE.Vector3();
    for (const f of this.world.fadeables) {
      let occl = false;
      // units and store entrances must stay readable
      const pts = g.units.map((u) => [u.x, 1, u.z]).concat(g.stores.map((s) => [s.door.x, 1.5, s.door.z]));
      for (const [px, py, pz] of pts) {
        tmp.set(px, py, pz);
        ray.origin.copy(cam); ray.direction.copy(tmp).sub(cam).normalize();
        const hit = ray.intersectBox(f.box, new THREE.Vector3());
        if (hit && hit.distanceTo(cam) < tmp.distanceTo(cam) - 0.5) { occl = true; break; }
      }
      const targetOp = occl ? 0.4 : 1;
      f.opacity += (targetOp - f.opacity) * 0.15;
      for (const m of f.meshes) {
        const ms = Array.isArray(m.material) ? m.material : [m.material];
        for (const mm of ms) { (mm as THREE.Material).opacity = f.opacity; (mm as THREE.Material).depthWrite = f.opacity > 0.95; }
      }
    }
  }

}
