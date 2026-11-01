import * as THREE from 'three';
import type { StoreDef, StoreKind } from '../maps/types';
import { crackTexture, shutterTexture } from './textures';
import { mergeStatic } from './merge';
import { getShopVisualState, SHOP_GROUPS, visibleStockCount, type ShopGroup } from './shopVisualState';
import { getModel } from './assets';
import { GROUND_H } from './haussmann';

// Paris shop module built from the realism pack (assets/paris_realism): config/paris_shops.json and
// docs/3D_BUILD_SPEC.md. One persistent shell per shop; damage, boards, shutter and stock are separate named groups
// whose visibility follows game state through getShopVisualState(). Pivot: door floor centre, facade towards +Z.

export type ShopId = 'electronics' | 'fashion' | 'jewelry' | 'grocery' | 'cafe' | 'sneakers';
export type Quality = 'mobile' | 'desktop';

interface ShopType { id: ShopId; sign: string; frame: string; trim: string; interior: string; floor: 'tile' | 'wood' | 'marble' | 'checker' | 'concrete' }
export const SHOP_TYPES: Record<ShopId, ShopType> = {
  electronics: { id: 'electronics', sign: 'VOLT', frame: '#14264a', trim: '#c7ccd4', interior: '#dfe7ef', floor: 'concrete' },
  fashion: { id: 'fashion', sign: 'ATELIER', frame: '#17553f', trim: '#c9a75a', interior: '#e8cfa2', floor: 'wood' },
  jewelry: { id: 'jewelry', sign: 'LUMIERE', frame: '#7c1d23', trim: '#c9a75a', interior: '#c99a5a', floor: 'marble' },
  grocery: { id: 'grocery', sign: 'MARCHE', frame: '#60705a', trim: '#d8c79a', interior: '#e8dcc0', floor: 'checker' },
  cafe: { id: 'cafe', sign: 'CAFE RIVE', frame: '#38261c', trim: '#c9a75a', interior: '#5a3a24', floor: 'checker' },
  sneakers: { id: 'sneakers', sign: 'COURT', frame: '#292b30', trim: '#d0d2d6', interior: '#f0efec', floor: 'concrete' },
};

export function shopIdForKind(kind: StoreKind): ShopId {
  switch (kind) {
    case 'jewellery': return 'jewelry';
    case 'electronics': case 'phones': return 'electronics';
    case 'fashion': case 'department': return 'fashion';
    case 'grocery': return 'grocery';
    case 'cafe': return 'cafe';
    case 'sneakers': case 'sports': return 'sneakers';
  }
}

// module dimensions (config/paris_shops.json "module")
export const MODULE = { width: 8, depth: 4, recess: 0.22, doorW: 1.4, doorH: 2.4, entrance: 0.3, plinth: 0.45 };
const W = MODULE.width, D = MODULE.depth, H = GROUND_H;
const WIN_TOP = 3.05, TRANSOM_TOP = 3.45, CEIL = 3.5;
const PANE_X0 = 0.95, PANE_X1 = W / 2 - 0.3; // display window span on each side of the door
const PANE_W = PANE_X1 - PANE_X0;

// ------------------------------------------------------------------ shared resources (reused by every shop)
const BOX = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);
const texCache = new Map<string, THREE.Texture>();
function ctex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false): THREE.Texture {
  let t = texCache.get(key);
  if (!t) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    texCache.set(key, t);
  }
  return t;
}
function seeded(seed: number) { let s = (seed % 2147483647) || 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

const matCache = new Map<string, THREE.Material>();
function M(key: string, make: () => THREE.Material): THREE.Material { let m = matCache.get(key); if (!m) { m = make(); matCache.set(key, m); } return m; }
// physically distinct surfaces, starting values from config "material_starting_values"
const limestone = () => M('limestone', () => new THREE.MeshStandardMaterial({ map: stoneTex(), color: 0xe9dcc2, roughness: 0.86, metalness: 0 }));
const brass = () => M('brass', () => new THREE.MeshStandardMaterial({ color: 0xc9a14e, roughness: 0.34, metalness: 1 }));
const cardboard = () => M('cardboard', () => new THREE.MeshStandardMaterial({ color: 0xa77d4e, roughness: 0.95, metalness: 0 }));
const glassM = () => M('glass', () => new THREE.MeshStandardMaterial({ color: 0xd6e8f4, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 0.5 }));
const shardM = () => M('shard', () => new THREE.MeshStandardMaterial({ color: 0xe0f0ff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 2 }));
const plywood = () => M('plywood', () => new THREE.MeshStandardMaterial({ map: plyTex(), roughness: 0.85, metalness: 0 }));
const glowM = () => M('glowLamp', () => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(2.2) }); m.name = 'glow'; return m; });
const paint = (hex: string) => M('paint' + hex, () => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.46, metalness: 0 }));
const flat = (hex: number, rough = 0.6, metal = 0) => M(`flat${hex}-${rough}-${metal}`, () => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal }));
const emissive = (hex: number, k = 1.4) => M(`em${hex}-${k}`, () => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) }));

function stoneTex() { return ctex('lime', 256, 256, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3500; i++) { const v = 205 + Math.random() * 50; g.fillStyle = `rgba(${v},${v - 5},${v - 16},0.35)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 1 + Math.random() * 2); } }, true); }
function plyTex() { return ctex('ply', 256, 256, (g) => { g.fillStyle = '#c9a274'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(120,80,40,${0.1 + Math.random() * 0.25})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + Math.random() * 20 - 10, 170, y + Math.random() * 20 - 10, 256, y + Math.random() * 10 - 5); g.stroke(); } g.fillStyle = 'rgba(60,40,20,0.6)'; for (const [x, y] of [[10, 10], [246, 10], [10, 246], [246, 246], [128, 10], [128, 246]]) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); } }); }
function signTex(t: ShopType) {
  return ctex('sign-' + t.id, 1024, 128, (g) => {
    g.fillStyle = t.frame; g.fillRect(0, 0, 1024, 128);
    g.strokeStyle = t.trim; g.lineWidth = 3; g.strokeRect(10, 10, 1004, 108);
    g.fillStyle = t.trim; g.font = '500 66px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const txt = t.sign.split('').join(String.fromCharCode(8202)); g.fillText(txt, 512, 68);
    g.font = '28px Georgia, serif'; g.fillText('✦', 220, 66); g.fillText('✦', 804, 66);
  });
}
function floorTex(kind: ShopType['floor']) {
  return ctex('floor-' + kind, 128, 128, (g) => {
    if (kind === 'checker') for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e8e2d6' : '#2c2a28'; g.fillRect(x * 16, y * 16, 16, 16); }
    else if (kind === 'wood') for (let y = 0; y < 128; y += 16) { g.fillStyle = (y / 16) % 2 ? '#8a5e3c' : '#7a5034'; g.fillRect(0, y, 128, 15); }
    else if (kind === 'marble') { g.fillStyle = '#e6e0d8'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(120,110,100,0.25)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(Math.random() * 128, 0); g.bezierCurveTo(Math.random() * 128, 40, Math.random() * 128, 90, Math.random() * 128, 128); g.stroke(); } }
    else { g.fillStyle = '#b8bcc0'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(0, 63, 128, 2); g.fillRect(63, 0, 2, 128); }
  }, true);
}
function screenTex() { return ctex('screen', 128, 80, (g) => { const grd = g.createLinearGradient(0, 0, 128, 80); grd.addColorStop(0, '#1257b8'); grd.addColorStop(0.55, '#5fc1ff'); grd.addColorStop(1, '#6a32c6'); g.fillStyle = grd; g.fillRect(0, 0, 128, 80); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(88, 30, 16, 0, Math.PI * 2); g.fill(); }); }
function awningTex() { return ctex('awning', 128, 64, (g) => { for (let x = 0; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? '#efe3c8' : '#e2d2ae'; g.fillRect(x, 0, 16, 64); } }); }

/** adds a warm 'shop lighting' ambient to a standard material (keeps instance colours) */
export function warmInterior(mm: THREE.Material, strength = 0.62) {
  const sm = mm as THREE.MeshStandardMaterial;
  if (!sm.isMeshStandardMaterial || sm.userData.warmLit || sm.transparent) return;
  sm.userData.warmLit = true;
  sm.onBeforeCompile = (sh) => {
    // indoors: the cool sky/moon light barely reaches inside; warm shop lighting does
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n  reflectedLight.indirectDiffuse *= 0.12; reflectedLight.directDiffuse *= 0.35; reflectedLight.indirectSpecular *= 0.3;')
      .replace('#include <opaque_fragment>', `outgoingLight += diffuseColor.rgb * vec3(1.0, 0.8, 0.58) * ${strength.toFixed(2)};\n#include <opaque_fragment>`);
  };
  sm.customProgramCacheKey = () => 'warmInterior' + strength;
  sm.needsUpdate = true;
}

// ------------------------------------------------------------------ the module
export interface ShopModuleOptions { quality: Quality; seed: number; withLight: boolean }

type AddFn = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number) => THREE.Mesh;

export class ShopModule {
  readonly group = new THREE.Group();
  readonly groups = {} as Record<ShopGroup, THREE.Group>;
  readonly sockets: Record<string, THREE.Object3D> = {};
  readonly type: ShopType;
  hit: THREE.Mesh;
  light: THREE.PointLight | null = null;
  source: 'glb' | 'procedural' = 'procedural';
  private stockItems: { obj: THREE.Object3D; total: number }[] = [];
  private stockSlots = 0;
  private decals: THREE.Mesh[] = [];
  private debrisInst: THREE.InstancedMesh | null = null;
  private shutterCurtain: THREE.Object3D | null = null;
  private lod = -1;
  private wasBroken = false;
  /** set to true for one update() when the glass first breaks (for a one-shot effect) */
  justBroke = false;
  referenceState = 'intact';

  constructor(readonly def: StoreDef, readonly idx: number, readonly opts: ShopModuleOptions) {
    this.type = SHOP_TYPES[shopIdForKind(def.kind)];
    const g = this.group;
    g.position.set(def.front.x, 0, def.front.z);
    g.rotation.y = Math.atan2(def.normal.x, def.normal.z);
    const glb = getModel(`shop.${this.type.id}`);
    if (glb) this.fromGlb(glb.scene); else this.buildProcedural();
    // picking volume matching the visible shopfront
    this.hit = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.set(0, 2, 0.4); this.hit.scale.set(W + 0.8, H, 1.4); this.hit.userData.store = idx; g.add(this.hit);
    if (opts.withLight) { this.light = new THREE.PointLight(0xffcf96, 9, 9, 1.8); this.light.position.set(0, 2.9, -1.6); g.add(this.light); }
    this.update(1, 1, 1, false, 0);
  }

  /** final GLB: named groups and sockets come from the file (see ASSETS_TODO.md for the contract) */
  private fromGlb(scene: THREE.Object3D) {
    this.source = 'glb';
    const model = scene.clone(true); this.group.add(model);
    for (const name of SHOP_GROUPS) {
      const found = model.getObjectByName(name);
      const grp = new THREE.Group(); grp.name = name;
      if (found) { grp.add(found); }
      this.group.add(grp); this.groups[name] = grp;
    }
    for (const n of ['entrance', 'sign', 'light_left', 'light_right', ...[1, 2, 3, 4, 5, 6].map((i) => `pickup_0${i}`)]) { const o = model.getObjectByName(n); if (o) this.sockets[n] = o; }
    const stock = this.groups.stock;
    stock.traverse((o) => { if (o !== stock && o.parent && (o.parent === stock || o.parent.parent === stock) && (o as THREE.Mesh).isMesh) this.stockItems.push({ obj: o, total: 1 }); });
    this.stockSlots = this.stockItems.length;
  }

  private buildProcedural() {
    for (const name of SHOP_GROUPS) { const grp = new THREE.Group(); grp.name = name; this.groups[name] = grp; this.group.add(grp); }
    const add: AddFn = (geo, mat, parent, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; };
    const t = this.type; const G = this.groups;
    const frame = paint(t.frame); const trim = flat(new THREE.Color(t.trim).getHex(), 0.4, t.trim === '#c9a75a' ? 0.9 : 0.2);
    // ---- shell: pilasters (base + shaft + capital), shopfront frame, plinth, fascia, sign board, cornice
    for (const sx of [-1, 1]) {
      const px = sx * (W / 2 + 0.2);
      add(BOX, limestone(), G.shell, px, 0.3, 0.12, 0.5, 0.6, 0.34);            // base
      add(BOX, limestone(), G.shell, px, 2.1, 0.08, 0.4, 3.0, 0.26);            // shaft
      add(BOX, limestone(), G.shell, px, 3.75, 0.13, 0.5, 0.3, 0.36);           // capital
      add(BOX, limestone(), G.shell, px, 3.62, 0.1, 0.46, 0.06, 0.3);
      // painted outer posts of the shopfront, set back from the stone
      add(BOX, frame, G.shell, sx * (W / 2 - 0.12), TRANSOM_TOP / 2, -0.06, 0.24, TRANSOM_TOP, 0.24);
      // mullion posts between door and display windows
      add(BOX, frame, G.shell, sx * (PANE_X0 - 0.12), TRANSOM_TOP / 2, -0.1, 0.24, TRANSOM_TOP, 0.22);
      // stall riser (plinth) with a raised panel
      const cx = sx * (PANE_X0 + PANE_W / 2);
      add(BOX, frame, G.shell, cx, MODULE.plinth / 2, -0.12, PANE_W, MODULE.plinth, 0.22);
      add(BOX, frame, G.shell, cx, MODULE.plinth / 2, -0.005, PANE_W - 0.24, MODULE.plinth - 0.14, 0.03);
      // window recess reveals (0.22 m deep) and sill
      add(BOX, frame, G.shell, cx, MODULE.plinth + 0.02, -0.14, PANE_W, 0.04, 0.3);
      add(BOX, frame, G.shell, cx, WIN_TOP + 0.03, -0.12, PANE_W, 0.08, 0.24);
      // glazing bars of the transom
      for (const fx of [-PANE_W / 2, 0, PANE_W / 2]) add(BOX, frame, G.shell, cx + fx, (WIN_TOP + TRANSOM_TOP) / 2, -0.2, 0.05, TRANSOM_TOP - WIN_TOP, 0.05);
      // entrance reveals (entrance set 0.3 m back)
      add(BOX, frame, G.shell, sx * (MODULE.doorW / 2 + 0.06), MODULE.doorH / 2 + 0.3, -MODULE.entrance / 2, 0.12, MODULE.doorH + 0.6, MODULE.entrance);
    }
    add(BOX, frame, G.shell, 0, TRANSOM_TOP + 0.06, -0.08, W, 0.12, 0.26);                // head rail
    add(BOX, frame, G.shell, 0, 3.86, 0.06, W + 0.1, 0.62, 0.22);                         // fascia (winkelfries)
    const sign = add(PLANE, M('signmat-' + t.id, () => new THREE.MeshStandardMaterial({ map: signTex(t), emissiveMap: signTex(t), emissive: 0xffffff, emissiveIntensity: 0.28, roughness: 0.4 })), G.shell, 0, 3.86, 0.172, W - 0.6, 0.48);
    sign.name = 'sign_board';
    add(BOX, trim, G.shell, 0, 3.6, 0.17, W - 0.4, 0.03, 0.02);
    add(BOX, trim, G.shell, 0, 4.12, 0.17, W - 0.4, 0.03, 0.02);
    // multi-profile cornice
    add(BOX, limestone(), G.shell, 0, 4.22, 0.14, W + 1.0, 0.12, 0.4);
    add(BOX, limestone(), G.shell, 0, 4.32, 0.2, W + 1.1, 0.08, 0.52);
    add(BOX, limestone(), G.shell, 0, 4.39, 0.26, W + 1.2, 0.06, 0.64);
    // entrance floor (mosaic threshold) and door frame
    add(PLANE, M('thresh', () => new THREE.MeshStandardMaterial({ map: floorTex('checker'), roughness: 0.3 })), G.shell, 0, 0.014, -MODULE.entrance / 2, MODULE.doorW, MODULE.entrance).rotation.x = -Math.PI / 2;
    add(BOX, frame, G.shell, 0, MODULE.doorH + 0.02, -MODULE.entrance, MODULE.doorW + 0.1, 0.08, 0.1);
    for (const sx of [-1, 1]) add(BOX, frame, G.shell, sx * MODULE.doorW / 4, MODULE.doorH / 2, -MODULE.entrance - 0.02, 0.06, MODULE.doorH, 0.06);
    add(BOX, brass(), G.shell, 0.12, 1.1, -MODULE.entrance + 0.03, 0.03, 0.5, 0.03);
    add(BOX, brass(), G.shell, -0.12, 1.1, -MODULE.entrance + 0.03, 0.03, 0.5, 0.03);
    // wall lanterns (sockets light_left / light_right)
    for (const [name, sx] of [['light_left', -1], ['light_right', 1]] as const) {
      const lx = sx * (W / 2 + 0.2);
      add(BOX, flat(0x15171a, 0.4, 0.7), G.shell, lx, 2.75, 0.32, 0.05, 0.05, 0.28);
      add(new THREE.CylinderGeometry(0.11, 0.08, 0.3, 6), glowM(), G.shell, lx, 2.62, 0.45);
      add(new THREE.ConeGeometry(0.15, 0.14, 6), flat(0x15171a, 0.4, 0.7), G.shell, lx, 2.84, 0.45);
      const s = new THREE.Object3D(); s.name = name; s.position.set(lx, 2.62, 0.45); this.group.add(s); this.sockets[name] = s;
    }
    if (t.id === 'cafe') {
      // canvas awning over the terrace
      const aw = add(PLANE, M('awning', () => new THREE.MeshStandardMaterial({ map: awningTex(), roughness: 0.9, side: THREE.DoubleSide })), G.shell, 0, 3.12, 0.75, W - 0.3, 1.6);
      aw.rotation.x = -Math.PI / 2 + 0.45;
      add(BOX, M('awnv', () => new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 })), G.shell, 0, 2.72, 1.46, W - 0.3, 0.22, 0.02);
    }
    for (const [name, x, y, z] of [['entrance', 0, 0, 0.6], ['sign', 0, 3.86, 0.25]] as const) { const s = new THREE.Object3D(); s.name = name; s.position.set(x, y, z); this.group.add(s); this.sockets[name] = s; }

    // ---- interior box: floor, side walls, back wall at z = -4, ceiling with recessed lights
    const warm = new THREE.Color(0xffd9a8);
    const wallMat = M('iw-' + t.id, () => new THREE.MeshStandardMaterial({ color: new THREE.Color(t.interior), roughness: 0.8, emissive: new THREE.Color(t.interior).multiply(warm), emissiveIntensity: 0.6 })); // lit shop interiors glow like the concept windows
    const fl = floorTex(t.floor);
    const floorMat = M('if-' + t.id, () => { const tx = fl.clone(); tx.repeat.set(W / 1.6, D / 1.6); tx.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: tx, roughness: 0.3 }); });
    add(PLANE, floorMat, G.interior, 0, 0.01, -D / 2 - 0.15, W - 0.2, D - 0.3).rotation.x = -Math.PI / 2;
    add(PLANE, wallMat, G.interior, 0, CEIL / 2, -D, W - 0.2, CEIL);
    add(PLANE, wallMat, G.interior, -W / 2 + 0.1, CEIL / 2, -D / 2, D, CEIL).rotation.y = Math.PI / 2;
    add(PLANE, wallMat, G.interior, W / 2 - 0.1, CEIL / 2, -D / 2, D, CEIL).rotation.y = -Math.PI / 2;
    add(PLANE, M('ceil', () => new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.9, emissive: warm, emissiveIntensity: 0.12 })), G.interior, 0, CEIL, -D / 2, W - 0.2, D).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) add(new THREE.CircleGeometry(0.09, 10), emissive(0xfff1d6, 2.5), G.interior, -2.5 + i, CEIL - 0.01, -1.2 - (i % 2) * 1.6).rotation.x = Math.PI / 2;

    this.buildFixtures(add);
    // warm interior light without extra dynamic lights: a warm ambient term added in the shader keeps every
    // product's own (instance) colour. Shared materials are patched once.
    for (const grp of [G.interior, G.fixtures, G.stock]) grp.traverse((o) => {
      const mats = (o as THREE.Mesh).material; if (!mats) return;
      for (const mm of Array.isArray(mats) ? mats : [mats]) warmInterior(mm);
    });

    // ---- glass_intact: display panes recessed 0.22 m, transoms, door leaves
    for (const sx of [-1, 1]) {
      const cx = sx * (PANE_X0 + PANE_W / 2);
      add(PLANE, glassM(), G.glass_intact, cx, (MODULE.plinth + WIN_TOP) / 2, -MODULE.recess, PANE_W, WIN_TOP - MODULE.plinth);
      add(PLANE, glassM(), G.glass_intact, cx, (WIN_TOP + TRANSOM_TOP) / 2, -0.2, PANE_W, TRANSOM_TOP - WIN_TOP);
      // crack decals over the intact panes (damage_decals)
      const ck = add(PLANE, M('crack1', () => new THREE.MeshBasicMaterial({ map: crackTexture(1), transparent: true, depthWrite: false })), G.damage_decals, cx, (MODULE.plinth + WIN_TOP) / 2, -MODULE.recess + 0.01, PANE_W, WIN_TOP - MODULE.plinth);
      this.decals.push(ck);
    }
    add(PLANE, glassM(), G.glass_intact, 0, MODULE.doorH / 2, -MODULE.entrance - 0.03, MODULE.doorW, MODULE.doorH);
    add(PLANE, glassM(), G.glass_intact, 0, (MODULE.doorH + TRANSOM_TOP) / 2 + 0.03, -MODULE.entrance - 0.03, MODULE.doorW, TRANSOM_TOP - MODULE.doorH - 0.06);

    // ---- glass_broken: only jagged fragments still held by the frame edges (no panes left in the openings)
    const rnd = seeded(this.opts.seed * 31 + 7);
    const frag = new THREE.BufferGeometry(); const pts: number[] = [];
    const edgeFrags = (cx: number, y0: number, y1: number, w: number, z: number) => {
      const x0 = cx - w / 2, x1 = cx + w / 2;
      const tri = (ax: number, ay: number, bx: number, by: number, cx2: number, cy: number) => pts.push(ax, ay, z, bx, by, z, cx2, cy, z);
      for (let k = 0; k < 5; k++) { // top and bottom edges
        const u = x0 + (k + rnd()) * (w / 5), du = 0.15 + rnd() * 0.3;
        tri(u, y1, u + du, y1, u + du * 0.4, y1 - 0.2 - rnd() * 0.5);
        tri(u, y0, u + du, y0, u + du * 0.6, y0 + 0.1 + rnd() * 0.35);
      }
      for (let k = 0; k < 4; k++) { // side edges
        const v = y0 + (k + rnd()) * ((y1 - y0) / 4), dv = 0.2 + rnd() * 0.3;
        tri(x0, v, x0, v + dv, x0 + 0.12 + rnd() * 0.35, v + dv * 0.5);
        tri(x1, v, x1, v + dv, x1 - 0.12 - rnd() * 0.35, v + dv * 0.4);
      }
    };
    for (const sx of [-1, 1]) edgeFrags(sx * (PANE_X0 + PANE_W / 2), MODULE.plinth, WIN_TOP, PANE_W, -MODULE.recess);
    edgeFrags(0, 0, MODULE.doorH, MODULE.doorW, -MODULE.entrance - 0.03);
    frag.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); frag.computeVertexNormals();
    add(frag, shardM(), G.glass_broken, 0, 0, 0);

    // ---- boards: plywood sheets with battens over windows and door (protection layer)
    for (const sx of [-1, 1]) {
      const cx = sx * (PANE_X0 + PANE_W / 2);
      for (let k = 0; k < 2; k++) add(BOX, plywood(), G.boards, cx - PANE_W / 4 + k * PANE_W / 2 + (rnd() - 0.5) * 0.04, (MODULE.plinth + TRANSOM_TOP) / 2, 0.02, PANE_W / 2 - 0.02, TRANSOM_TOP - MODULE.plinth - 0.1, 0.03).rotation.z = (rnd() - 0.5) * 0.02;
      for (const y of [1.0, 2.6]) add(BOX, plywood(), G.boards, cx, y, 0.05, PANE_W + 0.1, 0.12, 0.03);
    }
    add(BOX, plywood(), G.boards, 0, MODULE.doorH / 2 + 0.25, 0.02, MODULE.doorW + 0.2, MODULE.doorH + 0.5, 0.03);
    add(BOX, plywood(), G.boards, 0, 1.6, 0.05, MODULE.doorW + 0.3, 0.12, 0.03).rotation.z = 0.5;

    // ---- shutters: housing (shell) + curtain lowered by shutter level; bent version replaces it at heavy damage
    add(BOX, flat(0x4d5157, 0.4, 0.7), G.shell, 0, TRANSOM_TOP + 0.22, 0.05, W - 0.5, 0.26, 0.26);
    const st = shutterTexture().clone(); st.repeat.set(W / 2, 1); st.needsUpdate = true;
    const curtain = add(PLANE, M('shut-' + t.id, () => new THREE.MeshStandardMaterial({ map: st, roughness: 0.35, metalness: 0.75, color: 0xc8d2dc, side: THREE.DoubleSide })), G.shutter_intact, 0, TRANSOM_TOP, 0.0, W - 0.6, 1);
    this.shutterCurtain = curtain;
    const slatMat = M('slat', () => new THREE.MeshStandardMaterial({ map: shutterTexture(), roughness: 0.4, metalness: 0.7, color: 0x7d8288, side: THREE.DoubleSide }));
    for (let k = 0; k < 6; k++) {
      const sl = add(BOX, slatMat, G.shutter_bent, -W * 0.12 + Math.sin(k) * 0.35, TRANSOM_TOP - 0.15 - k * 0.22, 0.12 + k * 0.07, (W - 0.8) * (0.96 - k * 0.05), 0.2, 0.03);
      sl.rotation.set(-0.12 - k * 0.12, 0, 0.07 * Math.sin(k * 1.7));
    }

    // ---- debris: seeded glass shards and cardboard on the pavement, entrance kept clear
    const maxShards = this.opts.quality === 'mobile' ? 12 : 30;
    const shards = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shardM(), maxShards);
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler();
    for (let k = 0; k < maxShards; k++) {
      let x = (rnd() - 0.5) * (W - 0.6); if (Math.abs(x) < 0.9) x = Math.sign(x || 1) * (0.9 + rnd() * 0.6);
      const z = 0.15 + rnd() * 1.5;
      e.set((rnd() - 0.5) * 0.3, rnd() * 6, (rnd() - 0.5) * 0.3); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(x, 0.025, z), q, new THREE.Vector3(0.06 + rnd() * 0.16, 1, 0.04 + rnd() * 0.12)); shards.setMatrixAt(k, m4);
    }
    G.debris.add(shards); this.debrisInst = shards;
    const nBoxes = this.opts.quality === 'mobile' ? 3 : 6;
    for (let k = 0; k < nBoxes; k++) {
      let x = (rnd() - 0.5) * (W - 1); if (Math.abs(x) < 1.0) x = Math.sign(x || 1) * (1.0 + rnd() * 0.8);
      const b = add(BOX, cardboard(), G.debris, x, 0.14, 0.4 + rnd() * 1.2, 0.4, 0.28, 0.32); b.rotation.set(rnd() < 0.3 ? Math.PI / 2 : 0, rnd() * 6, 0); b.castShadow = true;
    }

    // static groups are merged per material (one draw call per material and group)
    for (const name of ['shell', 'interior', 'fixtures', 'glass_intact', 'boards', 'shutter_bent'] as ShopGroup[]) mergeStatic(G[name]);
  }

  /** fixtures and stock per shop type (docs/3D_BUILD_SPEC.md "Interieurs per type") */
  private buildFixtures(add: AddFn) {
    const G = this.groups; const t = this.type; const rnd = seeded(this.opts.seed * 13 + 3);
    const wood = flat(0x6a4a32, 0.5), dark = flat(0x2a2422, 0.5), white = flat(0xf0f0ee, 0.4), metal = flat(0x2a2c30, 0.3, 0.8);
    const vitrine = M('vitrine', () => new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }));
    // stock: InstancedMesh per product type in a fixed, seeded order so removal never flickers
    const stock = (geo: THREE.BufferGeometry, mat: THREE.Material, pts: [number, number, number, number?][], colors?: number[]) => {
      const im = new THREE.InstancedMesh(geo, mat, pts.length); const m4 = new THREE.Matrix4();
      pts.forEach(([x, y, z, ry], i) => { m4.makeRotationY(ry ?? 0); m4.setPosition(x, y, z); im.setMatrixAt(i, m4); if (colors) im.setColorAt(i, new THREE.Color(colors[Math.floor(rnd() * colors.length)])); });
      G.stock.add(im); this.stockItems.push({ obj: im, total: pts.length }); this.stockSlots += pts.length;
    };
    const backShelves = (mat: THREE.Material, ys: number[]) => { for (const y of ys) add(BOX, mat, G.fixtures, 0, y, -D + 0.22, W - 0.6, 0.05, 0.36); };
    const pickups = [[-2.4, -1.2], [2.4, -1.2], [-1.2, -2.4], [1.2, -2.4], [-2.6, -3.3], [2.6, -3.3]];
    pickups.forEach(([x, z], i) => { const s = new THREE.Object3D(); s.name = `pickup_0${i + 1}`; s.position.set(x, 0.9, z); G.fixtures.add(s); this.sockets[s.name] = s; });

    switch (t.id) {
      case 'electronics': {
        for (const [x, z] of [[-1.7, -1.5], [1.7, -1.5]]) { add(BOX, white, G.fixtures, x, 0.45, z, 1.7, 0.9, 0.9); add(BOX, dark, G.fixtures, x, 0.04, z, 1.6, 0.08, 0.8); }
        backShelves(white, [1.1, 1.75, 2.4]);
        add(BOX, dark, G.fixtures, -2.3, 2.05, -D + 0.04, 1.6, 0.92, 0.04); add(BOX, dark, G.fixtures, 2.3, 2.05, -D + 0.04, 1.6, 0.92, 0.04);
        stock(new THREE.PlaneGeometry(1.5, 0.84), M('scr', () => new THREE.MeshBasicMaterial({ map: screenTex(), color: new THREE.Color(1.3, 1.3, 1.3) })), [[-2.3, 2.05, -D + 0.07], [2.3, 2.05, -D + 0.07]]);
        const dev: [number, number, number, number][] = [];
        for (const [x, z] of [[-1.7, -1.5], [1.7, -1.5]]) for (let i = 0; i < 3; i++) dev.push([x - 0.55 + i * 0.55, 0.92, z, (rnd() - 0.5) * 0.2]);
        stock(new THREE.BoxGeometry(0.36, 0.24, 0.016).translate(0, 0.12, 0).rotateX(-0.28), M('dev', () => new THREE.MeshBasicMaterial({ map: screenTex() })), dev);
        const boxes: [number, number, number][] = [];
        for (const y of [1.25, 1.9, 2.55]) for (let i = 0; i < 7; i++) boxes.push([-W / 2 + 0.7 + i * (W - 1.4) / 6, y, -D + 0.25]);
        stock(new THREE.BoxGeometry(0.3, 0.22, 0.2), white, boxes);
        break;
      }
      case 'fashion': {
        for (const x of [-2.3, 2.3]) {
          add(BOX, metal, G.fixtures, x, 1.6, -2.6, 1.5, 0.03, 0.03);
          for (const sx of [-0.75, 0.75]) add(BOX, metal, G.fixtures, x + sx, 0.8, -2.6, 0.03, 1.6, 0.03);
        }
        add(BOX, wood, G.fixtures, 0, 0.42, -2.0, 1.6, 0.84, 0.8);
        const skin = flat(0xece4d8, 0.5);
        for (const x of [-2.4, 2.4]) {
          add(new THREE.SphereGeometry(0.1, 12, 8), skin, G.fixtures, x, 1.78, -0.9);
          add(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), metal, G.fixtures, x, 0.45, -0.9);
          add(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12), metal, G.fixtures, x, 0.04, -0.9);
        }
        stock(new THREE.CapsuleGeometry(0.17, 0.62, 4, 10).scale(1, 1, 0.65), M('dress', () => new THREE.MeshStandardMaterial({ roughness: 0.8 })), [[-2.4, 1.22, -0.9], [2.4, 1.22, -0.9]], [0x7a1f2b, 0x2a2a38, 0xc8b48a]);
        const garments: [number, number, number, number][] = [];
        for (const x of [-2.3, 2.3]) for (let i = 0; i < 8; i++) garments.push([x - 0.6 + i * 0.17, 1.18, -2.6, Math.PI / 2]);
        stock(new THREE.BoxGeometry(0.42, 0.8, 0.05), M('garm', () => new THREE.MeshStandardMaterial({ roughness: 0.85 })), garments, [0x1f2a44, 0x7a2f2f, 0x2f5a3a, 0xc8b48a, 0x222226, 0xd9d4ca]);
        const folded: [number, number, number][] = [];
        for (let i = 0; i < 6; i++) folded.push([-0.55 + (i % 3) * 0.55, 0.9 + Math.floor(i / 3) * 0.1, -2.0]);
        stock(new THREE.BoxGeometry(0.4, 0.09, 0.32), M('fold', () => new THREE.MeshStandardMaterial({ roughness: 0.85 })), folded, [0xd9d4ca, 0x2a3346, 0x7a2f2f]);
        break;
      }
      case 'jewelry': {
        const counters = [[-2.0, -1.3], [2.0, -1.3], [0, -2.6]];
        for (const [x, z] of counters) { add(BOX, flat(0x2a1612, 0.45), G.fixtures, x, 0.45, z, 1.5, 0.9, 0.6); add(BOX, vitrine, G.fixtures, x, 1.1, z, 1.5, 0.38, 0.6); }
        add(BOX, flat(0x2a1612, 0.45), G.fixtures, 0, 0.5, -D + 0.5, 2.4, 1.0, 0.6); // service desk
        backShelves(flat(0x3a2018, 0.5), [1.3, 2.0]);
        const velvet = flat(0x3a0e1a, 0.9);
        const stands: [number, number, number][] = [];
        for (const [x, z] of counters) for (let i = 0; i < 4; i++) stands.push([x - 0.5 + i * 0.33, 0.97, z]);
        for (let i = 0; i < 6; i++) stands.push([-W / 2 + 0.9 + i * (W - 1.8) / 5, 1.4, -D + 0.24]);
        stock(new THREE.ConeGeometry(0.06, 0.16, 6), velvet, stands);
        stock(new THREE.TorusGeometry(0.04, 0.012, 6, 12), M('gold', () => new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 0.15, metalness: 1, emissive: 0x6a4a10, emissiveIntensity: 0.5 })), stands.map(([x, y, z]) => [x, y + 0.1, z] as [number, number, number]));
        break;
      }
      case 'grocery': {
        for (const sx of [-1, 1]) for (const y of [0.5, 1.1, 1.7, 2.3]) add(BOX, wood, G.fixtures, sx * (W / 2 - 0.45), y, -2.2, 0.5, 0.04, 2.8);
        backShelves(wood, [0.6, 1.2, 1.8, 2.4]);
        for (const x of [-2.3, 2.3]) { const c = add(BOX, wood, G.fixtures, x, 0.62, -0.75, 1.9, 0.3, 0.6); c.rotation.x = 0.25; }
        add(BOX, flat(0x60705a, 0.5), G.fixtures, -0.9, 0.5, -3.0, 1.2, 1.0, 0.6); // checkout
        const fruit: [number, number, number][] = [];
        for (const x of [-2.3, 2.3]) for (let i = 0; i < 8; i++) fruit.push([x - 0.75 + (i % 4) * 0.5, 0.82 + Math.floor(i / 4) * 0.05, -0.85 + Math.floor(i / 4) * 0.18]);
        stock(new THREE.SphereGeometry(0.09, 8, 6), M('fruit', () => new THREE.MeshStandardMaterial({ roughness: 0.5 })), fruit, [0xd93a2a, 0xf0b22a, 0x6aa53a, 0xe86a1a]);
        const packs: [number, number, number][] = [];
        for (const y of [0.7, 1.3, 1.9, 2.5]) for (let i = 0; i < 8; i++) packs.push([-W / 2 + 0.7 + i * (W - 1.4) / 7, y, -D + 0.22]);
        for (const sx of [-1, 1]) for (const y of [0.6, 1.2, 1.8]) for (let i = 0; i < 4; i++) packs.push([sx * (W / 2 - 0.45), y, -3.2 + i * 0.6]);
        stock(new THREE.BoxGeometry(0.18, 0.22, 0.14), M('pack', () => new THREE.MeshStandardMaterial({ roughness: 0.6 })), packs, [0xc8402a, 0x2a6ab0, 0xe8c040, 0x3a8a4a, 0xeeeeee]);
        break;
      }
      case 'cafe': {
        add(BOX, flat(0x3a2418, 0.45), G.fixtures, 0, 0.55, -D + 0.6, W - 1.6, 1.1, 0.7);            // bar
        add(BOX, flat(0x9a8a70, 0.3), G.fixtures, 0, 1.12, -D + 0.6, W - 1.5, 0.05, 0.8);           // bar top
        add(BOX, flat(0xb8bcc2, 0.25, 0.9), G.fixtures, 1.2, 1.38, -D + 0.45, 0.7, 0.45, 0.45);       // coffee machine
        backShelves(flat(0x3a2418, 0.5), [1.6, 2.2]);
        const table = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16), leg = new THREE.CylinderGeometry(0.03, 0.05, 0.72, 6);
        const chair = new THREE.BoxGeometry(0.4, 0.04, 0.4), back = new THREE.BoxGeometry(0.4, 0.4, 0.04);
        for (const [x, z] of [[-2.4, -1.0], [2.4, -1.0], [-1.0, -2.0], [1.0, -2.0]]) {
          add(table, flat(0xd8d0c0, 0.3), G.fixtures, x, 0.74, z); add(leg, metal, G.fixtures, x, 0.37, z);
          for (const sx of [-1, 1]) { add(chair, flat(0x5a3a22, 0.6), G.fixtures, x + sx * 0.55, 0.45, z); add(back, flat(0x5a3a22, 0.6), G.fixtures, x + sx * 0.72, 0.68, z).rotation.y = Math.PI / 2; }
        }
        for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.12, 10, 8), emissive(0xffd9a0, 2.2), G.fixtures, -2 + i * 2, CEIL - 0.6, -2.2);
        // stock = cafe supplies (coffee bags, pastries, bottles) — chairs are never loot
        const sup: [number, number, number][] = [];
        for (const y of [1.72, 2.32]) for (let i = 0; i < 9; i++) sup.push([-W / 2 + 0.8 + i * (W - 1.6) / 8, y, -D + 0.24]);
        stock(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8), M('bottle', () => new THREE.MeshStandardMaterial({ roughness: 0.2 })), sup, [0x2a5a3a, 0x6a2a1a, 0xc8a050, 0x3a3a3a]);
        const pastry: [number, number, number][] = [];
        for (let i = 0; i < 10; i++) pastry.push([-2.4 + i * 0.5, 1.2, -D + 0.75]);
        stock(new THREE.SphereGeometry(0.08, 8, 6).scale(1.3, 0.6, 1), M('pastry', () => new THREE.MeshStandardMaterial({ color: 0xc88a3a, roughness: 0.7 })), pastry);
        break;
      }
      case 'sneakers': {
        // shoe wall: grid of lit shelves on the back wall
        for (let r = 0; r < 4; r++) add(BOX, white, G.fixtures, 0, 0.9 + r * 0.55, -D + 0.18, W - 0.8, 0.03, 0.3);
        add(BOX, flat(0x30333a, 0.5), G.fixtures, 0, 0.25, -2.0, 2.2, 0.45, 0.6);                   // bench
        const shoes: [number, number, number, number][] = [];
        for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) shoes.push([-W / 2 + 0.75 + i * (W - 1.5) / 8, 0.98 + r * 0.55, -D + 0.22, 0.3]);
        stock(new THREE.BoxGeometry(0.28, 0.1, 0.11), M('shoe', () => new THREE.MeshStandardMaterial({ roughness: 0.6 })), shoes, [0xf2f2f2, 0x1a1a1a, 0xd8402a, 0x2a5ab0, 0xe8e0c8]);
        const boxes: [number, number, number][] = [];
        for (const x of [-2.5, 2.5]) for (let i = 0; i < 6; i++) boxes.push([x + (i % 2) * 0.36 - 0.18, 0.08 + Math.floor(i / 2) * 0.16, -1.2]);
        stock(new THREE.BoxGeometry(0.34, 0.15, 0.22), M('sbox', () => new THREE.MeshStandardMaterial({ color: 0xd2541e, roughness: 0.8 })), boxes);
        break;
      }
    }
  }

  /** Map game state onto the named groups. damage/breach and stock are independent inputs. */
  update(structureRatio: number, stockRatio: number, level: number, breached: boolean, boardRatio = 0) {
    const v = getShopVisualState({ damage: 1 - structureRatio, stockRatio, boardHealth: boardRatio, breach: breached });
    this.referenceState = v.referenceState;
    for (const name of SHOP_GROUPS) this.groups[name].visible = v.groups[name] && (this.lod < 2 || !['stock', 'fixtures'].includes(name));
    // decals: cracks fade in with damage before the glass breaks
    for (const d of this.decals) { d.visible = v.groups.glass_intact && v.damageAmount > 0.12; (d.material as THREE.MeshBasicMaterial).opacity = Math.min(1, v.damageAmount * 2.5); }
    // stock slots shown in fixed order (decorative only — real goods live in the game's stock value)
    const show = visibleStockCount(this.stockSlots, v.visibleStockFraction);
    let left = show;
    for (const it of this.stockItems) {
      const n = Math.min(it.total, Math.max(0, Math.round(it.total * v.visibleStockFraction)));
      if ((it.obj as THREE.InstancedMesh).isInstancedMesh) (it.obj as THREE.InstancedMesh).count = n; else it.obj.visible = left-- > 0;
    }
    if (this.debrisInst) this.debrisInst.count = Math.round(this.debrisInst.instanceMatrix.count * Math.min(1, v.debrisDensity));
    // shutter curtain lowered by the shutter upgrade level
    if (this.shutterCurtain) { const hgt = level >= 3 ? 2.0 : level >= 2 ? 1.2 : 0.14; this.shutterCurtain.scale.y = hgt; this.shutterCurtain.position.y = TRANSOM_TOP + 0.05 - hgt / 2; }
    this.justBroke = v.groups.glass_broken && !this.wasBroken;
    this.wasBroken = v.groups.glass_broken;
    if (this.light) this.light.intensity = v.referenceState === 'looted' ? 4 : 9;
  }

  private soot: THREE.Mesh | null = null;
  /** lasting fire damage: soot over the fascia and window heads (stays after extinguishing) */
  setScorched(on: boolean) {
    if (on && !this.soot) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d')!;
      for (let i = 0; i < 9; i++) { const x = 20 + Math.random() * 216, gr = g.createRadialGradient(x, 128, 0, x, 70, 90); gr.addColorStop(0, 'rgba(15,12,10,0.85)'); gr.addColorStop(1, 'rgba(15,12,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); }
      const t = new THREE.CanvasTexture(c);
      this.soot = new THREE.Mesh(PLANE, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      this.soot.position.set(0, 3.7, 0.25); this.soot.scale.set(W + 0.6, 2.2, 1); this.soot.renderOrder = 4; this.group.add(this.soot);
    }
    if (this.soot) this.soot.visible = on;
  }

  /** detail level by camera distance: 0 near, 1 mid, 2 far (loose products and fixtures hidden; gameplay unaffected) */
  setLod(dist: number) {
    const near = this.opts.quality === 'mobile' ? 26 : 38, far = this.opts.quality === 'mobile' ? 48 : 75;
    const lod = dist < near ? 0 : dist < far ? 1 : 2;
    if (lod === this.lod) return;
    this.lod = lod;
    this.groups.stock.visible = this.groups.stock.visible && lod < 2;
    this.groups.fixtures.visible = lod < 2;
    this.groups.debris.visible = this.groups.debris.visible && lod < 2;
  }

  triangles(): number {
    let n = 0;
    this.group.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh || !m.geometry) return;
      const g = m.geometry; const per = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      n += per * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1);
    });
    return Math.round(n);
  }
}
