import * as THREE from 'three';
import type { UnitKind } from '../config/balance';
import { iconTexture } from './textures';

// Procedural low-poly adult figures with jointed limbs. Appearance (skin tone, hair, build, clothing colour)
// comes from a random seed and is never linked to unit stats or behaviour.

const SKIN = [0xf2cfb0, 0xe3b08a, 0xc98e63, 0xa9744c, 0x8a5a3b, 0x6a4129, 0x4b2d1d];
const HAIR = [0x1b1612, 0x2b1d14, 0x4a3020, 0x6b4a2a, 0x8c8c8c, 0x0f0f10, 0xa8763e];
const HOODIES = [0x5a5f66, 0x4a5a3a, 0x5c2a2e, 0x2f4a6a, 0x3a3a3f, 0x6a5440, 0x2a2a2e, 0x7a6a5a, 0x46304a];
const JEANS = [0x2d3a52, 0x3a3f46, 0x23272e, 0x4a4f58, 0x2a3346];

const mats = new Map<number, THREE.MeshStandardMaterial>();
export function mat(color: number, rough = 0.8, metal = 0): THREE.MeshStandardMaterial {
  const key = color * 100 + Math.round(rough * 10) + metal * 7;
  let m = mats.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }); mats.set(key, m); }
  return m;
}

const cap = (r: number, len: number, rs = 10) => new THREE.CapsuleGeometry(r, len, 4, rs);
const geo = {
  thigh: cap(0.078, 0.32).translate(0, -0.23, 0),
  shin: cap(0.06, 0.34).translate(0, -0.23, 0),
  foot: cap(0.052, 0.16, 8).rotateX(Math.PI / 2).scale(1, 0.75, 1).translate(0, -0.035, 0.06),
  torso: cap(0.165, 0.28, 14).scale(1.05, 1, 0.66).translate(0, 0.3, 0),
  pelvis: new THREE.SphereGeometry(0.17, 12, 8).scale(1.05, 0.62, 0.72),
  vest: cap(0.175, 0.22, 14).scale(1.08, 1, 0.74).translate(0, 0.32, 0),
  upper: cap(0.052, 0.21).translate(0, -0.15, 0),
  fore: cap(0.044, 0.19).translate(0, -0.135, 0),
  hand: new THREE.SphereGeometry(0.048, 8, 6).scale(0.9, 1.2, 0.7),
  head: new THREE.SphereGeometry(0.105, 16, 12).scale(0.92, 1.12, 1.0),
  neck: new THREE.CylinderGeometry(0.045, 0.055, 0.1, 10),
  hair: new THREE.SphereGeometry(0.113, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
  hairLong: cap(0.09, 0.14, 10).scale(1.15, 1, 0.5).translate(0, -0.1, -0.07),
  cap: new THREE.CylinderGeometry(0.115, 0.118, 0.07, 14),
  brim: new THREE.BoxGeometry(0.17, 0.012, 0.1).translate(0, 0, 0.11),
  helmet: new THREE.SphereGeometry(0.135, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.6),
  visor: new THREE.BoxGeometry(0.21, 0.11, 0.015),
  hood: new THREE.SphereGeometry(0.13, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.62),
  box: new THREE.BoxGeometry(1, 1, 1),
  shield: new THREE.BoxGeometry(0.55, 1.0, 0.025),
  ext: new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10),
  backpack: cap(0.11, 0.12, 10).scale(1.2, 1, 0.6).translate(0, 0.32, -0.15),
  stripe: new THREE.CylinderGeometry(0.17, 0.17, 0.035, 14).scale(1.05, 1, 0.68),
  bag: new THREE.BoxGeometry(0.16, 0.2, 0.06),
  mask: new THREE.SphereGeometry(0.108, 14, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4).scale(0.95, 1.12, 1.05),
  collar: new THREE.TorusGeometry(0.075, 0.025, 6, 12).rotateX(Math.PI / 2),
};

let blobTex: THREE.Texture | null = null;
function blob(): THREE.Texture {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(0.6, 'rgba(0,0,0,0.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c); return blobTex;
}
export function contactShadow(): THREE.Mesh { const sh = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false })); sh.position.y = 0.02; sh.renderOrder = 2; return sh; }
const blobGeo = new THREE.PlaneGeometry(0.95, 0.95).rotateX(-Math.PI / 2);


export interface Humanoid {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  legs: [THREE.Group, THREE.Group];
  knees: [THREE.Group, THREE.Group];
  arms: [THREE.Group, THREE.Group];
  elbows: [THREE.Group, THREE.Group];
  carry: THREE.Group;
  bags: THREE.Group | null;
  shield: THREE.Mesh | null;
  extinguisher: THREE.Mesh | null;
  icon: THREE.Sprite;
  phase: number;
  recoil: number;
  kind: UnitKind;
}

function rng(seed: number) { let s = seed % 2147483647 || 1; return () => { s = (s * 48271) % 2147483647; return s / 2147483647; }; }

function m(g: THREE.BufferGeometry, mt: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(g, mt); mesh.position.set(x, y, z);
  // only the large body parts cast shadows: keeps the shadow pass cheap with many units
  mesh.castShadow = g === geo.torso || g === geo.thigh || g === geo.shin || g === geo.head || g === geo.box;
  parent.add(mesh); return mesh;
}

/** Streetwear outfits rebuilt from the extra character sheets (assets/units/extra_streetwear 01-10).
 *  Outfits only change appearance and the look of the carried goods; class stats are unchanged.
 *  Skin tone stays randomised over the full range so the cast remains varied (design rule). */
type Carry = 'box' | 'bigbox' | 'whitebox' | 'smallbox' | 'bags';
interface Outfit { ref: string; top: number; legs: number; shoes: number; layer: 'tracksuit' | 'puffer' | 'windbreaker' | 'vest' | 'hoodie'; vest?: number; stripe?: number; pack: 0 | 1 | 2; carry: Carry; kinds: UnitKind[] }
export const STREETWEAR: Outfit[] = [
  { ref: '01_tracksuit_arms_spread', top: 0x313337, legs: 0x313337, shoes: 0x3f3f42, layer: 'tracksuit', stripe: 0x676b71, pack: 0, carry: 'smallbox', kinds: ['vandal', 'runner'] },
  { ref: '02_puffer_large_box', top: 0x2d2e33, legs: 0x393a3f, shoes: 0xb2b5bb, layer: 'puffer', pack: 0, carry: 'bigbox', kinds: ['heavy', 'carrier'] },
  { ref: '03_runner_backpack', top: 0x394564, legs: 0x363a45, shoes: 0x4f5258, layer: 'windbreaker', stripe: 0xe3f6ff, pack: 1, carry: 'smallbox', kinds: ['runner'] },
  { ref: '04_vest_shopping_bags', top: 0x303136, legs: 0x36373c, shoes: 0x424448, layer: 'vest', vest: 0x52555b, pack: 0, carry: 'bags', kinds: ['carrier'] },
  { ref: '05_hoodie_backpack_walking', top: 0x333439, legs: 0x333439, shoes: 0x3f3f42, layer: 'tracksuit', stripe: 0x787d86, pack: 1, carry: 'box', kinds: ['carrier', 'vandal'] },
  { ref: '06_puffer_electronics_box', top: 0x2b2d31, legs: 0x37393e, shoes: 0xfcffff, layer: 'puffer', pack: 0, carry: 'whitebox', kinds: ['carrier', 'heavy'] },
  { ref: '07_navy_runner', top: 0x3a4d77, legs: 0x808590, shoes: 0x363639, layer: 'hoodie', pack: 0, carry: 'smallbox', kinds: ['runner'] },
  { ref: '08_padded_vest_bags', top: 0x313337, legs: 0x393a3f, shoes: 0x3c3c3f, layer: 'vest', vest: 0x91969f, pack: 0, carry: 'bags', kinds: ['carrier'] },
  { ref: '09_large_backpack', top: 0x4f5056, legs: 0x484a50, shoes: 0x3c3c3f, layer: 'hoodie', pack: 2, carry: 'box', kinds: ['carrier', 'heavy'] },
  { ref: '10_windbreaker_small_box', top: 0x2e3034, legs: 0x333439, shoes: 0x999ca2, layer: 'windbreaker', stripe: 0x52555b, pack: 0, carry: 'smallbox', kinds: ['runner', 'vandal'] },
];

export const SKIN_TONES = SKIN;
export const CASUAL_TOPS = HOODIES;
export const CASUAL_LEGS = JEANS;

export function outfitFor(kind: UnitKind, variant: number): Outfit | null {
  if (kind === 'security' || kind === 'shield' || kind === 'firefighter') return null;
  if (variant % 5 === 4) return null; // one in five keeps the earlier casual clothing (images 13, 14, 26-28)
  const list = STREETWEAR.filter((o) => o.kinds.includes(kind));
  return list[Math.floor(variant / 5) % list.length];
}

export interface BuildOpts { outfit?: Outfit | null; exportMode?: boolean }

export function buildHumanoid(kind: UnitKind, variant: number, opts: BuildOpts = {}): Humanoid {
  const r = rng(variant + 17);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  // in export mode the tintable materials are unique and named so the game can recolour them per unit
  const named = (color: number, rough: number, name: string) => { const mm = new THREE.MeshStandardMaterial({ color, roughness: rough }); mm.name = name; return mm; };
  const skin = opts.exportMode ? named(pick(SKIN), 0.7, 'skin') : mat(pick(SKIN), 0.7);
  const hairM = mat(pick(HAIR), 0.9);
  const female = r() < 0.45; // presentation only
  const isDef = kind === 'security' || kind === 'shield' || kind === 'firefighter';
  let top: number, legsC: number, shoes = 0x1c1c1e;
  if (kind === 'security') { top = 0x1d2433; legsC = 0x1e2534; }
  else if (kind === 'shield') { top = 0x232b3c; legsC = 0x1f2633; }
  else if (kind === 'firefighter') { top = 0x2a2a28; legsC = 0x2a2a28; }
  else { top = pick(HOODIES); legsC = pick(JEANS); shoes = pick([0xdedede, 0x2a2a2a, 0x8a8a8a, 0xc9c0b0]); }
  const outfit = opts.outfit !== undefined ? opts.outfit : outfitFor(kind, variant);
  if (outfit) { top = outfit.top; legsC = outfit.legs; shoes = outfit.shoes; }
  // nylon / puffer fabric catches the street light (glossier than cotton)
  const topRough = outfit && (outfit.layer === 'puffer' || outfit.layer === 'windbreaker') ? 0.45 : 0.75;
  const tintable = opts.exportMode && !isDef && !outfit; // casual looter clothing is recoloured per unit
  const topM = tintable ? named(top, topRough, 'top') : mat(top, topRough), legM = tintable ? named(legsC, 0.8, 'legs') : mat(legsC, 0.8), shoeM = mat(shoes, 0.6);

  const root = new THREE.Group(); root.name = 'character';
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  const scale = (kind === 'heavy' ? 1.05 : 0.95) + r() * 0.08 - (female ? 0.04 : 0);
  body.scale.setScalar(scale);
  const hips = new THREE.Group(); hips.name = 'hips'; hips.position.y = 0.95; body.add(hips);
  m(geo.pelvis, legM, hips, 0, 0, 0);
  const legs: THREE.Group[] = [], knees: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.name = sx < 0 ? 'legL' : 'legR'; leg.position.set(sx * 0.1, -0.02, 0); hips.add(leg);
    m(geo.thigh, legM, leg);
    const knee = new THREE.Group(); knee.name = sx < 0 ? 'kneeL' : 'kneeR'; knee.position.y = -0.46; leg.add(knee);
    m(geo.shin, legM, knee);
    const foot = m(geo.foot, shoeM, knee, 0, -0.46, 0);
    if (kind === 'firefighter') { const st = m(geo.stripe, mat(0xd8e04a, 0.4), knee, 0, -0.3, 0); st.scale.set(0.38, 1, 0.6); }
    if (outfit?.layer === 'tracksuit' && outfit.stripe) { m(geo.box, mat(outfit.stripe, 0.6), leg, sx * 0.079, -0.23, 0).scale.set(0.012, 0.42, 0.035); m(geo.box, mat(outfit.stripe, 0.6), knee, sx * 0.062, -0.22, 0).scale.set(0.012, 0.38, 0.03); }
    void foot;
    legs.push(leg); knees.push(knee);
  }
  const torso = new THREE.Group(); torso.name = 'torso'; torso.position.y = 0.06; hips.add(torso);
  const torsoMesh = m(geo.torso, topM, torso);
  if (kind === 'heavy') torsoMesh.scale.set(1.15, 1, 1.2);
  if (female) torsoMesh.scale.x *= 0.92;
  if (kind === 'security') m(geo.vest, mat(0x111316, 0.7), torso);
  if (kind === 'shield') { m(geo.vest, mat(0x2a3346, 0.6), torso); }
  if (kind === 'firefighter') { for (const y of [0.16, 0.4]) m(geo.stripe, mat(0xd8e04a, 0.35), torso, 0, y, 0); }
  if (outfit) {
    if (outfit.layer === 'puffer') {
      torsoMesh.scale.set(1.16, 1.04, 1.22);
      for (const y of [0.1, 0.22, 0.34, 0.46]) m(geo.stripe, mat(0x0c0d0f, 0.5), torso, 0, y, 0).scale.set(1.13, 1, 1.14);
    } else if (outfit.layer === 'vest') {
      m(geo.vest, mat(outfit.vest!, 0.55), torso).scale.set(1.08, 1.04, 1.12);
      for (const y of [0.2, 0.32, 0.44]) m(geo.stripe, mat(0x0e0f11, 0.5), torso, 0, y, 0).scale.set(1.1, 1, 1.06);
    } else if (outfit.layer === 'windbreaker' && outfit.stripe) {
      m(geo.stripe, mat(outfit.stripe, 0.4, 0.3), torso, 0, 0.4, 0).scale.set(1.02, 0.4, 1.02);
    } else if (outfit.layer === 'tracksuit' && outfit.stripe) {
      for (const sx of [-1, 1]) m(geo.box, mat(outfit.stripe, 0.6), torso, sx * 0.17, 0.32, 0).scale.set(0.012, 0.42, 0.04);
    }
    if (outfit.pack) { const bp = m(geo.backpack, mat(0x111214, 0.7), torso); if (outfit.pack === 2) bp.scale.set(1.35, 1.45, 1.4); }
  } else if (!isDef && r() < 0.6) m(geo.backpack, mat(pick([0x222222, 0x3a3020, 0x2a3a2a]), 0.8), torso);
  m(geo.neck, skin, torso, 0, 0.6, 0);
  if (!isDef) m(geo.collar, topM, torso, 0, 0.6, 0);
  const head = new THREE.Group(); head.name = 'head'; head.position.y = 0.66; torso.add(head);
  m(geo.head, skin, head, 0, 0.1, 0);
  // head wear
  if (kind === 'security') {
    if (r() < 0.65) { m(geo.cap, mat(0x161a24, 0.8), head, 0, 0.19, 0); m(geo.brim, mat(0x161a24, 0.8), head, 0, 0.17, 0); }
    else m(geo.hair, hairM, head, 0, 0.12, 0);
  } else if (kind === 'shield') {
    m(geo.helmet, mat(0x1b2236, 0.4, 0.3), head, 0, 0.1, 0);
    const v = m(geo.visor, new THREE.MeshStandardMaterial({ color: 0x9fb8d0, transparent: true, opacity: 0.45, roughness: 0.1 }), head, 0, 0.1, 0.13);
    v.castShadow = false;
  } else if (kind === 'firefighter') {
    m(geo.helmet, mat(0xe3b81a, 0.35), head, 0, 0.11, 0);
  } else if (outfit) {
    m(geo.hood, topM, head, 0, 0.085, -0.012).scale.set(1.04, 1.02, 1.06);
    m(geo.mask, mat(0x0a0a0b, 0.8), head, 0, 0.055, 0.02);
  } else if (kind === 'vandal' || r() < 0.35) {
    m(geo.hood, topM, head, 0, 0.08, -0.01);
  } else {
    m(geo.hair, hairM, head, 0, 0.12, 0);
  }
  if (!outfit && female && kind !== 'shield' && kind !== 'firefighter' && r() < 0.7) m(geo.hairLong, hairM, head, 0, 0.12, 0);

  const arms: THREE.Group[] = [], elbows: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.name = sx < 0 ? 'armL' : 'armR'; arm.position.set(sx * 0.245, 0.54, 0); torso.add(arm);
    const up = m(geo.upper, topM, arm); if (outfit?.layer === 'puffer') up.scale.set(1.35, 1, 1.35);
    const el = new THREE.Group(); el.name = sx < 0 ? 'elbowL' : 'elbowR'; el.position.y = -0.3; arm.add(el);
    const fo = m(geo.fore, kind === 'firefighter' || kind === 'shield' || outfit ? topM : (r() < 0.5 ? topM : skin), el); if (outfit?.layer === 'puffer') fo.scale.set(1.3, 1, 1.3);
    m(geo.hand, skin, el, 0, -0.29, 0);
    arms.push(arm); elbows.push(el);
  }
  // carried goods: cardboard box (sized by class) or shopping bags (carrier variant, as in image 27)
  const carry = new THREE.Group(); carry.name = 'carry'; carry.visible = false; torso.add(carry);
  let bags: THREE.Group | null = null;
  const carryKind: Carry = outfit ? outfit.carry : kind === 'carrier' && r() < 0.35 ? 'bags' : kind === 'heavy' ? 'bigbox' : kind === 'runner' || kind === 'vandal' ? 'smallbox' : 'box';
  if (carryKind === 'bags') {
    bags = new THREE.Group(); bags.name = 'bags';
    const bagM = outfit ? mat(0x111113, 0.55) : mat(pick([0xb08a5a, 0xd8d0c0, 0x8a6a4a]), 0.9);
    for (const sx of [-1, 1]) { const b = m(geo.bag, bagM, bags, sx * 0.3, 0.12, 0.02); b.rotation.y = 0.2 * sx; b.scale.set(1.5, 1.6, 1.3); }
    carry.add(bags);
  } else if (carryKind === 'whitebox') {
    // boxed television / monitor (image 06)
    const bx = m(geo.box, mat(0xeeeeec, 0.7), carry, 0, 0.26, 0.27); bx.scale.set(0.62, 0.44, 0.2);
    const scr = m(geo.box, mat(0x2a2c30, 0.4), carry, 0.03, 0.26, 0.375); scr.scale.set(0.4, 0.28, 0.005);
  } else {
    const boxSize = carryKind === 'bigbox' ? [0.6, 0.42, 0.42] : carryKind === 'smallbox' ? (kind === 'vandal' ? [0.22, 0.16, 0.18] : [0.3, 0.2, 0.22]) : [0.44, 0.3, 0.32];
    const bx = m(geo.box, mat(0xa77d4e, 0.95), carry, 0, 0.28, 0.27); bx.scale.set(boxSize[0], boxSize[1], boxSize[2]);
    const tape = m(geo.box, mat(0xc8b48a, 0.6), carry, 0, 0.28 + boxSize[1] / 2 + 0.002, 0.27); tape.scale.set(boxSize[0] * 0.15, 0.004, boxSize[2]);
  }
  let shield: THREE.Mesh | null = null, ext: THREE.Mesh | null = null;
  if (kind === 'shield') {
    shield = new THREE.Mesh(geo.shield, new THREE.MeshStandardMaterial({ color: 0xbfd3e6, transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide }));
    shield.name = 'shield'; shield.position.set(-0.05, 0.25, 0.36); torso.add(shield);
    const rim = new THREE.Mesh(new THREE.EdgesGeometry(geo.shield), new THREE.LineBasicMaterial({ color: 0x222831 }));
    shield.add(rim);
  }
  if (kind === 'firefighter') { ext = m(geo.ext, mat(0xc0201a, 0.4), elbows[1], 0, -0.32, 0.05); }

  if (opts.exportMode) return { root, body, torso, head, legs: legs as [THREE.Group, THREE.Group], knees: knees as [THREE.Group, THREE.Group], arms: arms as [THREE.Group, THREE.Group], elbows: elbows as [THREE.Group, THREE.Group], carry, bags, shield, extinguisher: ext, icon: new THREE.Sprite(), phase: 0, recoil: 0, kind };
  const shadow = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false }));
  shadow.position.y = 0.02; shadow.renderOrder = 2; root.add(shadow);

  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(kind, isDef ? '#36e0ff' : '#ff9a2e'), depthTest: false, transparent: true }));
  icon.scale.set(0.42, 0.42, 1); icon.position.y = 2.15; icon.renderOrder = 10; root.add(icon);

  return { root, body, torso, head, legs: legs as [THREE.Group, THREE.Group], knees: knees as [THREE.Group, THREE.Group], arms: arms as [THREE.Group, THREE.Group], elbows: elbows as [THREE.Group, THREE.Group], carry, bags, shield, extinguisher: ext, icon, phase: r() * 6, recoil: 0, kind };
}

export type Pose = 'idle' | 'walk' | 'breach' | 'collect' | 'held' | 'restrained' | 'escorted' | 'restrain' | 'escort' | 'brace' | 'extinguish' | 'barrier';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Drive joint rotations. Poses are rebuilt from the action references (37-42) as procedural keyframes. */
export function animate(h: Humanoid, pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number) {
  const run = speed > 3.3;
  h.phase += dt * (moving ? (run ? 9.5 : 7.5) * Math.min(1.3, Math.max(0.6, speed / 3)) : 2);
  const p = h.phase;
  const amp = moving ? (run ? 0.85 : 0.55) : 0;
  const s = Math.sin(p), c = Math.cos(p);
  const k = 1 - Math.exp(-dt * 14);
  const set = (o: THREE.Object3D, x: number, y = 0, z = 0) => { o.rotation.x = lerp(o.rotation.x, x, k); o.rotation.y = lerp(o.rotation.y, y, k); o.rotation.z = lerp(o.rotation.z, z, k); };
  // legs: alternating swing, knees bend on the back swing, grounded bob
  set(h.legs[0], s * amp); set(h.legs[1], -s * amp);
  set(h.knees[0], Math.max(0, -c) * amp * 1.3 + (moving ? 0.1 : 0)); set(h.knees[1], Math.max(0, c) * amp * 1.3 + (moving ? 0.1 : 0));
  h.body.position.y = moving ? Math.abs(Math.sin(p)) * 0.05 * (run ? 1.6 : 1) : Math.sin(p * 0.5) * 0.006;
  let lean = moving ? (run ? 0.22 : 0.06) : 0;
  let aL = -s * amp * 0.9, aR = s * amp * 0.9, eL = -0.3 - (run ? 0.9 : 0.2), eR = eL, azL = 0, azR = 0;
  h.carry.visible = carrying;
  if (carrying) { aL = aR = -0.75; eL = eR = -0.75; azL = -0.22; azR = 0.22; lean = moving ? 0.05 : 0; if (h.bags) { aL = aR = 0.05; eL = eR = -0.05; azL = -0.1; azR = 0.1; } }
  let headX = 0;
  switch (pose) {
    case 'breach': case 'barrier': { // push/pull at the shutter (image 39-like contact)
      const t = Math.sin(h.phase * 3);
      lean = 0.18 + t * 0.06; aL = aR = -1.3 - t * 0.2; eL = eR = -0.2; set(h.legs[0], 0.35); set(h.legs[1], -0.25); set(h.knees[0], 0.2); set(h.knees[1], 0.3);
      break;
    }
    case 'collect': { // reach, grasp, lift (image 38)
      const t = (Math.sin(h.phase * 1.8) + 1) / 2;
      lean = 0.2 + t * 0.45; aL = aR = -0.6 - t * 0.6; eL = eR = -0.3; headX = -0.2;
      set(h.knees[0], 0.3 * t); set(h.knees[1], 0.3 * t); set(h.legs[0], -0.2 * t); set(h.legs[1], -0.2 * t);
      break;
    }
    case 'held': { // open-palm contact against the shield, brief recoil (image 39)
      h.recoil = Math.max(0, h.recoil - dt);
      if (h.recoil <= 0 && Math.random() < dt * 0.9) h.recoil = 0.45;
      const rc = Math.sin((h.recoil / 0.45) * Math.PI);
      lean = 0.15 - rc * 0.35; aL = aR = -1.45 + rc * 0.4; eL = eR = -0.1; set(h.legs[0], 0.3 - rc * 0.4); set(h.legs[1], -0.3);
      break;
    }
    case 'restrained': { // stop signal / hands raised, upright (image 41)
      aL = aR = -2.6; eL = eR = -0.3; azL = 0.25; azR = -0.25; lean = -0.05;
      break;
    }
    case 'escorted': { aL = aR = 0.45; eL = eR = -1.2; azL = -0.2; azR = 0.2; lean = 0.08; headX = 0.15; break; }
    case 'restrain': { aL = -1.2; aR = -0.9; eL = -0.5; eR = -0.6; lean = 0.12; break; }
    case 'escort': { aL = -0.9; eL = -0.5; azL = -0.4; break; }
    case 'brace': { lean = 0.2; aL = -1.25; eL = -0.9; aR = -0.8; eR = -1.0; set(h.legs[0], 0.4); set(h.legs[1], -0.35); set(h.knees[0], 0.35); set(h.knees[1], 0.3); break; }
    case 'extinguish': { aL = -1.0; aR = -1.1; eL = -0.4; eR = -0.3; lean = 0.1; break; }
  }
  if (h.kind === 'shield' && pose !== 'brace') { aL = moving ? -1.05 : -1.2; eL = -0.9; }
  if (h.shield) { h.shield.position.z = pose === 'brace' ? 0.42 : 0.36; h.shield.rotation.x = pose === 'brace' ? -0.08 : 0; }
  set(h.torso, lean); set(h.head, headX - lean * 0.5);
  set(h.arms[0], aL, 0, -azL); set(h.arms[1], aR, 0, -azR);
  set(h.elbows[0], eL); set(h.elbows[1], eR);
}
