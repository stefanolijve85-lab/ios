import * as THREE from 'three';
import type { Circle, MapDef } from '../maps/types';
import { fallingWaterTexture, grateTexture, groundTexture, manholeTexture, rippleTexture } from './textures';

// Street furniture and the Paris fountain, built from reusable geometry and shared materials.

const shared = new Map<string, THREE.Material>();
function sm(key: string, make: () => THREE.Material): THREE.Material { let m = shared.get(key); if (!m) { m = make(); shared.set(key, m); } return m; }
const iron = () => sm('iron', () => new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.42, metalness: 0.75 }));
const greenIron = () => sm('giron', () => new THREE.MeshStandardMaterial({ color: 0x1d3328, roughness: 0.5, metalness: 0.6 }));
const wood = () => sm('wood', () => new THREE.MeshStandardMaterial({ color: 0x6b4428, roughness: 0.7 }));
const stoneM = () => sm('fstone', () => new THREE.MeshStandardMaterial({ map: groundTexture('stone'), color: 0xe4d8bf, roughness: 0.75 }));

function m(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, shadow = true) {
  const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
}
const lathe = (pts: [number, number][], seg = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ---------------------------------------------------------------- lamp: cast-iron candelabra with a glazed lantern
const LAMP_GEO = {
  base: lathe([[0, 0], [0.26, 0], [0.26, 0.07], [0.2, 0.12], [0.19, 0.42], [0.23, 0.48], [0.13, 0.56], [0.1, 0.95], [0.07, 1.05], [0, 1.05]], 16),
  pole: new THREE.CylinderGeometry(0.045, 0.06, 2.9, 10),
  ring: new THREE.TorusGeometry(0.075, 0.02, 6, 14).rotateX(Math.PI / 2),
  lantern: new THREE.CylinderGeometry(0.21, 0.13, 0.55, 4, 1).rotateY(Math.PI / 4),
  frame: new THREE.BoxGeometry(0.025, 0.58, 0.025),
  roof: new THREE.ConeGeometry(0.3, 0.3, 4).rotateY(Math.PI / 4),
  finial: new THREE.SphereGeometry(0.05, 8, 6),
  cradle: new THREE.CylinderGeometry(0.16, 0.06, 0.16, 8),
};
export function buildLamp(parent: THREE.Object3D): THREE.Group {
  const g = new THREE.Group(); parent.add(g);
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd08a).multiplyScalar(5) }); glow.name = 'glow';
  m(LAMP_GEO.base, iron(), g);
  m(LAMP_GEO.pole, iron(), g, 0, 1.05 + 1.45);
  for (const y of [1.4, 3.85]) m(LAMP_GEO.ring, iron(), g, 0, y);
  m(LAMP_GEO.cradle, iron(), g, 0, 4.02);
  m(LAMP_GEO.lantern, glow, g, 0, 4.38, 0, false);
  for (const [x, z] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) { const f = m(LAMP_GEO.frame, iron(), g, x * 1.1, 4.38, z * 1.1); f.rotation.set(z * 0.5, 0, -x * 0.5); }
  m(LAMP_GEO.roof, iron(), g, 0, 4.8);
  m(LAMP_GEO.finial, iron(), g, 0, 5.0);
  return g;
}

// ---------------------------------------------------------------- bench: cast-iron ends, timber slats
let benchEnd: THREE.ExtrudeGeometry | null = null;
export function buildBench(parent: THREE.Object3D, len = 1.8): THREE.Group {
  const g = new THREE.Group(); parent.add(g);
  if (!benchEnd) {
    const s = new THREE.Shape();
    s.moveTo(0.24, 0); s.lineTo(0.2, 0.42); s.lineTo(-0.22, 0.42); s.lineTo(-0.3, 0.9); s.lineTo(-0.25, 0.92); s.lineTo(-0.16, 0.48);
    s.lineTo(-0.22, 0); s.lineTo(-0.16, 0); s.lineTo(-0.12, 0.36); s.lineTo(0.13, 0.36); s.lineTo(0.18, 0); s.closePath();
    benchEnd = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-0.025, 0, 0);
  }
  for (const x of [-len / 2 + 0.1, len / 2 - 0.1]) m(benchEnd, greenIron(), g, x, 0, 0);
  const slat = new THREE.BoxGeometry(len, 0.035, 0.07);
  for (let k = 0; k < 5; k++) m(slat, wood(), g, 0, 0.44, 0.2 - k * 0.095);
  for (let k = 0; k < 3; k++) { const b = m(slat, wood(), g, 0, 0.56 + k * 0.12, -0.235 - k * 0.025); b.rotation.x = -0.3; }
  return g;
}

// ---------------------------------------------------------------- fountain
export interface Scroll { tex: THREE.Texture; vx: number; vy: number }
export interface FountainHandles { group: THREE.Group; animated: Scroll[]; spray: THREE.Points | null }
export function buildFountain(f: Circle, parent: THREE.Object3D, reduced: boolean): FountainHandles {
  const g = new THREE.Group(); g.position.set(f.x, 0, f.z); parent.add(g);
  const animated: Scroll[] = [];
  const R = f.r * 0.86;
  // outer basin: moulded coping and plinth
  m(lathe([[R - 0.25, 0.12], [R - 0.2, 0.72], [R + 0.05, 0.78], [R + 0.25, 0.84], [R + 0.32, 0.76], [R + 0.22, 0.7], [R + 0.25, 0.12], [R + 0.45, 0.06], [R + 0.5, 0]], 64), stoneM(), g);
  const rip = rippleTexture().clone(); rip.repeat.set(3, 3); rip.needsUpdate = true; animated.push({ tex: rip, vx: 0.015, vy: 0.01 });
  const water = new THREE.MeshStandardMaterial({ map: rip, color: 0x6ab0b8, roughness: 0.05, metalness: 0.4, emissive: 0x0c3a40, emissiveIntensity: 0.9, envMapIntensity: 1.5 });
  m(new THREE.CircleGeometry(R - 0.22, 48).rotateX(-Math.PI / 2), water, g, 0, 0.6, 0, false);
  // underwater lights around the basin floor
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2b0).multiplyScalar(1.6), transparent: true, opacity: 0.7 });
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; m(new THREE.CircleGeometry(0.06, 10).rotateX(-Math.PI / 2), glow, g, Math.cos(a) * (R - 0.6), 0.61, Math.sin(a) * (R - 0.6), false); }
  // central pedestal, lower and upper bowls, finial
  m(lathe([[0, 0.5], [0.85, 0.5], [0.85, 0.7], [0.6, 0.8], [0.5, 1.2], [0.62, 1.3], [0.4, 1.4], [0.32, 1.75], [0.45, 1.85], [0, 1.85]], 24), stoneM(), g);
  m(lathe([[0, 1.85], [0.4, 1.9], [1.2, 2.1], [1.75, 2.28], [1.82, 2.4], [1.7, 2.42], [1.15, 2.3], [0, 2.25]], 40), stoneM(), g);
  m(new THREE.CircleGeometry(1.68, 40).rotateX(-Math.PI / 2), water, g, 0, 2.36, 0, false);
  m(lathe([[0, 2.3], [0.22, 2.35], [0.16, 2.7], [0.26, 2.95], [0.18, 3.05], [0, 3.05]], 16), stoneM(), g);
  m(lathe([[0, 3.0], [0.25, 3.05], [0.75, 3.2], [0.95, 3.32], [0.88, 3.36], [0, 3.3]], 32), stoneM(), g);
  m(lathe([[0, 3.3], [0.12, 3.35], [0.08, 3.6], [0.2, 3.75], [0.16, 3.95], [0.06, 4.05], [0, 4.1]], 16), sm('bronze', () => new THREE.MeshStandardMaterial({ color: 0x8a7348, roughness: 0.35, metalness: 0.85 })), g);
  // falling water curtains from both bowls
  if (!reduced) {
    for (const [r, top, h] of [[1.78, 2.38, 1.78], [0.92, 3.32, 0.95]] as const) {
      const ft = fallingWaterTexture().clone(); ft.repeat.set(14, 1); ft.needsUpdate = true; animated.push({ tex: ft, vx: 0, vy: 0.9 });
      const sheet = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.12, h, 48, 1, true), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xdff2ff, opacity: 0.75 }));
      sheet.position.y = top - h / 2; g.add(sheet);
    }
  }
  let spray: THREE.Points | null = null;
  if (!reduced) {
    const n = 160; const pos = new Float32Array(n * 3);
    const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    spray = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0xcfeaff, size: 0.07, transparent: true, opacity: 0.8 }));
    spray.position.set(f.x, 0, f.z); parent.add(spray);
  }
  return { group: g, animated, spray };
}

// ---------------------------------------------------------------- pavements: gutters, manhole covers, drain grates
export function buildStreetDetails(map: MapDef, parent: THREE.Object3D): void {
  const gutterTex = groundTexture('cobble').clone(); gutterTex.needsUpdate = true;
  const gutterM = new THREE.MeshStandardMaterial({ map: gutterTex, color: 0x6a6460, roughness: 0.12, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });
  const mh = new THREE.MeshStandardMaterial({ map: manholeTexture(), transparent: true, roughness: 0.35, metalness: 0.7, polygonOffset: true, polygonOffsetFactor: -3 });
  const gr = new THREE.MeshStandardMaterial({ map: grateTexture(), roughness: 0.4, metalness: 0.7, polygonOffset: true, polygonOffsetFactor: -3 });
  const strips: THREE.Matrix4[] = []; const grates: THREE.Matrix4[] = [];
  const PL = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const inside = (x: number, z: number, pad: number) => map.buildings.some((b) => x > b.rect.x0 - pad && x < b.rect.x1 + pad && z > b.rect.z0 - pad && z < b.rect.z1 + pad);
  for (const b of map.buildings) {
    const r = b.rect; const p = 1.6 + 0.33; // pavement band 1.6 m + kerb
    const edges: [number, number, number, number][] = [
      [(r.x0 + r.x1) / 2, r.z1 + p, r.x1 - r.x0 + 2 * p, 0], [(r.x0 + r.x1) / 2, r.z0 - p, r.x1 - r.x0 + 2 * p, 0],
      [r.x1 + p, (r.z0 + r.z1) / 2, r.z1 - r.z0 + 2 * p, 1], [r.x0 - p, (r.z0 + r.z1) / 2, r.z1 - r.z0 + 2 * p, 1],
    ];
    for (const [x, z, len, vert] of edges) {
      strips.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.017, z), new THREE.Quaternion(), new THREE.Vector3(vert ? 0.32 : len, 1, vert ? len : 0.32)));
      for (let t = -len / 2 + 4; t < len / 2 - 2; t += 11) {
        const gx = vert ? x : x + t, gz = vert ? z + t : z;
        if (gx < map.bounds.x0 || gx > map.bounds.x1 || gz < map.bounds.z0 || gz > map.bounds.z1 || inside(gx, gz, 1.0)) continue;
        grates.push(new THREE.Matrix4().compose(new THREE.Vector3(gx, 0.02, gz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, vert ? Math.PI / 2 : 0, 0)), new THREE.Vector3(0.7, 1, 0.32)));
      }
    }
  }
  const inst = (mat: THREE.Material, ms: THREE.Matrix4[]) => { if (!ms.length) return; const im = new THREE.InstancedMesh(PL, mat, ms.length); ms.forEach((mm, i) => im.setMatrixAt(i, mm)); im.receiveShadow = true; im.renderOrder = 1; parent.add(im); };
  inst(gutterM, strips); inst(gr, grates);
  // manhole covers on open ground, kept clear of buildings and the fountain
  let s = 4242; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const covers: THREE.Matrix4[] = [];
  for (let tries = 0; tries < 200 && covers.length < 9; tries++) {
    const x = map.bounds.x0 + 3 + rnd() * (map.bounds.x1 - map.bounds.x0 - 6), z = map.bounds.z0 + 3 + rnd() * (map.bounds.z1 - map.bounds.z0 - 6);
    if (inside(x, z, 2.5)) continue;
    if (map.fountain && Math.hypot(x - map.fountain.x, z - map.fountain.z) < map.fountain.r + 1.5) continue;
    if (map.water.some((w) => x > w.x0 - 1 && x < w.x1 + 1 && z > w.z0 - 1 && z < w.z1 + 1)) continue;
    covers.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.021, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 6, 0)), new THREE.Vector3(0.75, 1, 0.75)));
  }
  inst(mh, covers);
}
