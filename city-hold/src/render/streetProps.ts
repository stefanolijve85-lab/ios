import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Circle } from '../maps/types';
import { fallingWaterTexture, radialTexture, rippleTexture } from './textures';
import type { Scroll } from './street';

// Street objects from the street-props pack (assets/street_props): real procedural geometry following the
// references' silhouettes and materials. Y up, front +Z, pivot at the ground centre. Shared geometry/materials.

const cache = new Map<string, THREE.Material>();
const M = (k: string, make: () => THREE.Material) => { let m = cache.get(k); if (!m) { m = make(); cache.set(k, m); } return m; };
const castIron = () => M('castIron', () => new THREE.MeshStandardMaterial({ color: 0x1f3a2c, roughness: 0.45, metalness: 0.6 }));
const galv = () => M('galv', () => new THREE.MeshStandardMaterial({ color: 0xa9b0b6, roughness: 0.38, metalness: 0.85 }));
const darkSteel = () => M('dsteel', () => new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.4, metalness: 0.7 }));
const timber = () => M('timber', () => new THREE.MeshStandardMaterial({ color: 0x7a4c2a, roughness: 0.62 }));
const stone = () => M('fstone2', () => new THREE.MeshStandardMaterial({ color: 0xbfae8e, roughness: 0.82 })); // weathered limestone (images 02/03)
const clearGlass = () => M('clearGlass', () => new THREE.MeshStandardMaterial({ color: 0xcfe2ee, roughness: 0.06, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1.2, side: THREE.DoubleSide }));
const lampGlow = () => M('lampGlow', () => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd28c).multiplyScalar(4.5) }); m.name = 'glow'; return m; });
const leafMats = [0x8c8a3a, 0xa8893a, 0x6f7a32, 0xb99a42].map((c) => // autumn olive/ochre crowns (images 01-03)
   M('leaf' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, flatShading: true })));

function add(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, shadow = true) {
  const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0: number, r1: number, h: number, seg = 10) => new THREE.CylinderGeometry(r0, r1, h, seg);
const lathe = (pts: [number, number][], seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const seeded = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
/** a tube along a polyline (cylinders between points), merged */
function tube(pts: [number, number, number][], r: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[i - 1]), b = new THREE.Vector3(...pts[i]); const len = a.distanceTo(b);
    const g = new THREE.CylinderGeometry(r, r, len, 8, 1, true);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.applyQuaternion(q); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); parts.push(g);
  }
  return mergeGeometries(parts)!;
}

// ---------------------------------------------------------------- 2. street lamp (3.8 m, green cast iron)
const LAMP = {
  base: lathe([[0, 0], [0.24, 0], [0.24, 0.06], [0.2, 0.1], [0.19, 0.34], [0.22, 0.4], [0.15, 0.48], [0.13, 0.62], [0.16, 0.68], [0.09, 0.78], [0.075, 0.95], [0, 0.95]], 12),
  shaft: cyl(0.045, 0.06, 2.35, 10),
  collar: lathe([[0, 0], [0.08, 0], [0.11, 0.05], [0.07, 0.12], [0.1, 0.18], [0, 0.2]], 10),
  cage: cyl(0.2, 0.13, 0.5, 4).rotateY(Math.PI / 4),
  post: box(0.025, 0.52, 0.025),
  roof: lathe([[0, 0.26], [0.06, 0.24], [0.14, 0.12], [0.27, 0.0], [0.24, -0.02], [0, -0.02]], 8),
  finial: lathe([[0, 0], [0.04, 0.02], [0.05, 0.08], [0.02, 0.14], [0, 0.17]], 8),
};
export function buildStreetLamp(parent: THREE.Object3D): THREE.Group {
  const g = new THREE.Group(); parent.add(g);
  add(LAMP.base, castIron(), g);
  add(LAMP.shaft, castIron(), g, 0, 0.95 + 1.175);
  add(LAMP.collar, castIron(), g, 0, 3.1);
  add(LAMP.cage, lampGlow(), g, 0, 3.55, 0, false);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const p = add(LAMP.post, castIron(), g, x * 0.115, 3.55, z * 0.115); p.rotation.set(z * 0.08, 0, -x * 0.08); }
  add(LAMP.roof, castIron(), g, 0, 3.82);
  add(LAMP.finial, castIron(), g, 0, 4.06);
  return g;
}
export const LAMP_LIGHT_Y = 3.55;

// ---------------------------------------------------------------- 3. bench (1.8 m, slats, scrolled ends, armrests)
let benchEnd: THREE.BufferGeometry | null = null;
export function buildStreetBench(parent: THREE.Object3D, len = 1.8): THREE.Group {
  const g = new THREE.Group(); parent.add(g);
  if (!benchEnd) {
    // cast-iron end frame: front leg, back leg rising into the backrest, armrest with a scroll
    benchEnd = mergeGeometries([
      tube([[0, 0, 0.26], [0, 0.42, 0.22], [0, 0.42, -0.2], [0, 0.0, -0.26]], 0.025),
      tube([[0, 0.42, -0.2], [0, 0.86, -0.32]], 0.025),
      tube([[0, 0.42, 0.22], [0, 0.66, 0.24], [0, 0.68, 0.0], [0, 0.66, -0.22]], 0.022),
      new THREE.TorusGeometry(0.05, 0.015, 6, 12).rotateY(Math.PI / 2).translate(0, 0.62, 0.27),
      new THREE.TorusGeometry(0.045, 0.014, 6, 12).rotateY(Math.PI / 2).translate(0, 0.07, 0.3),
    ])!;
  }
  for (const x of [-len / 2 + 0.08, len / 2 - 0.08]) add(benchEnd, castIron(), g, x);
  const slat = box(len, 0.03, 0.075);
  for (let k = 0; k < 5; k++) add(slat, timber(), g, 0, 0.44, 0.19 - k * 0.09);
  for (let k = 0; k < 4; k++) { const b = add(slat, timber(), g, 0, 0.54 + k * 0.095, -0.24 - k * 0.022); b.rotation.x = -0.24; }
  return g;
}

// ---------------------------------------------------------------- 4. tree in a Versailles planter (LOD crown)
export interface TreeHandles { group: THREE.Group; crown: THREE.LOD; crownMeshes: THREE.Mesh[] }
export function buildTreePlanter(parent: THREE.Object3D, seed: number): TreeHandles {
  const g = new THREE.Group(); parent.add(g);
  const rnd = seeded(seed * 97 + 13);
  const green = M('versailles', () => new THREE.MeshStandardMaterial({ color: 0x1f4a33, roughness: 0.55 }));
  const S = 1.2;
  add(box(S, S * 0.9, S), green, g, 0, S * 0.45 + 0.08);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    add(box(0.1, S * 0.98, 0.1), green, g, x * S / 2, S * 0.49 + 0.04, z * S / 2);
    add(new THREE.SphereGeometry(0.06, 8, 6), green, g, x * S / 2, S + 0.1, z * S / 2);
    add(box(0.12, 0.08, 0.12), green, g, x * S / 2, 0.04, z * S / 2);
  }
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { // panel battens
    for (let k = -2; k <= 2; k++) { const b = add(box(nz ? 0.03 : 0.02, S * 0.8, nz ? 0.02 : 0.03), M('vbatten', () => new THREE.MeshStandardMaterial({ color: 0x173826, roughness: 0.6 })), g, nx * (S / 2 + 0.01) + (nz ? k * 0.2 : 0), S * 0.45 + 0.08, nz * (S / 2 + 0.01) + (nx ? k * 0.2 : 0), false); void b; }
  }
  add(box(S - 0.12, 0.04, S - 0.12), M('soil', () => new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1 })), g, 0, S * 0.88, 0, false);
  // tapering trunk with two forks
  const bark = M('bark', () => new THREE.MeshStandardMaterial({ color: 0x6b5d4c, roughness: 0.9 }));
  add(cyl(0.07, 0.11, 1.9, 8), bark, g, 0, S + 0.9);
  const forks: [number, number][] = [[0.5, 0.35], [-0.45, -0.3], [0.1, -0.5]];
  for (const [fx, fz] of forks) add(tube([[0, S + 1.7, 0], [fx * 0.6, S + 2.4, fz * 0.6]], 0.045), bark, g);
  // crown: leaf clusters around the forks; near LOD has more clusters, far LOD a few large ones
  const near: THREE.BufferGeometry[] = [], far: THREE.BufferGeometry[] = [];
  const centres: [number, number, number][] = [];
  for (let k = 0; k < 14; k++) { const a = rnd() * Math.PI * 2, r = 0.3 + rnd() * 0.85; centres.push([Math.cos(a) * r, S + 2.3 + rnd() * 1.2, Math.sin(a) * r]); }
  centres.forEach(([x, y, z], k) => near.push(new THREE.IcosahedronGeometry(0.42 + rnd() * 0.25, 1).translate(x, y, z).scale(1, k % 3 ? 0.85 : 1, 1)));
  for (const [x, y, z] of [[0, S + 2.8, 0], [0.5, S + 2.6, 0.3], [-0.45, S + 2.7, -0.3]] as [number, number, number][]) far.push(new THREE.IcosahedronGeometry(0.85, 0).translate(x, y, z));
  const leaf = leafMats[seed % leafMats.length];
  const crown = new THREE.LOD();
  const nearMesh = new THREE.Mesh(mergeGeometries(near)!, leaf.clone()); nearMesh.castShadow = true;
  const farMesh = new THREE.Mesh(mergeGeometries(far)!, leaf.clone());
  crown.addLevel(nearMesh, 0); crown.addLevel(farMesh, 55);
  g.add(crown);
  return { group: g, crown, crownMeshes: [nearMesh, farMesh] };
}

// ---------------------------------------------------------------- 5. bus shelter (4 x 1.6 m, open front)
export interface ShelterHandles { group: THREE.Group; roof: THREE.Mesh[] }
export function buildBusShelter(parent: THREE.Object3D): ShelterHandles {
  const g = new THREE.Group(); parent.add(g);
  const W = 4, D = 1.6, H = 2.55;
  const frame = darkSteel();
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2], [0, -D / 2]] as [number, number][]) add(box(0.08, H, 0.08), frame, g, x, H / 2, z);
  add(box(W, 0.06, 0.06), frame, g, 0, 0.12, -D / 2);
  add(box(0.06, 0.06, D), frame, g, -W / 2, 0.12, 0); add(box(0.06, 0.06, D), frame, g, W / 2, 0.12, 0);
  // rear and side glass (clear so action behind stays readable), separate meshes
  add(new THREE.PlaneGeometry(W - 0.1, H - 0.4), clearGlass(), g, 0, H / 2 + 0.1, -D / 2 + 0.01, false);
  for (const sx of [-1, 1]) { const p = add(new THREE.PlaneGeometry(D - 0.5, H - 0.4), clearGlass(), g, sx * (W / 2 - 0.01), H / 2 + 0.1, 0.2, false); p.rotation.y = Math.PI / 2; }
  // illuminated (blank) advertising panel on the left end, swappable material
  const ad = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6e6).multiplyScalar(1.6) }); ad.name = 'ad_panel';
  add(box(0.12, 1.75, 1.15), frame, g, -W / 2, 1.2, -0.12);
  const panel = add(new THREE.PlaneGeometry(1.05, 1.62), ad, g, -W / 2 - 0.065, 1.2, -0.12, false); panel.rotation.y = -Math.PI / 2;
  // bench inside
  add(box(1.8, 0.05, 0.38), galv(), g, 0.6, 0.48, -D / 2 + 0.28);
  for (const x of [-0.2, 1.4]) add(box(0.05, 0.46, 0.05), frame, g, x, 0.24, -D / 2 + 0.3);
  // roof with light strip
  const roof = add(box(W + 0.3, 0.12, D + 0.25), frame, g, 0, H + 0.06, 0.05);
  const strip = add(box(W - 0.4, 0.02, 0.12), M('stripGlow', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d8).multiplyScalar(2.2) })), g, 0, H - 0.01, 0.3, false);
  return { group: g, roof: [roof, strip] };
}
/** collision for the shelter: rear wall and two sides only, the open front stays traversable (local coords) */
export const SHELTER_COLLIDERS = [{ x0: -2.05, z0: -0.85, x1: 2.05, z1: -0.7 }, { x0: -2.1, z0: -0.85, x1: -1.95, z1: 0.8 }, { x0: 1.95, z0: -0.85, x1: 2.1, z1: 0.8 }];

// ---------------------------------------------------------------- 6. crowd barrier (galvanised tubes, feet, snap hooks)
let barrierGeo: THREE.BufferGeometry | null = null;
export function buildCrowdBarrier(len = 2.5): THREE.Group {
  const g = new THREE.Group();
  if (!barrierGeo) {
    const L = len / 2, H = 1.08, B = 0.2;
    const parts: THREE.BufferGeometry[] = [
      tube([[-L, 0.12, 0], [-L, H, 0], [L, H, 0], [L, 0.12, 0]], 0.022),         // outer frame
      tube([[-L, B, 0], [L, B, 0]], 0.018),                                      // bottom rail
    ];
    for (let k = 1; k < 14; k++) { const x = -L + (k * len) / 14; parts.push(tube([[x, B, 0], [x, H, 0]], 0.009)); }
    for (const x of [-L + 0.12, L - 0.12]) parts.push(tube([[x - 0.02, 0.32, 0], [x, 0.02, 0.32], [x, 0.02, -0.32], [x - 0.02, 0.32, 0]], 0.014)); // flat feet
    for (const [x, y] of [[-L - 0.06, 0.95], [L + 0.06, 0.3]]) parts.push(new THREE.TorusGeometry(0.045, 0.01, 6, 10).translate(x, y, 0)); // snap hooks
    barrierGeo = mergeGeometries(parts)!;
  }
  add(barrierGeo, galv(), g);
  for (const [n, x] of [['snap_left', -len / 2 - 0.06], ['snap_right', len / 2 + 0.06]] as const) { const s = new THREE.Object3D(); s.name = n; s.position.set(x, 0.6, 0); g.add(s); }
  return g;
}

// ---------------------------------------------------------------- 7. camera mast (trailer, outriggers, mast, cabinet, camera pivots)
export function buildCameraMast(): THREE.Group {
  const g = new THREE.Group();
  const yb = M('hazard', () => new THREE.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.6 }));
  add(box(1.2, 0.22, 1.2), galv(), g, 0, 0.42, 0);
  for (const sx of [-1, 1]) { const w = add(cyl(0.16, 0.16, 0.09, 12), darkSteel(), g, sx * 0.62, 0.17, 0.3); w.rotation.z = Math.PI / 2; }
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as [number, number][]) { // outriggers (stempels)
    add(box(0.07, 0.07, 0.55), galv(), g, x * 0.62, 0.42, z * 0.62).rotation.y = Math.atan2(x, z);
    add(box(0.06, 0.55, 0.06), yb, g, x * 0.85, 0.28, z * 0.85);
    add(box(0.18, 0.03, 0.18), darkSteel(), g, x * 0.85, 0.015, z * 0.85);
  }
  add(cyl(0.09, 0.11, 2.6, 10), galv(), g, 0, 1.8, 0);
  add(cyl(0.07, 0.08, 2.2, 10), galv(), g, 0, 4.2, 0);
  add(box(0.34, 0.48, 0.2), M('cab', () => new THREE.MeshStandardMaterial({ color: 0xd8dadc, roughness: 0.5 })), g, 0.12, 1.75, 0.16);
  add(box(0.6, 0.05, 0.05), galv(), g, 0, 5.1, 0);
  // camera pivots: rotated slowly by the view; the gameplay detection range is not derived from them
  const camBody = M('camBody', () => new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 }));
  for (const [i, x] of [[1, -0.3], [2, 0.3]] as const) {
    const p = new THREE.Group(); p.name = `cam_pivot_${i}`; p.position.set(x, 5.05, 0); g.add(p);
    add(box(0.14, 0.13, 0.36), camBody, p, 0, -0.08, 0.12);
    add(new THREE.CircleGeometry(0.04, 10), M('lens', () => new THREE.MeshBasicMaterial({ color: 0x223355 })), p, 0, -0.08, 0.305, false);
  }
  const dome = new THREE.Group(); dome.name = 'cam_pivot_3'; dome.position.set(0, 5.35, 0); g.add(dome);
  add(new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M('domeGl', () => new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.1, metalness: 0.4 })), dome);
  add(cyl(0.12, 0.12, 0.08, 12), camBody, dome, 0, 0.04, 0);
  const led = add(new THREE.SphereGeometry(0.025, 6, 4), M('led', () => new THREE.MeshBasicMaterial({ color: 0xff2a2a })), g, 0.12, 1.95, 0.27, false); void led;
  return g;
}

// ---------------------------------------------------------------- 8. delivery van (generic, unbranded, decorative)
export function buildDeliveryVan(): THREE.Group {
  const g = new THREE.Group();
  const body = M('vanBody', () => new THREE.MeshStandardMaterial({ color: 0xf0f1f2, roughness: 0.32, metalness: 0.15 }));
  const trim = M('vanTrim', () => new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6 }));
  const glass = M('vanGlass', () => new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.08, metalness: 0.6 }));
  const L = 5.2, Wd = 2.0;
  add(box(Wd, 1.65, 3.5), body, g, 0, 1.33, -0.8);                         // cargo box
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.0001, 1, 1, 4, 1).rotateY(Math.PI / 4), body);
  add(box(Wd, 1.15, 1.2), body, g, 0, 1.08, 1.5);                           // cab
  const bonnet = add(box(Wd - 0.02, 0.5, 0.75), body, g, 0, 0.82, 2.25); void bonnet; void cab;
  const ws = add(new THREE.PlaneGeometry(Wd - 0.2, 0.8), glass, g, 0, 1.52, 2.0, false); ws.rotation.x = -0.55;
  for (const sx of [-1, 1]) {
    add(new THREE.PlaneGeometry(0.9, 0.55), glass, g, sx * (Wd / 2 + 0.005), 1.42, 1.45, false).rotation.y = sx * Math.PI / 2;
    add(box(0.02, 1.0, 0.02), trim, g, sx * (Wd / 2 + 0.01), 1.1, 0.88);   // door seam
    add(box(0.03, 0.06, 0.2), trim, g, sx * (Wd / 2 + 0.03), 1.05, 1.2);    // handle
    const mir = new THREE.Group(); mir.name = sx < 0 ? 'mirror_left' : 'mirror_right'; mir.position.set(sx * (Wd / 2 + 0.16), 1.45, 1.95); g.add(mir);
    add(box(0.06, 0.24, 0.16), trim, mir);
    add(box(0.25, 0.04, 0.04), trim, mir, -sx * 0.1, -0.08, 0);
    add(box(0.02, 0.05, 3.3), trim, g, sx * (Wd / 2 + 0.005), 0.72, -0.6, false); // rubbing strip
    add(box(0.02, 1.4, 0.02), trim, g, sx * (Wd / 2 + 0.005), 1.3, -0.3);   // sliding door seam
    const hl = add(new THREE.PlaneGeometry(0.42, 0.16), M('vanHead', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6dd).multiplyScalar(1.5) })), g, sx * 0.68, 0.9, 2.63, false); void hl;
    const tl = add(new THREE.PlaneGeometry(0.14, 0.4), M('vanTail', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc0181a).multiplyScalar(1.2) })), g, sx * 0.88, 1.05, -2.56, false); tl.rotation.y = Math.PI;
  }
  add(box(Wd - 0.2, 0.32, 0.06), trim, g, 0, 0.62, 2.62);                   // grille/bumper
  add(box(Wd, 0.18, 0.12), trim, g, 0, 0.42, -2.58);                         // rear bumper
  add(box(0.02, 1.5, 0.02), trim, g, 0, 1.3, -2.56);                         // rear doors seam
  for (const [x, z, n] of [[-1, 1.75, 'wheel_fl'], [1, 1.75, 'wheel_fr'], [-1, -1.7, 'wheel_rl'], [1, -1.7, 'wheel_rr']] as [number, number, string][]) {
    const w = new THREE.Group(); w.name = n; w.position.set(x * (Wd / 2 - 0.1), 0.36, z); g.add(w);
    add(cyl(0.36, 0.36, 0.26, 16), M('tyre', () => new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 })), w).rotation.z = Math.PI / 2;
    add(cyl(0.2, 0.2, 0.27, 10), galv(), w).rotation.z = Math.PI / 2;
  }
  void L;
  return g;
}

// ---------------------------------------------------------------- 1. fountain (octagonal basin, three bowls, water meshes)
export interface FountainBuild { group: THREE.Group; animated: Scroll[]; spray: THREE.Points | null }
/** shape 'round' follows concept images 01-03 (round basin on a raised stone platform, sculpture group); 'octagon' the street-props sheet */
export function buildOctagonFountain(f: Circle, parent: THREE.Object3D, reduced: boolean, shape: 'octagon' | 'round' = 'octagon'): FountainBuild {
  const g = new THREE.Group(); g.position.set(f.x, 0, f.z); parent.add(g);
  const animated: Scroll[] = [];
  const R = f.r * 0.8; // basin inside the ring of planters/benches (the gameplay obstacle stays the map circle)
  const seg = 8; const side = 2 * R * Math.tan(Math.PI / seg);
  if (shape === 'round') {
    // raised platform (two shallow steps) the benches and planters stand on
    add(cyl(f.r + 0.25, f.r + 0.35, 0.12, 48), M('fplat', () => new THREE.MeshStandardMaterial({ color: 0x9c8f78, roughness: 0.7 })), g, 0, 0.06, 0);
    add(cyl(R + 0.7, R + 0.75, 0.1, 48), stone(), g, 0, 0.17, 0);
    // basin wall with moulded base and a broad coping, as a lathe profile
    add(lathe([[R - 0.2, 0.2], [R + 0.18, 0.2], [R + 0.22, 0.28], [R + 0.16, 0.34], [R + 0.16, 0.58], [R + 0.3, 0.62], [R + 0.3, 0.72], [R - 0.22, 0.72], [R - 0.22, 0.5]], 56), stone(), g);
  } else {
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2 + Math.PI / seg;
      const wall = add(box(side, 0.62, 0.3), stone(), g, Math.cos(a) * R, 0.31, Math.sin(a) * R); wall.rotation.y = -a + Math.PI / 2;
      const cope = add(box(side + 0.1, 0.1, 0.46), stone(), g, Math.cos(a) * R, 0.67, Math.sin(a) * R); cope.rotation.y = -a + Math.PI / 2;
      const panel = add(box(side * 0.6, 0.32, 0.03), M('relief', () => new THREE.MeshStandardMaterial({ color: 0xbfb194, roughness: 0.9 })), g, Math.cos(a) * (R + 0.16), 0.33, Math.sin(a) * (R + 0.16)); panel.rotation.y = -a + Math.PI / 2;
      const pa = (k / seg) * Math.PI * 2; const pr = R / Math.cos(Math.PI / seg);
      add(box(0.42, 0.82, 0.42), stone(), g, Math.cos(pa) * pr, 0.41, Math.sin(pa) * pr).rotation.y = -pa;            // pier
      add(new THREE.SphereGeometry(0.11, 10, 8), stone(), g, Math.cos(pa) * pr, 0.93, Math.sin(pa) * pr);              // ball finial
    }
  }
  add(box(0.01, 0.01, 0.01), stone(), g); // keeps the group non-empty for merging tools
  const rip = rippleTexture().clone(); rip.repeat.set(3, 3); rip.needsUpdate = true; animated.push({ tex: rip, vx: 0.015, vy: 0.01 });
  const water = M('fwater', () => new THREE.MeshStandardMaterial({ map: rip, color: 0x5a7a78, roughness: 0.04, metalness: 0.4, emissive: 0x2e4440, emissiveIntensity: 0.6 }));
  (water as THREE.MeshStandardMaterial).map = rip;
  add(new THREE.CylinderGeometry(R - 0.12, R - 0.12, 0.02, shape === 'round' ? 48 : seg).rotateY(Math.PI / seg), water, g, 0, 0.55, 0, false);
  const glow = M('fglow', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2b0).multiplyScalar(1.6), transparent: true, opacity: 0.7 }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; add(new THREE.CircleGeometry(0.06, 10).rotateX(-Math.PI / 2), glow, g, Math.cos(a) * (R - 0.6), 0.57, Math.sin(a) * (R - 0.6), false); }
  // underwater lights: a warm additive glow over the basin (image 03)
  const uw = M('fUnderGlow', () => new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,214,140,0.22)', 'rgba(255,200,120,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; add(new THREE.CircleGeometry(1.5, 20).rotateX(-Math.PI / 2), uw, g, Math.cos(a) * (R - 0.8), 0.575, Math.sin(a) * (R - 0.8), false); }
  // pedestal and three scalloped bowls, pineapple finial
  add(lathe([[0, 0.5], [0.9, 0.5], [0.9, 0.66], [0.62, 0.78], [0.48, 1.15], [0.6, 1.25], [0.36, 1.38], [0.3, 1.7], [0.42, 1.8], [0, 1.8]], 24), stone(), g);
  if (shape === 'round') {
    // sculpture group on the pedestal: four seated figures (weathered bronze-stone) leaning against the column
    const fig = M('fsculpt', () => new THREE.MeshStandardMaterial({ color: 0x8f8a74, roughness: 0.55, metalness: 0.35 }));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4; const fx = Math.cos(a) * 0.62, fz = Math.sin(a) * 0.62;
      const body = new THREE.Group(); body.position.set(fx, 0.78, fz); body.rotation.y = -a + Math.PI / 2; g.add(body);
      add(new THREE.CapsuleGeometry(0.17, 0.42, 4, 8), fig, body, 0, 0.38, 0.04).rotation.x = -0.25;            // torso
      add(new THREE.SphereGeometry(0.13, 10, 8), fig, body, 0, 0.78, 0.13);                                    // head
      add(new THREE.CapsuleGeometry(0.08, 0.36, 4, 6), fig, body, 0.12, 0.12, 0.28).rotation.x = Math.PI / 2.3; // thighs
      add(new THREE.CapsuleGeometry(0.08, 0.36, 4, 6), fig, body, -0.12, 0.12, 0.28).rotation.x = Math.PI / 2.3;
      const arm = add(new THREE.CapsuleGeometry(0.06, 0.4, 4, 6), fig, body, 0.2, 0.62, 0.0); arm.rotation.z = 2.6;  // arm raised to the bowl
    }
  }
  const bowls: [number, number][] = [[1.75, 1.85], [1.15, 2.75], [0.62, 3.45]];
  bowls.forEach(([r, y], i) => {
    const pts: [number, number][] = [[0, y - 0.05], [0.3, y], [r * 0.7, y + 0.22], [r, y + 0.36], [r + 0.06, y + 0.44], [r - 0.06, y + 0.46], [r * 0.68, y + 0.36], [0, y + 0.3]];
    add(lathe(pts, 32), stone(), g);
    add(new THREE.CircleGeometry(r - 0.08, 32).rotateX(-Math.PI / 2), water, g, 0, y + 0.42, 0, false);
    if (i < 2) add(lathe([[0, y + 0.3], [0.2, y + 0.35], [0.14, y + 0.62], [0.22, y + 0.82], [0.18, bowls[i + 1][1]], [0, bowls[i + 1][1]]], 12), stone(), g);
  });
  add(lathe([[0, 3.85], [0.14, 3.9], [0.2, 4.05], [0.16, 4.25], [0.08, 4.38], [0.03, 4.5], [0, 4.55]], 12), M('fbronze', () => new THREE.MeshStandardMaterial({ color: 0x9a8458, roughness: 0.35, metalness: 0.8 })), g);
  if (!reduced) {
    for (const [r, top] of bowls) {
      const ft = fallingWaterTexture().clone(); ft.repeat.set(12, 1); ft.needsUpdate = true; animated.push({ tex: ft, vx: 0, vy: 0.9 });
      const h = top + 0.42 - (top === bowls[0][1] ? 0.57 : 0) - (top === bowls[0][1] ? 0 : 0);
      const fallTo = top === bowls[0][1] ? 0.57 : bowls[bowls.findIndex((b) => b[1] === top) - 1][1] + 0.42;
      const hh = top + 0.44 - fallTo; void h;
      const sheet = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.05, r + 0.12, hh, 32, 1, true), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xf4fbff, opacity: 0.2 }));
      sheet.position.y = fallTo + hh / 2; g.add(sheet);
    }
  }
  let spray: THREE.Points | null = null;
  if (!reduced) {
    const pos = new Float32Array(160 * 3); const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    spray = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0xcfeaff, size: 0.07, transparent: true, opacity: 0.8 }));
    spray.position.set(f.x, 0, f.z); parent.add(spray);
  }
  return { group: g, animated, spray };
}

// ---------------------------------------------------------------- extinguisher (effects pack props/extinguisher.png), 0.55 m, bottom pivot
export function buildExtinguisher(): THREE.Group {
  const g = new THREE.Group();
  const red = M('extRed', () => new THREE.MeshStandardMaterial({ color: 0xc3191a, roughness: 0.32, metalness: 0.1 }));
  add(lathe([[0, 0], [0.085, 0], [0.09, 0.02], [0.09, 0.4], [0.075, 0.45], [0.035, 0.47], [0, 0.47]], 18), red, g);
  add(box(0.09, 0.02, 0.0), red, g);
  add(new THREE.PlaneGeometry(0.08, 0.12), M('extLabel', () => new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.6 })), g, 0, 0.26, 0.091, false);
  add(box(0.18, 0.012, 0.03), darkSteel(), g, 0, 0.32, 0.0).scale.set(1, 1, 1);
  add(cyl(0.018, 0.02, 0.05, 8), galv(), g, 0, 0.495, 0);
  const lever = add(box(0.12, 0.012, 0.025), red, g, 0.03, 0.535, 0); lever.rotation.z = -0.25;
  add(new THREE.SphereGeometry(0.018, 8, 6), galv(), g, -0.04, 0.505, 0.02);
  add(tube([[0.02, 0.5, -0.01], [0.09, 0.47, -0.03], [0.11, 0.3, -0.03], [0.1, 0.12, -0.02]], 0.009), darkSteel(), g);
  add(cyl(0.012, 0.016, 0.06, 8), darkSteel(), g, 0.1, 0.1, -0.02);
  return g;
}


// ---------------------------------------------------------------- café terrace set (images 01/02): round bistro table with chairs
const marble = () => M('bistroTop', () => new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.25 }));
const rattan = () => M('rattan', () => new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.75 }));
const rattanSeat = () => M('rattanSeat', () => new THREE.MeshStandardMaterial({ color: 0x2c3a5a, roughness: 0.8 })); // woven seat in Paris-café blue
/** bistro table (0.6 m marble top, cast-iron base) with `chairs` rattan chairs around it; front +Z */
export function buildBistroSet(parent: THREE.Object3D, chairs = 2, seed = 1): THREE.Group {
  const g = new THREE.Group(); parent.add(g); const r = seeded(seed * 97 + 13);
  add(cyl(0.3, 0.3, 0.03, 20), marble(), g, 0, 0.74, 0);
  add(cyl(0.025, 0.03, 0.7, 8), castIron(), g, 0, 0.38, 0);
  add(cyl(0.2, 0.22, 0.03, 12), castIron(), g, 0, 0.015, 0);
  // a cup or a glass on the table
  add(cyl(0.035, 0.03, 0.07, 8), M('cup', () => new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.3 })), g, 0.1, 0.79, 0.05, false);
  for (let k = 0; k < chairs; k++) {
    const a = (k / chairs) * Math.PI * 2 + Math.PI / 2 + (r() - 0.5) * 0.4; const d = 0.62;
    const c = new THREE.Group(); c.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); c.rotation.y = -a - Math.PI / 2; g.add(c);
    add(box(0.42, 0.04, 0.4), rattanSeat(), c, 0, 0.46, 0);
    for (const [lx, lz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) add(cyl(0.015, 0.015, 0.46, 6), rattan(), c, lx, 0.23, lz, false);
    add(tube([[-0.19, 0.46, 0.19], [-0.2, 0.86, 0.22], [0.2, 0.86, 0.22], [0.19, 0.46, 0.19]], 0.018), rattan(), c);
    add(box(0.38, 0.22, 0.02), rattanSeat(), c, 0, 0.7, 0.21, false);
  }
  return g;
}
