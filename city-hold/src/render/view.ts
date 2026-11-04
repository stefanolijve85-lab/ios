import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import type { Game, Unit } from '../sim/game';
import type { MapDef, Vec2 } from '../maps/types';
import { buildBarrierModel, buildMastModel, buildWorld, setWorldDaylight, buildTruck, noReflection, NO_REFLECT_LAYER, skyTexture, type WorldHandles } from './world';
import { type Pose } from './humans';
import { Effects } from './effects';
import { Post } from './post';
import { cloneModel, loadedTextures, slotStatus } from './assets';
import { IncendiaryPool } from './thrown';
import { createCharacter, createCharacterFromSlot, setFireKit, type CharacterVisual } from './character';
import type { AnyKind } from './humans';
import { buildCar } from './world';
import { radialTexture, setFacadeDaylight } from './textures';
import { buildWetStreet } from './wet';
import { groundTexture } from './textures';
import type { Reflector } from 'three/addons/objects/Reflector.js';
import { arrowTexture } from './textures';
import { BALANCE } from '../config/balance';
import { FireCrew } from './fireCrew';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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

const PITCH_DEFAULT = THREE.MathUtils.degToRad(40); // oblique view of images 02/03: shopfronts readable, fountain in the middle

/** canvas textures for the street litter: taped cardboard, printed product boxes, flyers, fabric weave, gift boxes */
function litterTextures() {
  const mk = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const noise = (g: CanvasRenderingContext2D, w: number, h: number, a: number) => { for (let i = 0; i < w * h / 18; i++) { const v = Math.random() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } };
  const cardboard = mk(128, 128, (g) => {
    g.fillStyle = '#a57a4b'; g.fillRect(0, 0, 128, 128); noise(g, 128, 128, 0.12);
    g.strokeStyle = 'rgba(70,45,20,0.6)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 125, 125);
    g.fillStyle = 'rgba(210,190,150,0.85)'; g.fillRect(56, 0, 16, 128); // packing tape
    g.fillStyle = '#efe9dc'; g.fillRect(14, 82, 30, 22); g.fillStyle = '#333'; for (let i = 0; i < 4; i++) g.fillRect(17, 86 + i * 4, 18 + (i % 2) * 6, 1.5); // shipping label
    g.fillStyle = 'rgba(40,30,20,0.7)'; g.font = 'bold 14px sans-serif'; g.fillText('↑↑', 92, 30);
  });
  const product = mk(128, 128, (g) => {
    g.fillStyle = '#e9e8e4'; g.fillRect(0, 0, 128, 128); noise(g, 128, 128, 0.05);
    const gr = g.createLinearGradient(20, 26, 108, 90); gr.addColorStop(0, '#1d3c7a'); gr.addColorStop(1, '#3fa0d8'); g.fillStyle = gr; g.fillRect(20, 26, 88, 56); // the product picture
    g.fillStyle = '#20232a'; g.fillRect(20, 92, 52, 7); g.fillStyle = '#888'; g.fillRect(20, 104, 70, 3); g.fillRect(20, 110, 44, 3);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.strokeRect(1, 1, 126, 126);
  });
  const paper = mk(128, 96, (g) => {
    g.fillStyle = '#ece6d8'; g.fillRect(0, 0, 128, 96); noise(g, 128, 96, 0.08);
    g.fillStyle = ['#c0392b', '#2c4f8c', '#d68a1a'][Math.floor(Math.random() * 3)]; g.fillRect(8, 8, 112, 22); // flyer heading
    g.fillStyle = 'rgba(40,40,40,0.65)'; for (let i = 0; i < 6; i++) g.fillRect(8, 40 + i * 8, 60 + Math.random() * 50, 3);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(0, 48); g.lineTo(128, 52); g.moveTo(64, 0); g.lineTo(60, 96); g.stroke(); // fold lines
  });
  const fabric = mk(64, 64, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 2) { g.fillStyle = `rgba(0,0,0,${0.06 + (y % 4 ? 0.04 : 0)})`; g.fillRect(0, y, 64, 1); }
    for (let x = 0; x < 64; x += 3) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, 0, 1, 64); }
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 10); g.lineTo(58, 14); g.stroke(); // a seam
  });
  const giftbox = mk(64, 64, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#d6b25e'; g.fillRect(28, 0, 8, 64); g.fillRect(0, 28, 64, 8); // gold ribbon
    g.strokeStyle = '#d6b25e'; g.lineWidth = 2; g.strokeRect(2, 2, 60, 60);
  });
  return { cardboard, product, paper, fabric, giftbox };
}
/** crumple a geometry: push every vertex a random amount along y (and a little sideways) so flat sheets fold and sag */
function crumpled(geo: THREE.BufferGeometry, amount: number, seed: number) {
  const p = geo.attributes.position; let s = seed * 9301 + 49297;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + r() * amount * 0.6, p.getY(i) + r() * amount * 2, p.getZ(i) + r() * amount * 0.6);
  geo.computeVertexNormals(); return geo;
}
/** flashbang canister (reference image): dark steel body perforated with round ports, ribbed end caps, fuse head with
 *  a spoon lever and pull ring; shown about 1.5x real size: still readable from the game camera without looking like a can of paint */
let FLASH_PROTO: THREE.Group | null = null;
/** soft camera-reach disc: alpha 0.04 in the middle, up to 0.16 near the rim, then a smooth fade to nothing */
let COVERAGE_TEX: THREE.CanvasTexture | null = null;
function coverageTexture(): THREE.CanvasTexture {
  if (COVERAGE_TEX) return COVERAGE_TEX;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.04)'); g.addColorStop(0.62, 'rgba(255,255,255,0.06)'); g.addColorStop(0.86, 'rgba(255,255,255,0.16)');
  g.addColorStop(0.95, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  COVERAGE_TEX = new THREE.CanvasTexture(c); return COVERAGE_TEX;
}
function flashbangModel(): THREE.Object3D {
  if (!FLASH_PROTO) {
    const g = new THREE.Group();
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d')!;
    x.fillStyle = '#3c3c3e'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},255,0.05)`; x.fillRect(Math.random() * 128, Math.random() * 64, 2, 2); }
    x.fillStyle = '#0b0b0c'; for (let col = 0; col < 8; col++) for (let row = 0; row < 3; row++) { x.beginPath(); x.arc(8 + col * 16, 12 + row * 20, 5, 0, Math.PI * 2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const steel = new THREE.MeshStandardMaterial({ color: 0x5a5a5c, roughness: 0.45, metalness: 0.75 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide }));
    g.add(body);
    for (const y of [-0.068, 0.068]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.028, 8), steel); cap.position.y = y; g.add(cap); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.03, 10), steel); neck.position.y = 0.097; g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.035), steel); head.position.y = 0.122; g.add(head);
    const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.15, 0.022), steel); spoon.position.set(0.052, 0.045, 0); spoon.rotation.z = -0.12; g.add(spoon);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0045, 6, 18), steel); ring.position.set(0.045, 0.11, 0.02); ring.rotation.y = Math.PI / 2; g.add(ring);
    g.scale.setScalar(1.5); g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
    FLASH_PROTO = g;
  }
  return FLASH_PROTO.clone();
}
/** a steel crowd barrier lying flat on the ground: frame plus vertical bars, merged into one geometry */
function fallenBarrierGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bar = (w: number, d: number, x: number, z: number) => parts.push(new THREE.BoxGeometry(w, 0.05, d).translate(x, 0, z));
  bar(2.2, 0.06, 0, -0.5); bar(2.2, 0.06, 0, 0.5); bar(0.06, 1.06, -1.1, 0); bar(0.06, 1.06, 1.1, 0);
  for (let i = 1; i < 12; i++) bar(0.03, 1, -1.1 + i * (2.2 / 12), 0);
  bar(0.5, 0.06, -0.8, 0.75); bar(0.5, 0.06, 0.8, 0.75); // the feet
  return mergeGeometries(parts)!;
}

/** a texture whose image has arrived (uploading one that is still decoding only warns and uploads nothing) */
function texReady(t: THREE.Texture): boolean { const im = t.image as { width?: number; data?: unknown } | null; return !!im && (!!im.width || !!im.data); }

export class MatchView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private pitch = PITCH_DEFAULT;
  private lastDist = 0;
  readonly world: WorldHandles;
  readonly fx: Effects;
  private fireCrew: FireCrew;
  private night = false;
  private touchDevice = false;
  private frameNo = 0;
  private day = false;
  /** daylight: lamps off, their pools and streaks hidden, self-lit surfaces (windows, paintings, lanterns) toned down.
   *  Fires, beacons and effects are added later and keep their light. */
  private toDaylight() {
    for (const l of this.world.lampLights) l.intensity = 0;
    // the square is damp, not a black mirror: lighter stone, little metal, a softer sheen
    const gm = (this.world.ground as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if (gm?.isMeshStandardMaterial) { gm.color.set(0xeae0d0); gm.metalness = 0.05; gm.envMapIntensity = 0.7; gm.needsUpdate = true; }
    const seen = new Set<THREE.Material>();
    this.world.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (!m) return;
      for (const mt of Array.isArray(m) ? m : [m]) {
        if (mt.userData.lampGlow) { o.visible = false; continue; }
        if (seen.has(mt)) continue; seen.add(mt);
        if (mt.userData.dayColor !== undefined) (mt as THREE.MeshBasicMaterial).color.set(mt.userData.dayColor);
        const st = mt as THREE.MeshStandardMaterial;
        if (st.isMeshStandardMaterial && st.emissiveIntensity > 0) st.emissiveIntensity *= 0.18;
      }
    });
  }
  /** compile every shader and upload every texture before the player sees the street: on a first visit (empty shader
   *  cache, iPad) the models otherwise stayed black until their programs finished compiling */
  async warm(): Promise<void> {
    // model textures still decoding: wait for them (up to 4 s) so they too are on the GPU before the cover lifts
    for (let i = 0; i < 40 && loadedTextures().some((t) => !texReady(t)); i++) await new Promise((r) => setTimeout(r, 100));
    // in small batches with a frame in between: the loading film keeps moving while the GPU is filled
    let n = 0;
    for (const t of loadedTextures()) {
      if (!texReady(t)) continue;
      try { this.renderer.initTexture(t); } catch { /* uploads on first use */ }
      if (++n % 6 === 0) await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    try { await this.renderer.compileAsync(this.scene, this.camera); } catch { /* compiled on first draw instead */ }
  }
  /** where the fire engine stands (null until a firefighter is on the team) */
  fireEnginePos() { return this.fireCrew.enginePos(); }
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

  constructor(readonly container: HTMLElement, readonly map: MapDef, readonly side: 'defence' | 'looters', private input: ViewInput, readonly reducedFx: boolean, timeOfDay: 'day' | 'evening' | 'night' = 'evening') {
    this.renderer = new THREE.WebGLRenderer({ antialias: !reducedFx, powerPreference: 'high-performance' });
    // touch tablets at full quality render at 1.5x (a 2x iPad screen is 4x the pixels of 1x: that made play and sound stutter)
    const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedFx || touch ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.42;
    this.renderer.shadowMap.enabled = !reducedFx; this.renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft was removed in this three.js (it fell back to PCF with a warning)
    // tablets and phones: the shadow map is redrawn every fourth frame only (people cast no shadow; only a vehicle
    // driving in moves one, and 15 updates a second keep that smooth)
    if (touch) this.renderer.shadowMap.autoUpdate = false;
    this.touchDevice = touch;
    this.renderer.domElement.className = 'game-canvas';
    container.appendChild(this.renderer.domElement);
    this.pitch = THREE.MathUtils.degToRad(map.camera.pitch ?? 40);
    this.camera = new THREE.PerspectiveCamera(map.camera.fov ?? 36, 1, 0.5, 400);
    const pm = new THREE.PMREMGenerator(this.renderer);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = env; this.scene.environmentIntensity = timeOfDay === 'night' ? 0.1 : 0.25;
    // blue-hour HDRI (tools/make_hdri.py) replaces the neutral room environment once loaded
    new HDRLoader().loadAsync('env/blue_hour.hdr').then((hdr) => {
      if (this.disposed) return;
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const t = pm.fromEquirectangular(hdr).texture; hdr.dispose();
      this.scene.environment = t; this.scene.environmentIntensity = this.night ? 0.22 : this.day ? 0.9 : 0.55;
    }).catch(() => { /* keep fallback */ });
    this.day = timeOfDay === 'day';
    this.scene.background = skyTexture(this.day);
    this.scene.fog = new THREE.Fog(0x2a3a5c, 115, 260); // haze only far down the side streets: the square itself stays clear (image 01)
    const hemi = new THREE.HemisphereLight(0x8a9ac8, 0x4a3e30, 0.85); this.scene.add(hemi); // blue-hour sky, cool wet ground bounce
    const moon = new THREE.DirectionalLight(0xa9bcff, 0.7);
    moon.position.set(-30, 60, 25); moon.target.position.set(0, 0, 0);
    moon.castShadow = !reducedFx; (moon.shadow as THREE.LightShadow & { intensity: number }).intensity = 0.7; // soft, subtle shadows moon.shadow.mapSize.set(2048, 2048);
    const sc = moon.shadow.camera; sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 10; sc.far = 160; moon.shadow.bias = -0.0005;
    this.scene.add(moon, moon.target);
    // night: less sky and moon light, a darker sky and street; the lamps, windows and fires carry the scene
    this.night = timeOfDay === 'night';
    if (this.night) {
      this.renderer.toneMappingExposure = 1.15; hemi.intensity = 0.32; hemi.color.set(0x5a6a9a); moon.intensity = 0.32; moon.color.set(0x8fa6e8);
      this.scene.backgroundIntensity = 0.35; (this.scene.fog as THREE.Fog).color.set(0x0e1424);
    }
    // day: a hazy riot afternoon. The sun takes the moon's place (same shadow setup), the sky is pale, the street lamps
    // are off and the self-lit windows and paintings are toned right down
    if (this.day) {
      this.renderer.toneMappingExposure = 1.0; hemi.intensity = 1.2; hemi.color.set(0xdde4ee); hemi.groundColor.set(0x8a7a64);
      moon.intensity = 3.0; moon.color.set(0xfff0dc); moon.position.set(35, 70, 30);
      this.scene.environmentIntensity = 0.6; (this.scene.fog as THREE.Fog).color.set(0xb4bfcc); (this.scene.fog as THREE.Fog).near = 140; (this.scene.fog as THREE.Fog).far = 320;
    }
    this.camera.layers.enable(NO_REFLECT_LAYER); // the game camera sees everything; the reflection only layer 0
    setFacadeDaylight(this.day); setWorldDaylight(this.day);
    this.world = buildWorld(map, this.scene, reducedFx);
    // tablets and phones: every point light is paid for on every lit pixel. Keep the two street lamps nearest the
    // middle of the square as real lights; the others keep their glow, pool and wet-street streak (all textures)
    if (touch && this.world.lampLights.length > 2) {
      const keep = [...this.world.lampLights].sort((a, b) => a.position.lengthSq() - b.position.lengthSq()).slice(0, 2);
      for (const l of this.world.lampLights) if (!keep.includes(l)) l.parent?.remove(l);
      this.world.lampLights.splice(0, this.world.lampLights.length, ...keep);
      for (const l of keep) l.intensity *= 1.4; // they light a little more of the square
    }
    if (this.night) for (const l of this.world.lampLights) l.intensity *= 1.5; // the lamps own the night
    if (this.day) this.toDaylight();
    // upload every model texture to the GPU now: otherwise a model shows black for a moment the first time it comes into view (iPad)
    for (const t of loadedTextures()) { if (!texReady(t)) continue; try { this.renderer.initTexture(t); } catch { /* a texture still decoding uploads on first use */ } }
    if (!reducedFx) {
      this.wet = buildWetStreet(map.bounds, groundTexture(map.ground), container.clientWidth || 1280, container.clientHeight || 720);
      if (this.day) (this.wet.material as THREE.ShaderMaterial).uniforms.color.value.set(0x4a4540); // damp, not a mirror, by day
      this.scene.add(this.wet);
      // the reflection is a full redraw of the street: while the camera stands still it is refreshed every third frame
      // (flames and beacons in it still move), while panning or zooming every frame
      { const w = this.wet; const orig = w.onBeforeRender.bind(w); const last = new THREE.Matrix4(); let n = 0;
        w.onBeforeRender = (r, sc, cam, ...rest) => { n++; const still = cam.matrixWorld.equals(last); last.copy(cam.matrixWorld); if (still && n % 3 !== 0) return; orig(r, sc, cam, ...rest); }; }
      this.post = new Post(this.renderer, this.scene, this.camera, touch);
      if (this.day) this.post.grade.uniforms.day.value = 1;
    }
    this.fx = new Effects(this.scene, reducedFx);
    setFireKit(map.id);
    this.fireCrew = new FireCrew(this.scene, map, this.fx);
    this.fireCrew.prewarm(this.renderer, this.camera);
    if (!reducedFx) { this.flashLight = new THREE.PointLight(0xfff6e8, 0, 22, 1.6); this.scene.add(this.flashLight); }
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
    if (container.clientWidth < container.clientHeight) { this.dist = Math.min(this.maxDist, map.camera.dist * (map.camera.portraitDist ?? 1.7)); if (map.camera.portraitZ !== undefined) this.target.y = map.camera.portraitZ; }
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
    const PITCH = this.pitch;
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

  // ---- flashbang going off: a blinding white flash (light, sprite, sparks, white smoke) and a white-out on screen
  private flashLight: THREE.PointLight | null = null; private flashSprite: THREE.Sprite | null = null; private flashT = 9; private flashOverlay: HTMLDivElement | null = null;
  flashBang(x: number, z: number) {
    if (!this.flashSprite) {
      this.flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('rgba(255,255,255,1)', 'rgba(255,250,235,0)'), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true }));
      this.flashSprite.renderOrder = 20; this.scene.add(this.flashSprite);
    }
    this.flashSprite.position.set(x, 1.0, z); this.flashT = 0;
    if (this.flashLight) this.flashLight.position.set(x, 1.4, z);
    this.fx.event(`flash:${x.toFixed(1)}:${z.toFixed(1)}:${this.time.toFixed(2)}`, 'sparks', x, z);
    for (let i = 0; i < 3; i++) this.fx.emit(`flsm:${this.time.toFixed(2)}:${i}`, 'smoke', x + (i - 1) * 0.4, 0.4, z, 0.5, 1, 0.8);
    // the screen whites out briefly, more when the bang is near the middle of the view and the camera is close
    const sc = this.toScreen(x, 1, z); const w = this.container.clientWidth, h = this.container.clientHeight;
    const off = Math.hypot(sc.x / w - 0.5, sc.y / h - 0.5); const near = THREE.MathUtils.clamp(40 / this.dist, 0.4, 1.4);
    const amt = THREE.MathUtils.clamp((0.75 - off) * near, 0, 0.85);
    if (amt > 0.03) {
      if (!this.flashOverlay) { this.flashOverlay = document.createElement('div'); this.flashOverlay.style.cssText = 'position:absolute;inset:0;background:#fff;pointer-events:none;opacity:0;z-index:5;'; this.container.appendChild(this.flashOverlay); }
      const o = this.flashOverlay; o.style.transition = 'none'; o.style.opacity = String(amt); void o.offsetWidth; o.style.transition = 'opacity 0.9s ease-out'; o.style.opacity = '0';
    }
  }
  private stepFlash(dt: number) {
    if (this.flashT > 2 || !this.flashSprite) { if (this.flashLight) this.flashLight.intensity = 0; if (this.flashSprite) this.flashSprite.visible = false; return; }
    this.flashT += dt; const k = this.flashT;
    this.flashSprite.visible = true; const s = 2 + Math.min(1, k / 0.08) * 10; this.flashSprite.scale.set(s, s, 1);
    (this.flashSprite.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - k / 0.45);
    if (this.flashLight) this.flashLight.intensity = Math.max(0, 900 * (1 - k / 0.3));
  }

  /** world position of a figure's right hand (rigged models), or about hand height beside it */
  private handPos(unitId: number, out: THREE.Vector3): boolean {
    const h = this.humans.get(unitId); if (!h) return false;
    const r = h.root as THREE.Object3D & { __hand?: THREE.Object3D | null };
    if (r.__hand === undefined) r.__hand = r.getObjectByName('RightHand') ?? r.getObjectByName('hand_socket') ?? null;
    if (r.__hand) { r.__hand.getWorldPosition(out); return true; }
    out.set(r.position.x + Math.cos(r.rotation.y) * 0.3, 1.1, r.position.z - Math.sin(r.rotation.y) * 0.3); return true;
  }
  private gasVis = new Map<number, { can: THREE.Object3D; haze: THREE.Mesh; ring: THREE.Mesh }>();
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
        const can = c.kind === 'flash' ? flashbangModel() : new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.6, roughness: 0.4 }));
        const haze = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.hazeTex, color: 0xa9a69e, transparent: true, opacity: 0, depthWrite: false }));
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0, depthWrite: false }));
        haze.renderOrder = 2; ring.renderOrder = 3; this.scene.add(can, haze, ring); v = { can, haze, ring }; this.gasVis.set(c.id, v);
      }
      // in an officer's hand through his wind-up, or in a rioter's hand once he has grabbed it
      const inHand = !c.landed && c.t < 0 ? c.by : c.pick && c.pick.t > 0.35 + 0.6 * 0.55 ? c.pick.by : -1;
      if (v.can.userData.base === undefined) v.can.userData.base = v.can.scale.x;
      v.can.scale.setScalar(v.can.userData.base * (inHand >= 0 ? 0.6 : 1)); // true-ish size in the hand, larger on the ground so it reads
      if (inHand >= 0 && this.handPos(inHand, this.tmpV)) { v.can.position.copy(this.tmpV); v.can.rotation.set(0, 0, 0.3); v.haze.visible = false; v.ring.visible = false; continue; }
      if (!c.landed) {
        const k = Math.max(0, Math.min(1, c.t / T.flight));
        v.can.position.set(c.fromX + (c.x - c.fromX) * k, 1.5 + Math.sin(k * Math.PI) * 3.2 - k * 1.4, c.fromZ + (c.z - c.fromZ) * k);
        v.can.rotation.set(c.t * 9, 0, c.t * 5);
        if (c.kind === 'gas') this.fx.emit(`gast:${c.id}`, 'tear_gas', v.can.position.x, v.can.position.y, v.can.position.z, 0.05, 0.8, 0.35); // thin trail
        continue;
      }
      v.can.position.set(c.x, 0.06, c.z); v.can.rotation.set(Math.PI / 2, 0, c.id);
      if (c.kind === 'flash') { v.haze.visible = false; v.ring.visible = false; v.can.rotation.set(Math.PI / 2, 0, c.id + c.t * 0.3); continue; } // lies on the setts, fuse burning
      const life = Math.max(0, 1 - Math.max(0, c.t - (T.life - 3)) / 3);
      // the cloud: jet at the canister plus puffs around it, spread to the cloud's radius
      this.fx.emit(`gasc:${c.id}`, 'tear_gas', c.x, 0.25, c.z, 0.4, 2.2 * life, 1.1);
      for (let i = 0; i < 6; i++) {
        const a = i * 1.047 + c.id, rr = c.r * (i % 2 ? 0.7 : 0.4);
        this.fx.emit(`gas${i}:${c.id}`, 'tear_gas', c.x + Math.cos(a) * rr, 0.5, c.z + Math.sin(a) * rr, c.r * 0.35, 1.1 * life, 1.6);
      }
      v.haze.position.set(c.x, 0.09, c.z); v.haze.scale.setScalar(Math.max(0.1, c.r * 1.35));
      (v.haze.material as THREE.MeshBasicMaterial).opacity = 0.42 * Math.min(1, c.t / 1.2) * life;
      // a faint ring on the ground marks where the gas works
      v.ring.position.set(c.x, 0.1, c.z); v.ring.scale.setScalar(Math.max(0.1, c.r)); (v.ring.material as THREE.MeshBasicMaterial).opacity = 0.4 * Math.min(1, c.t / 1.2) * life;
    }
    for (const [id, v] of this.gasVis) if (!live.has(id)) { this.scene.remove(v.can, v.haze, v.ring); v.haze.geometry.dispose(); v.ring.geometry.dispose(); this.gasVis.delete(id); }
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

  // ---- background riot crowd in the side streets beyond the play area (scenery: no icons, no gameplay, never tappable)
  // ---- scenery fires up the side streets: burnt-out cars and bonfires of bins blaze during a riot, smoulder in between
  private riotFx: { x: number; z: number; glow: THREE.Sprite; pool: THREE.Mesh; heat: number }[] | null = null;
  private stepRiotFires(g: Game, dt: number) {
    const list = this.map.riotFires; if (!list?.length) return;
    if (!this.riotFx) {
      this.riotFx = list.map((f, i) => {
        if (f.kind === 'car') { const c = buildCar(0x333333, true); c.position.set(f.x, 0, f.z); c.rotation.y = f.rot ?? 0; this.scene.add(c); }
        else for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: k % 2 ? 0x2c3a2c : 0x3a3a3e, roughness: 0.8 })); b.position.set(f.x + (k % 2) * 0.8 - 0.4, 0.45, f.z + Math.floor(k / 2) * 0.7 - 0.35); b.rotation.y = i + k * 0.7; b.rotation.z = k === 3 ? 1.3 : 0; this.scene.add(b); }
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('rgba(255,150,50,0.75)', 'rgba(255,90,20,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
        glow.position.set(f.x, 1.6, f.z); glow.scale.set(7, 7, 1); this.scene.add(glow);
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(11, 11).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,120,40,0.5)', 'rgba(255,90,20,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
        pool.position.set(f.x, 0.05, f.z + 1.5); this.scene.add(pool);
        return { x: f.x, z: f.z, glow, pool, heat: 0 };
      });
    }
    const riot = g.phase === 'wave' || (this.side === 'looters' && !g.over);
    this.riotFx.forEach((r, i) => {
      // each blaze catches a few seconds apart when a wave starts and dies down slowly after it
      const want = riot ? 1 : 0.12; const rate = riot ? 0.25 + i * 0.05 : 0.04;
      r.heat += (want - r.heat) * Math.min(1, dt * rate);
      const flick = 0.85 + Math.sin(this.time * (11 + i) + i) * 0.1 + Math.sin(this.time * 23.7 + i * 2) * 0.05;
      (r.glow.material as THREE.SpriteMaterial).opacity = Math.max(0, r.heat - 0.15) * flick;
      (r.pool.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.heat - 0.15) * flick;
      if (r.heat > 0.3) this.fx.emit(`rfire${i}`, 'fire', r.x, 0.5, r.z, 1.3, r.heat, 1.6);
      if (r.heat > 0.05 && i < 2) this.fx.emit(`rplume${i}`, 'plume', r.x, 2.4, r.z, 1, Math.max(0.35, r.heat), 1.3); // the wrecks' smoke keeps smouldering
      else if (r.heat > 0.3) this.fx.emit(`rsmoke${i}`, 'smoke', r.x, 2.2, r.z, 0.8, r.heat, 1.4);
    });
  }

  // ---- placement preview: the barrier as it will stand, before it is put down
  private ghost: THREE.Group | null = null; private ghostKind = '';
  setGhost(kind: string | null, at: { x: number; z: number; rot: number } | null, ok: boolean) {
    if (!kind || !at) { if (this.ghost) this.ghost.visible = false; return; }
    if (!this.ghost || this.ghostKind !== kind) {
      if (this.ghost) this.scene.remove(this.ghost);
      const big = kind === 'concrete';
      this.ghost = buildBarrierModel(big ? 'large' : 'small', big);
      this.ghost.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: 0.55, depthWrite: false }); } });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.75, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x36e0ff, transparent: true, opacity: 0.6, depthWrite: false })); ring.position.y = 0.06; ring.name = 'ring'; this.ghost.add(ring);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 3).rotateZ(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); arrow.position.set(1.95, 0.1, 0); arrow.name = 'arrow'; this.ghost.add(arrow); // the drag handle direction
      this.ghostKind = kind; this.scene.add(this.ghost);
    }
    this.ghost.visible = true; this.ghost.position.set(at.x, 0, at.z); this.ghost.rotation.y = (at.rot * Math.PI) / 180;
    const col = ok ? 0x36e0ff : 0xff4a3a;
    this.ghost.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.name !== 'arrow') (m.material as THREE.MeshBasicMaterial).color.setHex(col); });
  }

  private backdrop: { h: CharacterVisual; x: number; z: number; tx: number; tz: number; wait: number; lane: number; speed: number; flee: boolean }[] = [];
  private stepBackdrop(g: Game, dt: number) {
    const lanes = this.map.backdropCrowd; if (!lanes?.length) return;
    const riot = g.phase === 'wave' || (this.side === 'looters' && !g.over);
    if (!this.backdrop.length) {
      const n = this.reducedFx ? 10 : 26; const kinds: AnyKind[] = ['runner', 'carrier', 'vandal', 'heavy', 'thrower'];
      for (let i = 0; i < n; i++) {
        const lane = i % lanes.length, L = lanes[lane];
        const h = createCharacter(kinds[i % kinds.length], 900 + i); noReflection(h.root); h.icon.visible = false; h.root.visible = false; this.scene.add(h.root);
        const x = L.x0 + Math.random() * (L.x1 - L.x0);
        this.backdrop.push({ h, x, z: L.z0 - 6 - Math.random() * 10, tx: x, tz: L.z0 + Math.random() * (L.z1 - L.z0), wait: Math.random() * 2, lane, speed: 1 + Math.random() * 0.9, flee: false });
      }
    }
    for (const b of this.backdrop) {
      const L = lanes[b.lane];
      if (riot && !b.h.root.visible) { b.h.root.visible = true; b.z = L.z0 - 6 - Math.random() * 10; b.tz = L.z0 + Math.random() * (L.z1 - L.z0); } // walk in from far up the street
      if (!riot && b.h.root.visible) { b.tz = L.z0 - 14; b.flee = false; } // the riot is over: everyone drifts off
      if (!b.h.root.visible) continue;
      const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
      let moving = false;
      if (d > 0.3) { const sp = (b.flee ? 2.6 : b.speed) * dt; b.x += (dx / d) * Math.min(sp, d); b.z += (dz / d) * Math.min(sp, d); moving = true; b.h.root.rotation.y = Math.atan2(dx, dz); }
      else if (!riot) { b.h.root.visible = false; continue; }
      else if ((b.wait -= dt) <= 0) {
        // mill around: short hops, sometimes a run towards the square and back (as in the riot shots)
        b.flee = Math.random() < 0.15; b.wait = 1 + Math.random() * 4;
        for (let k = 0; k < 6; k++) { // not inside the burning wrecks or the barricade
          b.tx = L.x0 + Math.random() * (L.x1 - L.x0); b.tz = Math.max(L.z0, Math.min(L.z1, b.z + (Math.random() - 0.5) * 10));
          const blocked = [...(this.map.riotFires ?? []), ...this.map.props.filter((pp) => pp.type === 'barricade_fire' || pp.type === 'car' || pp.type === 'police_van')].some((f) => Math.hypot(f.x - b.tx, f.z - b.tz) < 3);
          if (!blocked) break;
        }
      } else { // standing: face the square, shouting
        let df = Math.PI - b.h.root.rotation.y; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2; b.h.root.rotation.y += df * Math.min(1, dt * 2);
      }
      b.h.root.position.set(b.x, 0, b.z);
      b.h.update(moving ? (b.flee ? 'flee' : 'walk') : 'idle', moving, moving ? (b.flee ? 2.6 : b.speed) : 0, false, dt);
    }
  }

  // ---- riot litter (image 07): paper, cardboard, bags and bottles pile up around broken shops and along the rioters'
  // routes as the riot goes on; it stays for the rest of the match. Scenery only, instanced (4 draw calls).
  // (fallen barrier: a flat steel crowd fence, frame and bars, lying on the ground)
  private litter: { kinds: THREE.InstancedMesh[]; n: number[]; acc: number; seed: number; spilled: Set<number> } | null = null;
  private stepLitter(g: Game, dt: number) {
    if (!this.litter) {
      const max = this.reducedFx ? 60 : 180; const LT = litterTextures();
      const mk = (geo: THREE.BufferGeometry, mat: THREE.Material) => { const m = new THREE.InstancedMesh(geo, mat, max); m.count = 0; m.receiveShadow = true; m.frustumCulled = false; m.layers.set(NO_REFLECT_LAYER); this.scene.add(m); return m; };
      this.litter = { kinds: [
        mk(crumpled(new THREE.PlaneGeometry(0.3, 0.22, 4, 3).rotateX(-Math.PI / 2), 0.025, 3), new THREE.MeshStandardMaterial({ map: LT.paper, roughness: 0.92, side: THREE.DoubleSide })), // printed paper, flyers
        mk(new THREE.BoxGeometry(0.42, 0.28, 0.32), new THREE.MeshStandardMaterial({ map: LT.cardboard, roughness: 0.95 })), // taped and labelled cardboard boxes
        mk(crumpled(new THREE.IcosahedronGeometry(0.17, 1).scale(1, 0.62, 1.15), 0.035, 5), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.28, metalness: 0.15, envMapIntensity: 1.6 })), // shiny bin bags
        mk(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2f5a35, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 })), // bottles
        mk(crumpled(new THREE.PlaneGeometry(0.55, 0.42, 5, 4).rotateX(-Math.PI / 2), 0.05, 7), new THREE.MeshStandardMaterial({ map: LT.fabric, color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide })), // 4: dropped clothes, crumpled (per-piece colour)
        mk(new THREE.BoxGeometry(0.42, 0.3, 0.32), new THREE.MeshStandardMaterial({ map: LT.product, roughness: 0.55 })), // 5: printed electronics boxes (image 06)
        mk(new THREE.BoxGeometry(0.14, 0.08, 0.14), new THREE.MeshStandardMaterial({ map: LT.giftbox, color: 0xffffff, roughness: 0.35, metalness: 0.3 })), // 6: jewellery / phone boxes (per-piece colour)
        mk(new THREE.CircleGeometry(0.09, 3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xcfe6f2, roughness: 0.05, metalness: 0.9, emissive: 0x405060, emissiveIntensity: 0.6 })), // 7: glass shards
        mk(new THREE.CylinderGeometry(0.32, 0.28, 0.9, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2c3a2e, roughness: 0.55, metalness: 0.3 })), // 8: tipped-over bins (image 05)
        mk(fallenBarrierGeometry(), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.75 })), // 9: knocked-over crowd barriers (image 05)
      ], n: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], acc: 0, seed: 1, spilled: new Set() };
      for (const k of [4, 6]) { this.litter.kinds[k].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3); }
    }
    const L = this.litter; const max = L.kinds[0].instanceMatrix.count;
    const rnd = () => { L.seed = (L.seed * 16807) % 2147483647; return L.seed / 2147483647; };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
    const COL = [0xb8242c, 0x2a4fa8, 0xe8e3d0, 0x1d1f24, 0xc98a2a, 0x3d7a4a, 0x8a3fa0, 0xd8d0c0]; const col = new THREE.Color();
    const drop = (x: number, z: number, spread: number, kind?: number) => {
      const k = kind ?? [0, 0, 0, 1, 1, 2, 3][Math.floor(rnd() * 7)]; if (L.n[k] >= (k === 8 ? 8 : k === 9 ? 5 : max)) return;
      const px = x + (rnd() - 0.5) * spread, pz = z + (rnd() - 0.5) * spread * 0.6; if (!g.nav.walkable(px, pz)) return;
      const y = [0.05, 0.14, 0.09, 0.05, 0.07, 0.18, 0.04, 0.02, 0.3, 0.04][k];
      e.set(k === 1 || k === 5 ? (rnd() < 0.3 ? Math.PI / 2 : 0) : 0, rnd() * Math.PI * 2, 0); q.setFromEuler(e); const s2 = 0.7 + rnd() * 0.6; sc.set(s2, k === 4 ? s2 * (0.6 + rnd()) : s2, s2);
      const i = L.n[k]++; L.kinds[k].setMatrixAt(i, m4.compose(pos.set(px, y, pz), q, sc));
      if (L.kinds[k].instanceColor) { L.kinds[k].setColorAt(i, col.setHex(COL[Math.floor(rnd() * COL.length)])); L.kinds[k].instanceColor!.needsUpdate = true; }
      L.kinds[k].count = L.n[k]; L.kinds[k].instanceMatrix.needsUpdate = true;
    };
    // the moment a shop front gives way: glass sprays over the pavement and the first goods spill out (image 06)
    g.stores.forEach((s, i) => {
      if (s.structure > 0 || L.spilled.has(i)) return; L.spilled.add(i);
      const sd = this.map.stores[i]; const gx = s.door.x + sd.normal.x * 1.6, gz = s.door.z + sd.normal.z * 1.6;
      const goods = sd.kind === 'fashion' ? 4 : sd.kind === 'electronics' ? 5 : 6;
      for (let n = 0; n < (this.reducedFx ? 12 : 30); n++) drop(gx, gz, sd.width * 0.9, 7);
      for (let n = 0; n < (this.reducedFx ? 4 : (goods === 5 ? 7 : 12)); n++) drop(gx + sd.normal.x * 0.8, gz + sd.normal.z * 0.8, sd.width * 0.8, goods);
      for (let n = 0; n < 5; n++) drop(gx + sd.normal.x * 0.6, gz + sd.normal.z * 0.6, sd.width * 0.7, 1);
    });
    if (dt <= 0) return;
    // rioters drop things as they go (more when carrying loot); broken shop fronts spill goods onto the pavement
    L.acc += dt;
    if (L.acc < 0.5) return; L.acc = 0;
    for (const u of g.units) if (u.side === 'att' && (u.moving || u.state === 'collect') && rnd() < (u.carrying > 0 || u.state === 'collect' ? 0.25 : 0.06)) drop(u.x, u.z, 1.2);
    g.stores.forEach((s, i) => { if (s.structure <= 0 && rnd() < 0.45) { const sd = this.map.stores[i]; const goods = sd.kind === 'fashion' ? 4 : sd.kind === 'electronics' ? 5 : 6;
      drop(s.door.x + sd.normal.x * 2.2, s.door.z + sd.normal.z * 2.2, sd.width * 0.9, rnd() < (goods === 5 ? 0.25 : 0.5) ? goods : undefined); } });
    // the whole square fills up as the riot goes on (image 05): paper and bags blow around, bins get tipped over and a
    // few crowd barriers end up flat on the setts
    if (g.phase === 'wave' || (this.side === 'looters' && !g.over)) {
      const n = Math.min(3, Math.ceil(g.attackers().length / 4));
      const b = this.map.bounds;
      for (let i = 0; i < n; i++) drop(b.x0 + 6 + rnd() * (b.x1 - b.x0 - 12), b.z0 + 14 + rnd() * (b.z1 - b.z0 - 20), 1.5, rnd() < 0.7 ? 0 : undefined);
      if (rnd() < 0.04) drop(b.x0 + 8 + rnd() * (b.x1 - b.x0 - 16), b.z0 + 16 + rnd() * (b.z1 - b.z0 - 24), 1, 8);
      if (rnd() < 0.02) drop(b.x0 + 8 + rnd() * (b.x1 - b.x0 - 16), b.z0 + 16 + rnd() * (b.z1 - b.z0 - 24), 1, 9);
    }
    // looters carrying goods lose a piece now and then
    for (const u of g.units) if (u.side === 'att' && u.carrying > 0 && u.moving && rnd() < 0.08 && u.carryStore >= 0) { const sd = this.map.stores[u.carryStore]; drop(u.x, u.z, 0.8, sd.kind === 'fashion' ? 4 : sd.kind === 'electronics' ? 5 : 6); }
  }

  render(g: Game, dt: number) {
    if (this.touchDevice && (this.frameNo++ % 4 === 0)) this.renderer.shadowMap.needsUpdate = true;
    if (this.disposed) return;
    this.gameRef = g;
    this.time += dt;
    this.stepBackdrop(g, dt);
    this.stepLitter(g, dt);
    this.stepRiotFires(g, dt);
    this.stepFlash(dt);
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
      if (!h) { const own = u.role === 'romeo' ? 'char.romeo' : u.hack ? `char.hacker.${u.hack.skill}` : ''; h = (own && slotStatus(own) === 'final' ? createCharacterFromSlot(own, u.kind, u.variant) : null) ?? createCharacter(u.kind, u.variant); noReflection(h.root); this.humans.set(u.id, h); this.scene.add(h.root); h.root.position.set(u.x, 0, u.z); }
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
        // a guard in formation keeps his side covered: he turns to a rioter only when one comes close (in his half),
        // otherwise he looks around a little within his own sector
        const near = u.holdFacing !== undefined ? 6 : 12; let best = near;
        for (const a of g.units) if (a.side === 'att') { const d = Math.hypot(a.x - u.x, a.z - u.z); const fa = Math.atan2(a.x - u.x, a.z - u.z); let off = fa - u.facing; while (off > Math.PI) off -= Math.PI * 2; while (off < -Math.PI) off += Math.PI * 2; if (d < best && (u.holdFacing === undefined || Math.abs(off) < 1.7)) { best = d; face = fa; } }
        if (best >= near) face += Math.sin(this.time * (0.18 + (u.id % 5) * 0.04) + u.id * 1.7) * (u.holdFacing !== undefined ? 0.35 : 0.55);
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
      let firebomb = true;
      if (u.side === 'att' && g.time - u.throwBackAt < BALANCE.throw.duration) { pose = 'throw'; action = (g.time - u.throwBackAt) / BALANCE.throw.duration; firebomb = false; } // the full throw: wind-up, release, follow-through
      else if (u.side === 'att' && g.time - u.pickAt < 0.6) { pose = 'pickup'; action = (g.time - u.pickAt) / 0.6; firebomb = false; } // bends down and grabs the canister
      else if (u.staggerUntil > g.time && pose !== 'strike' && pose !== 'throw' && !g.gas.some((c) => c.pick?.by === u.id)) pose = u.side === 'att' ? (mv.moving ? 'flee' : 'held') : 'brace'; // blinded and reeling: stumbles away with the arms over the face
      h.update(pose, mv.moving, mv.speed, u.carrying > 0 || lootPhase === 'out', dt * (g.over ? 0.3 : 1), action, firebomb);
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
        c = createCharacter(n.role === 'patron' ? 'civilian' : n.role === 'police' ? 'security' : n.role, n.variant); noReflection(c.root);
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
      v.update(s.structure / s.maxStructure, s.stock / 100, s.shutterLevel, s.structure <= 0 || (s.openUntil ?? 0) > g.time, s.boards / s.boardsMax); // a hacked shutter stands open
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
      if ((s.openUntil ?? 0) > g.time) this.bar('so' + i, s.door.x, 3.6, s.door.z, (s.openUntil! - g.time) / BALANCE.looters.hacker.shutterOpen, '#ffb020', 'OPEN');
    });
    // barriers
    const bseen = new Set<number>();
    for (const b of g.barriers) {
      bseen.add(b.id);
      let m = this.barriers.get(b.id);
      if (!m) { const slot = b.kind === 'barrier' ? 'prop.barrier' : 'prop.concrete'; m = ((slotStatus(slot) === 'final' ? cloneModel(slot) : null) as THREE.Group | null) ?? buildBarrierModel(b.kind === 'barrier' ? 'small' : 'large', b.size === 'large'); m.position.set(b.x, 0, b.z); m.rotation.y = (b.rot * Math.PI) / 180; noReflection(m); this.scene.add(m); this.barriers.set(b.id, m); }
      if (b.broken) { m.rotation.z = Math.min(1.45, b.brokenT * 4) * (b.size === 'small' ? 1 : 0.15); m.position.y = b.size === 'small' ? 0.05 : 0; if (b.size === 'large') m.children.forEach((c, i) => { c.rotation.y = i * 0.4; c.position.z = (i % 2) * 0.8; }); }
      else if (b.hp < b.maxHp) this.bar('b' + b.id, b.x, 1.6, b.z, b.hp / b.maxHp, '#e0e0e0');
    }
    for (const [id, m] of this.barriers) if (!bseen.has(id)) { this.scene.remove(m); this.barriers.delete(id); }
    // camera masts + coverage
    for (const c of g.cameras) {
      if (this.masts.has(c.id)) continue;
      const m = (slotStatus('prop.camera_mast') === 'final' ? cloneModel('prop.camera_mast') : null) ?? buildMastModel(); m.position.set(c.x, 0, c.z); noReflection(m); this.scene.add(m); this.masts.set(c.id, m);
    }
    // hackers at work, and what they switched off (time left)
    for (const u of g.units) if (u.hack && u.hack.t > 0) this.bar('h' + u.id, u.x, 2.3, u.z, u.hack.t / BALANCE.looters.hacker.work, '#ffb020', 'HACK');
    for (const c of g.cameras) if ((c.offUntil ?? 0) > g.time) this.bar('co' + c.id, c.x, 4.4, c.z, (c.offUntil! - g.time) / BALANCE.looters.hacker.cameraOff, '#ffb020', 'OFFLINE');
    // camera reach: one soft disc per camera, faint inside, a little stronger towards the rim and fading out (no hard edge)
    const want = (isDef || this.reducedFx === false ? g.cameras : []).filter((c) => !((c.offUntil ?? 0) > g.time)); // a hacked camera shows no reach
    const r = g.cameraRadius();
    while (this.coverage.children.length > want.length) this.coverage.remove(this.coverage.children[this.coverage.children.length - 1]);
    want.forEach((c, i) => {
      let disc = this.coverage.children[i] as THREE.Mesh | undefined;
      if (!disc) { disc = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: coverageTexture(), color: 0x36e0ff, transparent: true, opacity: isDef ? 0.3 : 0.2, depthWrite: false, toneMapped: false })); this.coverage.add(disc); }
      disc.position.set(c.x, 0.06, c.z); disc.scale.set(r, 1, r);
    });
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
    this.world.ambientFires.forEach((f, i) => { if (!this.ambientBurning(g, f)) return; this.fx.emit(`fire:amb${i}`, 'fire', f.x, 0.3, f.z, 1.4, 1, 1.8); this.fx.emit(`smoke:amb${i}`, 'smoke', f.x, 2.6, f.z, 1.2, 0.7, 1.8); this.fx.emit(`plume:amb${i}`, 'plume', f.x, 3.5, f.z, 1, 0.8, 1.3); });
    this.fx.setFireLights([...activeFires.filter((f) => !f.ambient), ...this.world.ambientFires.filter((f) => this.ambientBurning(g, f))], this.time);
    this.fireCrew.update(g, this.humans, dt, this.time); // engine, hose line, second man and water jet (scenery)
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
      if (!this.truck) { this.truck = buildTruck(); noReflection(this.truck); this.scene.add(this.truck); }
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
    if (this.post) {
      // zoomed in, lamp heads and wet-street highlights fill many pixels and the bloom blew them up into white blotches:
      // the glow eases off as the camera comes closer, and stays calm while the zoom is still moving
      const near = THREE.MathUtils.clamp((this.dist - this.minDist) / 30, 0, 1);
      const zooming = Math.abs(this.dist - this.lastDist) > 0.05; this.lastDist = this.dist;
      const wantS = (0.3 + 0.45 * near) * (zooming ? 0.6 : 1) * (this.night ? 1.3 : this.day ? 0.45 : 1), wantT = 0.82 + (1 - near) * 0.12 + (zooming ? 0.05 : 0);
      const b = this.post.bloom; b.strength += (wantS - b.strength) * 0.25; b.threshold += (wantT - b.threshold) * 0.25;
      this.post.render(this.time);
    } else this.renderer.render(this.scene, this.camera);
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
