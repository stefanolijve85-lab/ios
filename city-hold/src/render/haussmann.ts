import * as THREE from 'three';
import type { BuildingDef, MapDef, Rect, StoreDef } from '../maps/types';
import { rectContains } from '../maps/types';
import { roofTexture } from './textures';
import { pbr } from './pbr';

// Modular Haussmann facade kit. Facades are assembled from real geometry (piers, spandrels, recessed windows,
// frames, stone surrounds, string courses, cornice, wrought-iron balconies) instead of painted textures.
// Every element type is one InstancedMesh per building, so a whole street costs a few dozen draw calls.

export const GROUND_H = 4.4;            // ground-floor (shop) storey height
const WALL_D = 0.45;                    // depth of the facade layer: windows sit this far back
const STONE = [0xe2d3b4, 0xd8c6a3, 0xe8dcc0, 0xd2bd98, 0xdccbab, 0xcfbf9f];

let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ---------------------------------------------------------------- textures (generated once)
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let texCache: Record<string, THREE.Texture> | null = null;
function kitTextures() {
  if (texCache) return texCache;
  const stone = canvasTex(256, 256, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) { const v = 200 + Math.random() * 55; g.fillStyle = `rgba(${v},${v - 6},${v - 18},0.35)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 1 + Math.random() * 2); }
    for (let i = 0; i < 18; i++) { const x = Math.random() * 256; const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, 'rgba(90,80,70,0.10)'); grd.addColorStop(1, 'rgba(90,80,70,0)'); g.fillStyle = grd; g.fillRect(x, 0, 2 + Math.random() * 6, 256); }
  });
  stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
  const rustic = canvasTex(128, 256, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 256);
    for (let y = 0; y < 256; y += 32) { g.fillStyle = 'rgba(60,50,40,0.55)'; g.fillRect(0, y, 128, 4); g.fillStyle = 'rgba(255,250,240,0.4)'; g.fillRect(0, y + 4, 128, 2); }
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(150,130,100,${Math.random() * 0.15})`; g.fillRect(Math.random() * 128, Math.random() * 256, 2, 2); }
  });
  const lit = canvasTex(128, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#ffe7b8'); grd.addColorStop(0.6, '#f0b066'); grd.addColorStop(1, '#a8642e');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 256);
    g.fillStyle = 'rgba(150,60,40,0.55)'; g.fillRect(0, 0, 26, 256); g.fillRect(102, 0, 26, 256); // curtains
    g.fillStyle = 'rgba(255,245,220,0.6)'; g.beginPath(); g.ellipse(64, 40, 20, 12, 0, 0, Math.PI * 2); g.fill(); // ceiling light
    g.fillStyle = 'rgba(70,40,25,0.5)'; g.fillRect(40, 170, 50, 60); // furniture silhouette
  });
  const dark = canvasTex(64, 128, (g) => {
    const grd = g.createLinearGradient(0, 0, 64, 128); grd.addColorStop(0, '#5a6d8c'); grd.addColorStop(0.45, '#1f2838'); grd.addColorStop(1, '#151a24');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(160,190,230,0.18)'; g.fillRect(4, 4, 22, 60);
  });
  // wrought-iron railing: alpha-tested pattern, one tile per bay
  const rail = canvasTex(256, 96, (g) => {
    g.clearRect(0, 0, 256, 96); g.fillStyle = '#000'; g.strokeStyle = '#000';
    g.fillRect(0, 0, 256, 7); g.fillRect(0, 88, 256, 6);
    for (let x = 0; x <= 256; x += 16) g.fillRect(x, 0, 3, 94);
    g.lineWidth = 3;
    for (let x = 8; x < 256; x += 32) { g.beginPath(); g.ellipse(x + 8, 34, 9, 14, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x + 8, 70, 7, 0, Math.PI * 2); g.stroke(); }
    g.fillRect(0, 54, 256, 3);
  });
  const zinc = roofTexture('haussmann');
  texCache = { stone, rustic, lit, dark, rail, zinc };
  return texCache;
}

// ---------------------------------------------------------------- instanced batches
class Batch {
  mats: THREE.Matrix4[] = []; cols: THREE.Color[] = [];
  constructor(public geo: THREE.BufferGeometry, public mat: THREE.Material, public shadow = false) {}
  add(m: THREE.Matrix4, c?: THREE.Color) { this.mats.push(m); this.cols.push(c ?? new THREE.Color(1, 1, 1)); }
  build(): THREE.InstancedMesh | null {
    if (!this.mats.length) return null;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.mats.length);
    this.mats.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, this.cols[i]); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = this.shadow; im.receiveShadow = true; im.computeBoundingSphere();
    return im;
  }
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);

/** a facade face: origin at the face start, u along the face, n outward */
interface Face { o: THREE.Vector3; u: THREE.Vector3; n: THREE.Vector3; len: number }

function facesOf(r: Rect): Face[] {
  const Y = new THREE.Vector3(0, 1, 0);
  const mk = (ox: number, oz: number, nx: number, nz: number, len: number): Face => {
    const n = new THREE.Vector3(nx, 0, nz); const u = new THREE.Vector3(nz, 0, -nx);
    void Y; return { o: new THREE.Vector3(ox, 0, oz), u, n, len };
  };
  return [
    mk(r.x0, r.z1, 0, 1, r.x1 - r.x0),   // south
    mk(r.x1, r.z0, 0, -1, r.x1 - r.x0),  // north
    mk(r.x1, r.z1, 1, 0, r.z1 - r.z0),   // east
    mk(r.x0, r.z0, -1, 0, r.z1 - r.z0),  // west
  ];
}

function faceVisible(f: Face, map: MapDef, self: BuildingDef): boolean {
  const b = map.bounds;
  for (const t of [0.15, 0.35, 0.5, 0.65, 0.85]) {
    const p = f.o.clone().addScaledVector(f.u, f.len * t).addScaledVector(f.n, 2);
    if (p.x < b.x0 - 4 || p.x > b.x1 + 4 || p.z < b.z0 - 4 || p.z > b.z1 + 4) continue;
    if (map.buildings.some((o) => o !== self && rectContains(o.rect, p.x, p.z))) continue;
    return true;
  }
  return false;
}

/** world matrix of a box centred at (u, v, w) in face space with size (su, sv, sw) */
function fm(f: Face, u: number, v: number, w: number, su: number, sv: number, sw: number): THREE.Matrix4 {
  const basis = new THREE.Matrix4().makeBasis(f.u, new THREE.Vector3(0, 1, 0), f.n);
  const pos = f.o.clone().addScaledVector(f.u, u).addScaledVector(f.n, w); pos.y = v;
  return new THREE.Matrix4().copyPosition(new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z)).multiply(basis).multiply(new THREE.Matrix4().makeScale(su, sv, sw));
}

export interface KitResult { meshes: THREE.Mesh[]; lights: THREE.Vector3[] }

export interface KitOpts { stores: StoreDef[]; mobile: boolean; index: number }
export const SHOP_SPAN_PAD = 0.46;

/** Build one Haussmann block: core volume, facade modules on the faces that face the street, mansard roof. */
export function buildHaussmann(b: BuildingDef, map: MapDef, parent: THREE.Group, opts: KitOpts): KitResult {
  const T = kitTextures();
  seed = 9137 + opts.index * 7919;
  const r = b.rect; const H = b.height;
  const faces = facesOf(r).map((f) => ({ f, vis: faceVisible(f, map, b) }));
  const g = new THREE.Group(); parent.add(g);
  const meshes: THREE.Mesh[] = [];

  const stoneM = new THREE.MeshStandardMaterial({ map: T.stone, roughness: 0.82, color: 0xffffff });
  const rusticM = new THREE.MeshStandardMaterial({ map: T.rustic, roughness: 0.85 });
  const frameM = new THREE.MeshStandardMaterial({ color: 0xf1ead8, roughness: 0.55 });
  const litM = new THREE.MeshStandardMaterial({ map: T.lit, emissiveMap: T.lit, emissive: 0xffb36a, emissiveIntensity: 1.25, roughness: 0.2 });
  const darkM = new THREE.MeshStandardMaterial({ map: T.dark, roughness: 0.08, metalness: 0.55, envMapIntensity: 1.4 });
  const ironM = new THREE.MeshStandardMaterial({ map: T.rail, color: 0x17181b, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.7 });
  const slabM = new THREE.MeshStandardMaterial({ map: T.stone, color: 0xd9ccb0, roughness: 0.8 });
  const doorM = new THREE.MeshStandardMaterial({ color: 0x2c2018, roughness: 0.6 });

  const B = {
    stone: new Batch(BOX, stoneM, true), rustic: new Batch(BOX, rusticM), frame: new Batch(BOX, frameM), lit: new Batch(PLANE, litM),
    dark: new Batch(PLANE, darkM), iron: new Batch(PLANE, ironM), slab: new Batch(BOX, slabM, true), door: new Batch(BOX, doorM),
  };

  // ---- core volume, recessed behind the facade layer on visible faces (deeper at shop level on store faces)
  const storeFaces = faces.map(({ f }) => opts.stores.filter((s) => Math.abs(s.normal.x - f.n.x) < 0.01 && Math.abs(s.normal.z - f.n.z) < 0.01 &&
    Math.abs((s.front.x - f.o.x) * f.n.x + (s.front.z - f.o.z) * f.n.z) < 0.05));
  const inset = (i: number, ground: boolean) => (faces[i].vis ? (ground && storeFaces[i].length ? 4.25 : WALL_D) : 0);
  const coreBox = (y0: number, y1: number, ground: boolean) => {
    // faces: 0 south (z1), 1 north (z0), 2 east (x1), 3 west (x0)
    const x0 = r.x0 + inset(3, ground), x1 = r.x1 - inset(2, ground), z0 = r.z0 + inset(1, ground), z1 = r.z1 - inset(0, ground);
    const ls = pbr('limestone', Math.max(1, (x1 - x0) / 4), Math.max(1, (y1 - y0) / 4));
    const m = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ ...ls, color: 0xe2d6bc, roughness: 1 }));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.scale.set(x1 - x0, y1 - y0, z1 - z0);
    m.castShadow = true; m.receiveShadow = true; g.add(m); meshes.push(m);
  };
  coreBox(0, GROUND_H, true); coreBox(GROUND_H, H, false);

  const top = H - 0.7; // underside of the main cornice
  faces.forEach(({ f, vis }, fi) => {
    if (!vis) return;
    const shops = storeFaces[fi].map((s) => { const c = (s.front.x - f.o.x) * f.u.x + (s.front.z - f.o.z) * f.u.z; return [c - s.width / 2 - 0.46, c + s.width / 2 + 0.46]; });
    const gDepth = shops.length ? 4.25 : WALL_D; // ground-floor wall depth (deep where shop interiors sit behind)
    const inShop = (u0: number, u1: number) => shops.some(([a, b2]) => u1 > a && u0 < b2);
    // split the face into houses of 3-5 bays with their own stone tint and storey height
    let u = 0;
    while (u < f.len - 0.5) {
      let bays = 3 + Math.floor(rnd() * 3); let bw = 2.15 + rnd() * 0.45;
      if (u + bays * bw > f.len) { bays = Math.max(1, Math.round((f.len - u) / bw)); bw = (f.len - u) / bays; }
      const hw = bays * bw; const tint = new THREE.Color(STONE[Math.floor(rnd() * STONE.length)]);
      const avail = top - GROUND_H; const floors = Math.max(3, Math.round(avail / (3.2 + rnd() * 0.5))); const fh = avail / floors;
      // ground floor: free stretches between shopfronts become rusticated bays (or plain wall if too narrow)
      const free: [number, number][] = [[u, u + hw]];
      for (const [a, b2] of shops) for (let i = free.length - 1; i >= 0; i--) {
        const [f0, f1] = free[i]; if (b2 <= f0 || a >= f1) continue;
        free.splice(i, 1, ...([[f0, Math.max(f0, a)], [Math.min(f1, b2), f1]] as [number, number][]).filter(([x0, x1]) => x1 - x0 > 0.01));
      }
      for (const [f0, f1] of free) {
        const len = f1 - f0; const nb = Math.floor(len / 2.0);
        if (nb < 1) { B.rustic.add(fm(f, (f0 + f1) / 2, GROUND_H / 2, -gDepth / 2, len, GROUND_H, gDepth), tint); continue; }
        const bw2 = len / nb;
        for (let k = 0; k < nb; k++) {
          const b0 = f0 + k * bw2, b1 = b0 + bw2;
          const ow = Math.min(1.7, bw2 * 0.62), oc = (b0 + b1) / 2;
          const door = !shops.length && k === Math.floor(nb / 2);
          const oh = door ? 3.5 : 3.1;
          B.rustic.add(fm(f, b0 + (bw2 - ow) / 4, GROUND_H / 2, -gDepth / 2, (bw2 - ow) / 2, GROUND_H, gDepth), tint);
          B.rustic.add(fm(f, b1 - (bw2 - ow) / 4, GROUND_H / 2, -gDepth / 2, (bw2 - ow) / 2, GROUND_H, gDepth), tint);
          B.rustic.add(fm(f, oc, (oh + GROUND_H) / 2, -gDepth / 2, ow, GROUND_H - oh, gDepth), tint);
          if (door) B.door.add(fm(f, oc, oh / 2, -0.32, ow, oh, 0.08));
          else {
            (rnd() < 0.35 ? B.lit : B.dark).add(fm(f, oc, oh / 2 + 0.3, -0.3, ow - 0.1, oh - 0.6, 1));
            B.rustic.add(fm(f, oc, 0.15, -gDepth / 2, ow, 0.3, gDepth), tint);
            if (gDepth > WALL_D) B.rustic.add(fm(f, oc, oh / 2 + 0.3, -gDepth / 2 - 0.2, ow, oh - 0.6, gDepth - 0.4), tint); // closes the void behind the glass
          }
        }
      }
      // ground-floor cornice band over the whole house (also above shops)
      for (const [f0, f1] of free) B.stone.add(fm(f, (f0 + f1) / 2, GROUND_H - 0.12, 0.08, f1 - f0, 0.24, 0.16), tint);
      // upper storeys
      for (let fl = 0; fl < floors; fl++) {
        const y0 = GROUND_H + fl * fh; const noble = fl === 0; const topF = fl === floors - 1;
        const wh = fh * (noble ? 0.7 : topF ? 0.6 : 0.64), sill = noble ? 0.15 : 0.3, ww = Math.min(1.25, bw * 0.52);
        for (let k = 0; k < bays; k++) {
          const b0 = u + k * bw, c = b0 + bw / 2;
          // piers and spandrels around the opening
          B.stone.add(fm(f, b0 + (bw - ww) / 4, y0 + fh / 2, -WALL_D / 2, (bw - ww) / 2, fh, WALL_D), tint);
          B.stone.add(fm(f, b0 + bw - (bw - ww) / 4, y0 + fh / 2, -WALL_D / 2, (bw - ww) / 2, fh, WALL_D), tint);
          B.stone.add(fm(f, c, y0 + sill / 2, -WALL_D / 2, ww, sill, WALL_D), tint);
          const above = fh - sill - wh; B.stone.add(fm(f, c, y0 + sill + wh + above / 2, -WALL_D / 2, ww, above, WALL_D), tint);
          // recessed glass, lit or dark
          (rnd() < 0.5 ? B.lit : B.dark).add(fm(f, c, y0 + sill + wh / 2, -0.33, ww, wh, 1));
          // casement frame and mullion
          const fy = y0 + sill + wh / 2;
          B.frame.add(fm(f, c, fy, -0.3, 0.06, wh, 0.05));
          B.frame.add(fm(f, c, y0 + sill + wh * 0.72, -0.3, ww, 0.05, 0.05));
          B.frame.add(fm(f, c - ww / 2 + 0.03, fy, -0.3, 0.06, wh, 0.06)); B.frame.add(fm(f, c + ww / 2 - 0.03, fy, -0.3, 0.06, wh, 0.06));
          // stone surround, sill and lintel / pediment on the noble floor
          B.stone.add(fm(f, c - ww / 2 - 0.07, fy, 0.03, 0.14, wh + 0.1, 0.06), tint);
          B.stone.add(fm(f, c + ww / 2 + 0.07, fy, 0.03, 0.14, wh + 0.1, 0.06), tint);
          B.stone.add(fm(f, c, y0 + sill - 0.05, 0.06, ww + 0.35, 0.1, 0.14), tint);
          B.stone.add(fm(f, c, y0 + sill + wh + 0.1, 0.05, ww + 0.4, noble ? 0.26 : 0.16, noble ? 0.16 : 0.1), tint);
          if (noble) B.stone.add(fm(f, c, y0 + sill + wh + 0.32, 0.1, ww + 0.55, 0.08, 0.22), tint);
          // individual balconette on the floors without a continuous balcony
          if (!noble && !topF) B.iron.add(fm(f, c, y0 + sill + 0.45, 0.12, ww + 0.2, 0.9, 1));
        }
        // continuous balconies on the noble floor and the top storey (Haussmann rhythm)
        if (noble || topF) {
          B.slab.add(fm(f, u + hw / 2, y0 + 0.07, 0.32, hw - 0.1, 0.14, 0.64), tint);
          for (let k = 0; k < bays; k++) B.iron.add(fm(f, u + k * bw + bw / 2, y0 + 0.62, 0.62, bw, 0.95, 1));
          // consoles under the slab
          for (let k = 0; k <= bays; k++) B.stone.add(fm(f, u + k * bw, y0 - 0.12, 0.25, 0.14, 0.26, 0.5), tint);
        } else B.stone.add(fm(f, u + hw / 2, y0 + 0.05, 0.06, hw, 0.12, 0.12), tint); // string course
      }
      // main cornice
      B.stone.add(fm(f, u + hw / 2, top + 0.25, 0.25, hw + 0.1, 0.5, 0.5), tint);
      B.stone.add(fm(f, u + hw / 2, top + 0.55, 0.38, hw + 0.1, 0.14, 0.76), tint);
      // party-wall pilaster between houses
      B.stone.add(fm(f, u, (GROUND_H + top) / 2, 0.02, 0.22, top - GROUND_H, 0.08), tint.clone().multiplyScalar(0.95));
      u += hw;
    }
  });

  for (const bt of Object.values(B)) { const m = bt.build(); if (m) { g.add(m); meshes.push(m); } }

  // ---- mansard roof: slate/zinc slopes, lit dormers, chimney stacks with pots
  const roofH = 3.6;
  const zt = T.zinc.clone(); zt.repeat.set(Math.max(1, (r.x1 - r.x0) / 4), Math.max(1, (r.z1 - r.z0) / 4)); zt.needsUpdate = true;
  const sl = pbr('slate', Math.max(1, (r.x1 - r.x0) / 3), Math.max(1, (r.z1 - r.z0) / 3));
  // blue-grey slate on the steep lower slope, pale zinc on the shallow top deck (images 01-03); a little metalness so the blue-hour sky reads on it
  const slate = new THREE.MeshStandardMaterial({ ...sl, color: 0xc4ccd8, roughness: 0.62, metalness: 0.35, envMapIntensity: 1.4 });
  const zincTop = new THREE.MeshStandardMaterial({ map: zt, color: 0xb4bcc6, roughness: 0.45, metalness: 0.6, envMapIntensity: 1.5 });
  const frustum = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.8, Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(frustum, [slate, zincTop, slate]); roof.position.set((r.x0 + r.x1) / 2, H + roofH / 2, (r.z0 + r.z1) / 2); roof.scale.set(r.x1 - r.x0 + 0.3, roofH, r.z1 - r.z0 + 0.3);
  roof.castShadow = true; roof.receiveShadow = true; g.add(roof); meshes.push(roof);
  // zinc gutter along the foot of the mansard, catching the light
  const gutter = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0xc9d0d8, roughness: 0.35, metalness: 0.8 }));
  gutter.position.set((r.x0 + r.x1) / 2, H + 0.08, (r.z0 + r.z1) / 2); gutter.scale.set(r.x1 - r.x0 + 0.5, 0.16, r.z1 - r.z0 + 0.5); g.add(gutter); meshes.push(gutter);
  const dB = new Batch(BOX, new THREE.MeshStandardMaterial({ map: T.stone, color: 0xe6dcc6, roughness: 0.7 }), true);
  const dRoof = new Batch(new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2, 1, 3, 1).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), slate, true);
  const dGlass = new Batch(PLANE, litM); const dDark = new Batch(PLANE, darkM);
  const chim = new Batch(BOX, new THREE.MeshStandardMaterial({ map: T.stone, color: 0xb9a888, roughness: 0.9 }), true);
  const pots = new Batch(new THREE.CylinderGeometry(0.11, 0.14, 1, 7), new THREE.MeshStandardMaterial({ color: 0xa5532e, roughness: 0.8 }), true);
  faces.forEach(({ f, vis }) => {
    if (!vis) return;
    const inward = f.n.clone().multiplyScalar(-1);
    for (let u = 1.3; u < f.len - 1; u += 2.4) {
      const base = f.o.clone().addScaledVector(f.u, u).addScaledVector(inward, 0.9);
      const face2: Face = { o: base.clone().addScaledVector(f.u, -u), u: f.u, n: f.n, len: f.len };
      dB.add(fm(face2, u, H + 1.25, 0, 1.15, 1.7, 0.9));
      dRoof.add(fm(face2, u, H + 2.35, 0, 1.35, 0.6, 1.1));
      (rnd() < 0.72 ? dGlass : dDark).add(fm(face2, u, H + 1.2, 0.46, 0.62, 1.05, 1));
    }
    for (let u = 3.5; u < f.len - 2; u += 7 + rnd() * 4) {
      const p = f.o.clone().addScaledVector(f.u, u).addScaledVector(inward, 2.6);
      const face2: Face = { o: p.clone().addScaledVector(f.u, -u), u: f.u, n: f.n, len: f.len };
      chim.add(fm(face2, u, H + roofH + 0.7, 0, 2.2, 2.4, 0.8));
      chim.add(fm(face2, u, H + roofH + 1.95, 0, 2.4, 0.12, 0.95));
      for (let k = 0; k < 4; k++) pots.add(fm(face2, u - 0.75 + k * 0.5, H + roofH + 2.25, 0, 1, 0.45, 1));
    }
  });
  for (const bt of [dB, dRoof, dGlass, dDark, chim, pots]) { const m = bt.build(); if (m) { g.add(m); meshes.push(m); } }

  return { meshes, lights: [] };
}
