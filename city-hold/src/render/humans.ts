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

const geo = {
  thigh: new THREE.BoxGeometry(0.15, 0.46, 0.16).translate(0, -0.23, 0),
  shin: new THREE.BoxGeometry(0.12, 0.46, 0.13).translate(0, -0.23, 0),
  foot: new THREE.BoxGeometry(0.11, 0.08, 0.26).translate(0, -0.04, 0.05),
  torso: new THREE.BoxGeometry(0.38, 0.56, 0.22).translate(0, 0.28, 0),
  pelvis: new THREE.BoxGeometry(0.36, 0.16, 0.2),
  vest: new THREE.BoxGeometry(0.41, 0.4, 0.26).translate(0, 0.3, 0),
  upper: new THREE.BoxGeometry(0.1, 0.3, 0.11).translate(0, -0.15, 0),
  fore: new THREE.BoxGeometry(0.09, 0.27, 0.09).translate(0, -0.135, 0),
  hand: new THREE.SphereGeometry(0.05, 6, 5),
  head: new THREE.SphereGeometry(0.11, 10, 8).scale(1, 1.15, 1.05),
  neck: new THREE.CylinderGeometry(0.05, 0.06, 0.08, 6),
  hair: new THREE.SphereGeometry(0.118, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
  hairLong: new THREE.BoxGeometry(0.22, 0.28, 0.08).translate(0, -0.08, -0.09),
  cap: new THREE.CylinderGeometry(0.12, 0.12, 0.07, 10),
  brim: new THREE.BoxGeometry(0.18, 0.015, 0.1).translate(0, 0, 0.12),
  helmet: new THREE.SphereGeometry(0.14, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.6),
  visor: new THREE.BoxGeometry(0.22, 0.12, 0.02),
  hood: new THREE.SphereGeometry(0.135, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.62),
  box: new THREE.BoxGeometry(1, 1, 1),
  shield: new THREE.BoxGeometry(0.55, 1.0, 0.025),
  ext: new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
  backpack: new THREE.BoxGeometry(0.28, 0.32, 0.12).translate(0, 0.3, -0.16),
  stripe: new THREE.BoxGeometry(0.4, 0.035, 0.24),
  bag: new THREE.BoxGeometry(0.16, 0.2, 0.06),
};

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
  const mesh = new THREE.Mesh(g, mt); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}

export function buildHumanoid(kind: UnitKind, variant: number): Humanoid {
  const r = rng(variant + 17);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const skin = mat(pick(SKIN), 0.7);
  const hairM = mat(pick(HAIR), 0.9);
  const female = r() < 0.45; // presentation only
  const isDef = kind === 'security' || kind === 'shield' || kind === 'firefighter';
  let top: number, legsC: number, shoes = 0x1c1c1e;
  if (kind === 'security') { top = 0x1d2433; legsC = 0x1e2534; }
  else if (kind === 'shield') { top = 0x232b3c; legsC = 0x1f2633; }
  else if (kind === 'firefighter') { top = 0x2a2a28; legsC = 0x2a2a28; }
  else { top = pick(HOODIES); legsC = pick(JEANS); shoes = pick([0xdedede, 0x2a2a2a, 0x8a8a8a, 0xc9c0b0]); }
  const topM = mat(top, 0.85), legM = mat(legsC, 0.85), shoeM = mat(shoes, 0.6);

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const scale = (kind === 'heavy' ? 1.05 : 0.95) + r() * 0.08 - (female ? 0.04 : 0);
  body.scale.setScalar(scale);
  const hips = new THREE.Group(); hips.position.y = 0.95; body.add(hips);
  m(geo.pelvis, legM, hips, 0, 0, 0);
  const legs: THREE.Group[] = [], knees: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sx * 0.1, -0.02, 0); hips.add(leg);
    m(geo.thigh, legM, leg);
    const knee = new THREE.Group(); knee.position.y = -0.46; leg.add(knee);
    m(geo.shin, legM, knee);
    const foot = m(geo.foot, shoeM, knee, 0, -0.46, 0);
    if (kind === 'firefighter') { const st = m(geo.stripe, mat(0xd8e04a, 0.4), knee, 0, -0.3, 0); st.scale.set(0.38, 1, 0.6); }
    void foot;
    legs.push(leg); knees.push(knee);
  }
  const torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso);
  const torsoMesh = m(geo.torso, topM, torso);
  if (kind === 'heavy') torsoMesh.scale.set(1.15, 1, 1.2);
  if (female) torsoMesh.scale.x *= 0.92;
  if (kind === 'security') m(geo.vest, mat(0x111316, 0.7), torso);
  if (kind === 'shield') { m(geo.vest, mat(0x2a3346, 0.6), torso); }
  if (kind === 'firefighter') { for (const y of [0.16, 0.4]) m(geo.stripe, mat(0xd8e04a, 0.35), torso, 0, y, 0); }
  if (!isDef && r() < 0.6) m(geo.backpack, mat(pick([0x222222, 0x3a3020, 0x2a3a2a]), 0.8), torso);
  m(geo.neck, skin, torso, 0, 0.6, 0);
  const head = new THREE.Group(); head.position.y = 0.66; torso.add(head);
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
  } else if (kind === 'vandal' || r() < 0.35) {
    m(geo.hood, topM, head, 0, 0.08, -0.01);
  } else {
    m(geo.hair, hairM, head, 0, 0.12, 0);
  }
  if (female && kind !== 'shield' && kind !== 'firefighter' && r() < 0.7) m(geo.hairLong, hairM, head, 0, 0.12, 0);

  const arms: THREE.Group[] = [], elbows: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(sx * 0.245, 0.54, 0); torso.add(arm);
    m(geo.upper, topM, arm);
    const el = new THREE.Group(); el.position.y = -0.3; arm.add(el);
    m(geo.fore, kind === 'firefighter' || kind === 'shield' ? topM : (r() < 0.5 ? topM : skin), el);
    m(geo.hand, skin, el, 0, -0.29, 0);
    arms.push(arm); elbows.push(el);
  }
  // carried goods: cardboard box (sized by class) or shopping bags (carrier variant, as in image 27)
  const carry = new THREE.Group(); carry.visible = false; torso.add(carry);
  let bags: THREE.Group | null = null;
  const boxSize = kind === 'heavy' ? [0.6, 0.42, 0.42] : kind === 'runner' ? [0.32, 0.22, 0.24] : kind === 'vandal' ? [0.22, 0.16, 0.18] : [0.44, 0.3, 0.32];
  if (kind === 'carrier' && r() < 0.35) {
    bags = new THREE.Group();
    for (const sx of [-1, 1]) { const b = m(geo.bag, mat(pick([0xb08a5a, 0xd8d0c0, 0x8a6a4a]), 0.9), bags, sx * 0.3, 0.12, 0.02); b.rotation.y = 0.2 * sx; }
    carry.add(bags);
  } else {
    const bx = m(geo.box, mat(0xa77d4e, 0.95), carry, 0, 0.28, 0.27); bx.scale.set(boxSize[0], boxSize[1], boxSize[2]);
    const tape = m(geo.box, mat(0xc8b48a, 0.6), carry, 0, 0.28 + boxSize[1] / 2 + 0.002, 0.27); tape.scale.set(boxSize[0] * 0.15, 0.004, boxSize[2]);
  }
  let shield: THREE.Mesh | null = null, ext: THREE.Mesh | null = null;
  if (kind === 'shield') {
    shield = new THREE.Mesh(geo.shield, new THREE.MeshStandardMaterial({ color: 0xbfd3e6, transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide }));
    shield.position.set(-0.05, 0.25, 0.36); torso.add(shield);
    const rim = new THREE.Mesh(new THREE.EdgesGeometry(geo.shield), new THREE.LineBasicMaterial({ color: 0x222831 }));
    shield.add(rim);
  }
  if (kind === 'firefighter') { ext = m(geo.ext, mat(0xc0201a, 0.4), elbows[1], 0, -0.32, 0.05); }

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
