import * as THREE from 'three';
import type { BuildingDef, MapDef, PropDef, StoreDef } from '../maps/types';
import { mat } from './humans';
import { VAN } from '../sim/nav';
import { crackTexture, facadeTexture, groundTexture, interiorTexture, radialTexture, roofTexture, shutterTexture, signTexture, waterTexture } from './textures';

export interface StoreVisual {
  group: THREE.Group;
  windows: THREE.Mesh[];
  cracks: THREE.Mesh[];
  shutter: THREE.Mesh;
  debris: THREE.Group;
  light: THREE.PointLight | null;
  hit: THREE.Mesh;
  def: StoreDef;
  stage: number;
  fillStep: number;
  level: number;
}

export interface Fadeable { meshes: THREE.Mesh[]; box: THREE.Box3; opacity: number }

export interface WorldHandles {
  group: THREE.Group;
  ground: THREE.Mesh;
  stores: StoreVisual[];
  fadeables: Fadeable[];
  cars: Map<number, { intact: THREE.Group; burned: THREE.Group }>;
  van: THREE.Group;
  vanLights: THREE.Mesh[];
  water: THREE.Mesh[];
  fountainWater: THREE.Points | null;
  lampLights: THREE.PointLight[];
}

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);

function mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, shadow = true) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz);
  o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
}

function facadeMat(b: BuildingDef, width: number, variant: number): THREE.MeshStandardMaterial {
  const t = facadeTexture(b.style, variant).clone();
  const cols = b.style === 'canal' ? 2 : b.style === 'modern' ? 4 : 3;
  const floors = b.style === 'haussmann' || b.style === 'berlin' ? 6 : 5;
  t.repeat.set(Math.max(1, Math.round(width / (cols * 2))), b.height / (floors * 3.2));
  t.offset.y = 1 - (b.height / (floors * 3.2)) % 1;
  t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, transparent: false });
}

function buildBuilding(b: BuildingDef, parent: THREE.Group, idx: number, fadeables: Fadeable[]) {
  const r = b.rect; const w = r.x1 - r.x0, d = r.z1 - r.z0; const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const g = new THREE.Group(); parent.add(g);
  const sideMat = facadeMat(b, d, idx % 3), frontMat = facadeMat(b, w, (idx + 1) % 3);
  const roofTop = new THREE.MeshStandardMaterial({ map: roofTexture(b.style), roughness: 0.7 });
  const mats = [sideMat, sideMat, roofTop, roofTop, frontMat, frontMat];
  const meshes: THREE.Mesh[] = [];
  const passages = b.passages ?? [];
  if (passages.length === 0) {
    const body = new THREE.Mesh(box, mats); body.position.set(cx, b.height / 2, cz); body.scale.set(w, b.height, d);
    body.castShadow = true; body.receiveShadow = true; g.add(body); meshes.push(body);
  } else {
    // a building with a walkable passage/arch: build the upper storeys over the passage and solid blocks beside it
    const p = passages[0]; const archH = 4.2;
    const horizontal = p.x1 - p.x0 > p.z1 - p.z0;
    const pieces: [number, number, number, number][] = horizontal
      ? [[r.x0, r.z0, r.x1, p.z0], [r.x0, p.z1, r.x1, r.z1]]
      : [[r.x0, r.z0, p.x0, r.z1], [p.x1, r.z0, r.x1, r.z1]];
    for (const [x0, z0, x1, z1] of pieces) {
      if (x1 - x0 < 0.05 || z1 - z0 < 0.05) continue;
      const m = new THREE.Mesh(box, mats); m.position.set((x0 + x1) / 2, b.height / 2, (z0 + z1) / 2); m.scale.set(x1 - x0, b.height, z1 - z0);
      m.castShadow = m.receiveShadow = true; g.add(m); meshes.push(m);
    }
    const over = new THREE.Mesh(box, mats);
    over.position.set((p.x0 + p.x1) / 2, archH + (b.height - archH) / 2, (p.z0 + p.z1) / 2);
    over.scale.set(p.x1 - p.x0, b.height - archH, p.z1 - p.z0); over.castShadow = true; g.add(over); meshes.push(over);
    // warm passage lighting
    const glow = mesh(box, new THREE.MeshBasicMaterial({ color: 0xffc27a }), g, (p.x0 + p.x1) / 2, archH - 0.05, (p.z0 + p.z1) / 2, horizontal ? (p.x1 - p.x0) * 0.8 : 0.3, 0.05, horizontal ? 0.3 : (p.z1 - p.z0) * 0.8, false);
    void glow;
  }
  // roof
  const slate = new THREE.MeshStandardMaterial({ map: roofTexture(b.style), roughness: 0.6, metalness: 0.15 });
  if (b.style === 'haussmann' || b.style === 'berlin') {
    const roofH = 3.4;
    const frustum = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.82, Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4);
    const rf = mesh(frustum, slate, g, cx, b.height + roofH / 2, cz, w, roofH, d); meshes.push(rf);
    // dormers and chimneys along the long sides
    const dm = mat(0x3b4350, 0.6); const win = new THREE.MeshBasicMaterial({ color: 0xffcf8a });
    const n = Math.floor(w / 4);
    for (let i = 0; i < n; i++) {
      const x = r.x0 + 2 + i * 4 + (w - n * 4) / 2;
      for (const side of [1, -1]) {
        const z = side > 0 ? r.z1 - 0.7 : r.z0 + 0.7;
        meshes.push(mesh(box, dm, g, x, b.height + 1.4, z, 1.2, 1.6, 1.0));
        if (Math.sin(x * 3.1 + idx) > -0.2) meshes.push(mesh(box, win, g, x, b.height + 1.3, z + side * 0.51, 0.6, 0.9, 0.02, false));
      }
      if (i % 3 === 1) meshes.push(mesh(box, mat(0x8a6f5a, 0.9), g, x + 1.5, b.height + 4.2, cz, 0.9, 1.8, 2.2));
    }
  } else if (b.style === 'canal' || b.style === 'brick') {
    // row of gables / pitched roofs
    const n = Math.max(1, Math.round(w / 5)); const gw = w / n;
    const gable = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2, 1, 3, 1).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const h = 3 + ((i * 7) % 3) * 0.6;
      meshes.push(mesh(gable, slate, g, r.x0 + gw * (i + 0.5), b.height + h * 0.35, cz, gw * 1.0, h, d));
    }
  } else if (b.style === 'italian') {
    const hip = new THREE.CylinderGeometry(0.0, Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4);
    meshes.push(mesh(hip, slate, g, cx, b.height + 1.2, cz, w * 1.04, 2.4, d * 1.04));
  } else {
    // flat roof with parapet and plant boxes
    meshes.push(mesh(box, mat(0x6d7176, 0.8), g, cx, b.height + 0.4, cz, w * 0.96, 0.8, d * 0.96));
    meshes.push(mesh(box, mat(0x8a8e94, 0.6, 0.3), g, cx + w * 0.2, b.height + 1.2, cz, 2.5, 1.2, 1.8));
  }
  if (b.fadeable) {
    const bx = new THREE.Box3(new THREE.Vector3(r.x0, 0, r.z0), new THREE.Vector3(r.x1, b.height + 4, r.z1));
    for (const m of meshes) {
      const ms = Array.isArray(m.material) ? m.material : [m.material];
      m.material = ms.map((mm) => { const c = (mm as THREE.Material).clone(); c.transparent = true; return c; });
      if ((m.material as THREE.Material[]).length === 1) m.material = (m.material as THREE.Material[])[0];
    }
    fadeables.push({ meshes, box: bx, opacity: 1 });
  }
}

function buildStore(s: StoreDef, idx: number, parent: THREE.Group, withLight: boolean): StoreVisual {
  const g = new THREE.Group();
  g.position.set(s.front.x, 0, s.front.z);
  g.rotation.y = Math.atan2(s.normal.x, s.normal.z);
  parent.add(g);
  const w = s.width;
  const frameM = mat(s.color, 0.55, 0.1);
  mesh(box, frameM, g, 0, 2.05, 0.06, w + 0.5, 4.1, 0.14);
  const sign = mesh(new THREE.PlaneGeometry(w - 0.4, 0.75), new THREE.MeshBasicMaterial({ map: signTexture(s.name, s.kind, s.color) }), g, 0, 3.55, 0.14, 1, 1, 1, false);
  void sign;
  const winW = (w - 1.8) / 2;
  const windows: THREE.Mesh[] = []; const cracks: THREE.Mesh[] = [];
  for (const sx of [-1, 1]) {
    const x = sx * (winW / 2 + 0.85);
    const wm = mesh(new THREE.PlaneGeometry(winW, 2.3), new THREE.MeshBasicMaterial({ map: interiorTexture(s.kind, 1), color: 0xffffff }), g, x, 1.65, 0.141, 1, 1, 1, false);
    windows.push(wm);
    const cm = mesh(new THREE.PlaneGeometry(winW, 2.3), new THREE.MeshBasicMaterial({ map: crackTexture(1), transparent: true, depthWrite: false }), g, x, 1.65, 0.15, 1, 1, 1, false);
    cm.visible = false; cracks.push(cm);
  }
  // door (glass with interior behind)
  const door = mesh(new THREE.PlaneGeometry(1.3, 2.5), new THREE.MeshBasicMaterial({ map: interiorTexture(s.kind, 1), color: 0xbbbbbb }), g, 0, 1.25, 0.141, 1, 1, 1, false);
  windows.push(door);
  const dc = mesh(new THREE.PlaneGeometry(1.3, 2.5), new THREE.MeshBasicMaterial({ map: crackTexture(2), transparent: true, depthWrite: false }), g, 0, 1.25, 0.15, 1, 1, 1, false);
  dc.visible = false; cracks.push(dc);
  // shutter housing + rolling shutter (lowered height reflects shutter level)
  mesh(box, mat(0x5d646c, 0.5, 0.5), g, 0, 3.05, 0.22, w - 0.3, 0.25, 0.22);
  const shTex = shutterTexture().clone(); shTex.repeat.set(w / 2, 1); shTex.needsUpdate = true;
  const shutter = mesh(new THREE.PlaneGeometry(w - 0.4, 1), new THREE.MeshStandardMaterial({ map: shTex, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0.92 }), g, 0, 2.9, 0.2, 1, 0.2, 1, false);
  // a hit area that matches the visible shopfront
  const hit = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 2, 0.6); hit.scale.set(w + 0.5, 4.2, 1.6); hit.userData.store = idx; g.add(hit);
  // debris: shards, boxes, bent panels (hidden until damaged)
  const debris = new THREE.Group(); g.add(debris);
  const shardM = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.39) % (Math.PI * 2); const rr = 0.4 + ((i * 37) % 23) / 10;
    const sh = mesh(box, i % 3 === 0 ? mat(0xa77d4e, 0.95) : shardM, debris, Math.cos(a) * rr * 0.9, 0.03, 0.5 + Math.abs(Math.sin(a)) * rr * 0.8, i % 3 === 0 ? 0.3 : 0.18, i % 3 === 0 ? 0.2 : 0.015, i % 3 === 0 ? 0.25 : 0.12);
    sh.rotation.y = a * 3; sh.userData.stage = i < 10 ? 1 : i < 18 ? 2 : 3;
  }
  debris.visible = false;
  let light: THREE.PointLight | null = null;
  if (withLight) { light = new THREE.PointLight(0xffb36a, 28, 14, 1.6); light.position.set(0, 2.2, 1.6); g.add(light); }
  return { group: g, windows, cracks, shutter, debris, light, hit, def: s, stage: 0, fillStep: 4, level: 1 };
}

export function updateStoreVisual(v: StoreVisual, structureRatio: number, stockRatio: number, level: number, breached: boolean) {
  const stage = breached ? 3 : structureRatio < 0.35 ? 2 : structureRatio < 0.7 ? 1 : 0;
  if (stage !== v.stage) {
    v.stage = stage;
    v.cracks.forEach((c, i) => { c.visible = stage >= 1 && (i < 2 || stage >= 2); (c.material as THREE.MeshBasicMaterial).map = crackTexture(stage >= 2 ? 2 : 1); });
    v.debris.visible = stage >= 1;
    v.debris.children.forEach((d) => (d.visible = (d.userData.stage as number) <= stage));
    if (v.light) v.light.intensity = stage >= 3 ? 10 : 28;
  }
  // shutter: higher level = lowered reinforced grille; breached = bent and hanging
  const lv = level;
  if (breached) {
    v.shutter.scale.y = 1.4; v.shutter.position.y = 2.2; v.shutter.rotation.set(-0.5, 0, 0.18); v.shutter.position.z = 0.6;
  } else {
    const hgt = lv >= 3 ? 1.9 : lv >= 2 ? 1.2 : 0.22;
    v.shutter.rotation.set(0, 0, 0); v.shutter.position.z = 0.2;
    v.shutter.scale.y = hgt; v.shutter.position.y = 3.0 - hgt / 2;
    (v.shutter.material as THREE.MeshStandardMaterial).color.setHex(lv >= 2 ? 0x9fc6e6 : 0xffffff);
  }
  const fill = Math.round(stockRatio * 4);
  if (fill !== v.fillStep) {
    v.fillStep = fill;
    for (const w of v.windows) (w.material as THREE.MeshBasicMaterial).map = interiorTexture(v.def.kind, stockRatio);
  }
  const dim = breached ? 0.55 : 1;
  for (const w of v.windows) (w.material as THREE.MeshBasicMaterial).color.setScalar(dim * (w === v.windows[2] ? 0.75 : 1));
}

export function buildCar(color: number, burned: boolean): THREE.Group {
  const g = new THREE.Group();
  const body = burned ? mat(0x2a2522, 1) : mat(color, 0.35, 0.5);
  mesh(box, body, g, 0, 0.55, 0, 1.8, 0.6, 4.3);
  mesh(box, burned ? mat(0x1a1715, 1) : new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.1, metalness: 0.6 }), g, 0, 1.05, -0.2, 1.6, 0.5, 2.2);
  for (const [x, z] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) {
    const wh = mesh(cyl, mat(burned ? 0x111111 : 0x161616, 0.9), g, x, 0.32, z, 0.32, 0.22, 0.32); wh.rotation.z = Math.PI / 2;
  }
  if (!burned) { mesh(box, new THREE.MeshBasicMaterial({ color: 0xfff2d0 }), g, 0, 0.6, 2.16, 1.4, 0.12, 0.02, false); mesh(box, new THREE.MeshBasicMaterial({ color: 0xaa1010 }), g, 0, 0.65, -2.16, 1.4, 0.1, 0.02, false); }
  return g;
}

export function buildVan(): { g: THREE.Group; lights: THREE.Mesh[] } {
  const g = new THREE.Group();
  mesh(box, mat(0xf2f3f5, 0.35, 0.2), g, 0, 1.25, 0, 2.1, 1.9, VAN.len);
  mesh(box, mat(0x1b3a8a, 0.4), g, 0, 1.0, 0, 2.12, 0.3, VAN.len * 0.98);
  mesh(box, new THREE.MeshStandardMaterial({ color: 0x18222c, roughness: 0.1, metalness: 0.6 }), g, 0, 1.6, VAN.len / 2 - 0.4, 1.9, 0.7, 0.8);
  for (const [x, z] of [[-0.95, 1.8], [0.95, 1.8], [-0.95, -1.8], [0.95, -1.8]]) { const wh = mesh(cyl, mat(0x141414, 0.9), g, x, 0.36, z, 0.36, 0.24, 0.36); wh.rotation.z = Math.PI / 2; }
  const lights: THREE.Mesh[] = [];
  for (const x of [-0.45, 0.45]) lights.push(mesh(box, new THREE.MeshBasicMaterial({ color: 0x2a5cff }), g, x, 2.28, VAN.len / 2 - 0.9, 0.7, 0.14, 0.25, false));
  return { g, lights };
}

export function buildTruck(): THREE.Group {
  const g = new THREE.Group();
  mesh(box, mat(0xf4f4f4, 0.5), g, 0, 1.9, -0.8, 2.4, 2.6, 5.2);
  mesh(box, mat(0xe8e8e8, 0.35, 0.2), g, 0, 1.4, 2.6, 2.3, 2.0, 1.8);
  mesh(box, new THREE.MeshStandardMaterial({ color: 0x18222c, roughness: 0.1, metalness: 0.5 }), g, 0, 1.9, 3.5, 2.0, 0.8, 0.05);
  mesh(box, new THREE.MeshBasicMaterial({ color: 0xffa020 }), g, 0, 2.5, 2.6, 0.4, 0.15, 0.3, false);
  for (const [x, z] of [[-1.1, 2.4], [1.1, 2.4], [-1.1, -2.2], [1.1, -2.2]]) { const wh = mesh(cyl, mat(0x141414, 0.9), g, x, 0.45, z, 0.45, 0.3, 0.45); wh.rotation.z = Math.PI / 2; }
  return g;
}

function buildProp(p: PropDef, parent: THREE.Group, i: number, cars: WorldHandles['cars'], lamps: THREE.Vector3[]) {
  const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = ((p.rot ?? 0) * Math.PI) / 180; parent.add(g);
  switch (p.type) {
    case 'lamp': {
      mesh(cyl, mat(0x1b1d22, 0.5, 0.6), g, 0, 2.1, 0, 0.07, 4.2, 0.07);
      mesh(box, new THREE.MeshBasicMaterial({ color: 0xffd28a }), g, 0, 4.3, 0, 0.32, 0.45, 0.32, false);
      mesh(box, mat(0x1b1d22, 0.5, 0.6), g, 0, 4.6, 0, 0.42, 0.08, 0.42);
      lamps.push(new THREE.Vector3(p.x, 4.2, p.z));
      break;
    }
    case 'tree': case 'palm': {
      if (p.type === 'palm') {
        const tr = mesh(cyl, mat(0x6a5440, 0.9), g, 0, 2.6, 0, 0.14, 5.2, 0.14); tr.rotation.z = 0.08;
        for (let k = 0; k < 7; k++) { const f = mesh(new THREE.ConeGeometry(0.3, 2.6, 4), mat(0x2f5a2a, 0.8), g, Math.cos(k) * 0.9, 5.0, Math.sin(k) * 0.9); f.rotation.set(Math.sin(k) * 1.2, 0, -Math.cos(k) * 1.2); }
      } else {
        mesh(cyl, mat(0x4a3a2a, 0.9), g, 0, 1.3, 0, 0.12, 2.6, 0.12);
        const leaf = mat([0x3d5a2a, 0x5a6a2a, 0x7a6a2a][i % 3], 0.9);
        mesh(new THREE.IcosahedronGeometry(1.3, 0), leaf, g, 0, 3.3, 0);
        mesh(new THREE.IcosahedronGeometry(0.9, 0), leaf, g, 0.4, 4.1, 0.2);
        mesh(box, mat(0x5a5048, 0.9), g, 0, 0.2, 0, 1.4, 0.4, 1.4);
      }
      break;
    }
    case 'planter': mesh(box, mat(0x3a3a3c, 0.8), g, 0, 0.35, 0, 1.4, 0.7, 1.4); mesh(new THREE.IcosahedronGeometry(0.75, 0), mat(0x3a5a2a, 0.9), g, 0, 1.1, 0); break;
    case 'bench': mesh(box, mat(0x5a3a22, 0.8), g, 0, 0.45, 0, 1.8, 0.08, 0.5); mesh(box, mat(0x5a3a22, 0.8), g, 0, 0.75, -0.22, 1.8, 0.5, 0.06); break;
    case 'bollard': mesh(cyl, mat(0x202226, 0.6, 0.3), g, 0, 0.45, 0, 0.12, 0.9, 0.12); break;
    case 'umbrella': {
      mesh(cyl, mat(0x2a2a2a, 0.6), g, 0, 1.2, 0, 0.04, 2.4, 0.04);
      mesh(new THREE.ConeGeometry(1.6, 0.6, 8), mat(0xe9dfc8, 0.9), g, 0, 2.5, 0);
      for (let k = 0; k < 3; k++) { const a = k * 2.1; mesh(cyl, mat(0x3a2a1a, 0.7), g, Math.cos(a) * 0.9, 0.38, Math.sin(a) * 0.9, 0.35, 0.05, 0.35); }
      break;
    }
    case 'kiosk': mesh(box, mat(0x2f4a3a, 0.6), g, 0, 1.3, 0, 2, 2.6, 2); mesh(box, new THREE.MeshBasicMaterial({ color: 0xffd28a }), g, 0, 1.4, 1.01, 1.4, 0.8, 0.02, false); break;
    case 'phonebox': mesh(box, mat(0x9a1a1a, 0.5), g, 0, 1.25, 0, 0.9, 2.5, 0.9); mesh(box, new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), g, 0, 1.4, 0.46, 0.6, 1.2, 0.02, false); break;
    case 'column': mesh(cyl, mat(0xd9c8a4, 0.8), g, 0, 2.5, 0, p.r ?? 0.35, 5, p.r ?? 0.35); break;
    case 'car': {
      const intact = buildCar([0x5a5f66, 0x2a3a5a, 0x7a2a2a, 0x8a8a88, 0x1a1a1a][i % 5], false);
      const burned = buildCar(0, true); burned.visible = false;
      g.add(intact, burned); cars.set(i, { intact, burned });
      g.rotation.y = p.rot === 90 ? 0 : Math.PI / 2;
      break;
    }
  }
}

export function buildWorld(map: MapDef, scene: THREE.Scene, reducedFx: boolean): WorldHandles {
  const group = new THREE.Group(); scene.add(group);
  const b = map.bounds; const W = b.x1 - b.x0 + 80, D = b.z1 - b.z0 + 80;
  const gt = groundTexture(map.ground).clone(); gt.repeat.set(W / 3.5, D / 3.5); gt.needsUpdate = true;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.32, metalness: 0.25, envMapIntensity: 0.6 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); ground.receiveShadow = true; group.add(ground);
  // kerbs/pavement bands along every building
  const pave = new THREE.MeshStandardMaterial({ map: groundTexture('stone'), roughness: 0.4, metalness: 0.15, polygonOffset: true, polygonOffsetFactor: -1 });
  for (const bd of map.buildings) {
    const r = bd.rect; const m = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0 + 3.2, r.z1 - r.z0 + 3.2), pave);
    m.rotation.x = -Math.PI / 2; m.position.set((r.x0 + r.x1) / 2, 0.015, (r.z0 + r.z1) / 2); m.receiveShadow = true; group.add(m);
  }
  const fadeables: Fadeable[] = [];
  map.buildings.forEach((bd, i) => buildBuilding(bd, group, i, fadeables));
  const stores = map.stores.map((s, i) => buildStore(s, i, group, !reducedFx));
  // walls / railings / quays
  for (const w of map.walls) {
    const h = w.h ?? 2.6;
    mesh(box, h <= 1.2 ? mat(0x1c1d20, 0.5, 0.6) : mat(0xb8ab92, 0.85), group, (w.x0 + w.x1) / 2, h / 2, (w.z0 + w.z1) / 2, w.x1 - w.x0, h, w.z1 - w.z0);
  }
  // water with quay walls and bridges
  const water: THREE.Mesh[] = [];
  for (const wr of map.water) {
    const wt = waterTexture().clone(); wt.repeat.set((wr.x1 - wr.x0) / 8, (wr.z1 - wr.z0) / 8); wt.needsUpdate = true;
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(wr.x1 - wr.x0, wr.z1 - wr.z0), new THREE.MeshStandardMaterial({ map: wt, color: 0x9fc0d0, roughness: 0.12, metalness: 0.15, emissive: 0x0d2a38, emissiveIntensity: 1.0, envMapIntensity: 1.5 }));
    wm.rotation.x = -Math.PI / 2; wm.position.set((wr.x0 + wr.x1) / 2, -0.9, (wr.z0 + wr.z1) / 2); group.add(wm); water.push(wm);
    // dark pit walls so the canal reads as a cut below street level
    const quay = mat(0x6a5a48, 0.9);
    mesh(box, quay, group, (wr.x0 + wr.x1) / 2, 0.08, wr.z0 + 0.15, wr.x1 - wr.x0, 0.16, 0.3, false);
    mesh(box, quay, group, (wr.x0 + wr.x1) / 2, 0.08, wr.z1 - 0.15, wr.x1 - wr.x0, 0.16, 0.3, false);
    // water surface drawn just above street level (the quay edge and railings mark the drop)
    wm.position.y = 0.03;
  }
  for (const br of map.bridges) {
    const deck = mesh(box, mat(0x8a7560, 0.85), group, (br.x0 + br.x1) / 2, 0.06, (br.z0 + br.z1) / 2, br.x1 - br.x0, 0.12, br.z1 - br.z0);
    void deck;
    const along = br.z1 - br.z0 > br.x1 - br.x0;
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, true, 0, Math.PI), mat(0x6a5a48, 0.9));
    if (along) { arch.rotation.z = Math.PI / 2; arch.scale.set(0.8, br.x1 - br.x0, (br.z1 - br.z0) * 0.35); }
    else { arch.rotation.x = Math.PI / 2; arch.rotation.z = 0; arch.scale.set((br.x1 - br.x0) * 0.35, br.z1 - br.z0, 0.8); }
    arch.position.set((br.x0 + br.x1) / 2, 0.05, (br.z0 + br.z1) / 2); group.add(arch);
  }
  // planted islands
  for (const is of map.islands) {
    mesh(box, mat(0x6a665e, 0.9), group, (is.x0 + is.x1) / 2, 0.12, (is.z0 + is.z1) / 2, is.x1 - is.x0, 0.24, is.z1 - is.z0);
    mesh(box, mat(0x2f4a24, 0.95), group, (is.x0 + is.x1) / 2, 0.26, (is.z0 + is.z1) / 2, is.x1 - is.x0 - 0.4, 0.06, is.z1 - is.z0 - 0.4);
    const n = Math.max(2, Math.floor((is.x1 - is.x0) / 3));
    for (let k = 0; k < n; k++) mesh(new THREE.IcosahedronGeometry(0.8, 0), mat(0x34532a, 0.9), group, is.x0 + 1 + k * ((is.x1 - is.x0 - 2) / Math.max(1, n - 1)), 0.9, (is.z0 + is.z1) / 2);
  }
  // arcades: walkable floor under a roof slab carried by columns
  for (const a of map.arcades) {
    const r = a.rect;
    const roof = mesh(box, mat(0xd2c19c, 0.85), group, (r.x0 + r.x1) / 2, a.height + 0.4, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.8, r.z1 - r.z0);
    const glowM = new THREE.MeshBasicMaterial({ color: 0xffcf8a });
    const under = mesh(box, glowM, group, (r.x0 + r.x1) / 2, a.height - 0.02, (r.z0 + r.z1) / 2, (r.x1 - r.x0) * 0.6, 0.03, (r.z1 - r.z0) * 0.6, false);
    for (const c of a.columns) mesh(cyl, mat(0xddd0b0, 0.8), group, c.x, a.height / 2, c.z, c.r, a.height, c.r);
    const ms = [roof, under];
    for (const m of ms) { m.material = (m.material as THREE.Material).clone(); (m.material as THREE.Material).transparent = true; }
    fadeables.push({ meshes: ms, box: new THREE.Box3(new THREE.Vector3(r.x0, a.height - 0.2, r.z0), new THREE.Vector3(r.x1, a.height + 0.8, r.z1)), opacity: 1 });
  }
  // fountain
  let fountainWater: THREE.Points | null = null;
  if (map.fountain) {
    const f = map.fountain; const stone = mat(0xc9bb9e, 0.8);
    const fg = new THREE.Group(); fg.position.set(f.x, 0, f.z); group.add(fg);
    mesh(new THREE.CylinderGeometry(f.r * 0.86, f.r * 0.88, 0.7, 40, 1, true), stone, fg, 0, 0.35, 0);
    mesh(new THREE.TorusGeometry(f.r * 0.87, 0.16, 8, 48).rotateX(Math.PI / 2), stone, fg, 0, 0.7, 0);
    mesh(new THREE.CylinderGeometry(f.r * 1.0, f.r * 1.0, 0.08, 40), mat(0x8f8676, 0.85), fg, 0, 0.04, 0);
    const wmat = new THREE.MeshStandardMaterial({ color: 0x1d4656, roughness: 0.05, metalness: 0.5, emissive: 0x0a2430, emissiveIntensity: 0.6 });
    mesh(new THREE.CylinderGeometry(f.r * 0.84, f.r * 0.84, 0.05, 40), wmat, fg, 0, 0.6, 0);
    mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.8, 12), stone, fg, 0, 1.3, 0);
    mesh(new THREE.CylinderGeometry(1.6, 0.4, 0.35, 20), mat(0xa89a80, 0.8), fg, 0, 2.2, 0);
    mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.04, 20), wmat, fg, 0, 2.39, 0);
    mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.1, 10), stone, fg, 0, 2.9, 0);
    mesh(new THREE.CylinderGeometry(0.85, 0.25, 0.25, 16), stone, fg, 0, 3.45, 0);
    mesh(new THREE.SphereGeometry(0.3, 10, 8), mat(0xb8a27a, 0.6, 0.3), fg, 0, 3.85, 0);
    const lightRing = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      mesh(box, mat(0x3a3a3c, 0.8), fg, Math.cos(a) * (f.r - 0.35), 0.35, Math.sin(a) * (f.r - 0.35), 1.0, 0.7, 1.0).rotation.y = -a;
      mesh(new THREE.IcosahedronGeometry(0.55, 0), mat(0x3a5a2a, 0.9), fg, Math.cos(a) * (f.r - 0.35), 1.0, Math.sin(a) * (f.r - 0.35));
      mesh(box, lightRing, fg, Math.cos(a + 0.4) * f.r * 0.86, 0.72, Math.sin(a + 0.4) * f.r * 0.86, 0.15, 0.06, 0.15, false);
    }
    if (!reducedFx) {
      const n = 160; const pos = new Float32Array(n * 3);
      const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      fountainWater = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0xcfeaff, size: 0.09, transparent: true, opacity: 0.8 }));
      fountainWater.position.set(f.x, 0, f.z); group.add(fountainWater);
    }
  }
  const cars: WorldHandles['cars'] = new Map();
  const lampPos: THREE.Vector3[] = [];
  map.props.forEach((p, i) => buildProp(p, group, i, cars, lampPos));
  // warm light pools on the wet ground (cheap reflection substitute) + a few real lights
  const pool = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,190,110,0.55)', 'rgba(255,170,90,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const lampLights: THREE.PointLight[] = [];
  lampPos.forEach((lp, i) => {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), pool); pm.rotation.x = -Math.PI / 2; pm.position.set(lp.x, 0.03, lp.z); group.add(pm);
    if (!reducedFx && i < 4) { const l = new THREE.PointLight(0xffc27a, 18, 12, 1.6); l.position.copy(lp); group.add(l); lampLights.push(l); }
  });
  for (const s of map.stores) {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(s.width + 2, 5), pool); pm.rotation.x = -Math.PI / 2;
    pm.rotation.z = -Math.atan2(s.normal.x, s.normal.z);
    pm.position.set(s.front.x + s.normal.x * 2.4, 0.032, s.front.z + s.normal.z * 2.4); group.add(pm);
  }
  // support van (staging point)
  const { g: van, lights: vanLights } = buildVan();
  van.position.set(map.van.x, 0, map.van.z); van.rotation.y = (map.van.rot * Math.PI) / 180; group.add(van);
  // loading lane markings
  if (map.loadingLane) {
    const r = map.loadingLane;
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), new THREE.MeshBasicMaterial({ color: 0xe0b020, transparent: true, opacity: 0.18, depthWrite: false }));
    lm.rotation.x = -Math.PI / 2; lm.position.set((r.x0 + r.x1) / 2, 0.04, (r.z0 + r.z1) / 2); group.add(lm);
  }
  return { group, ground, stores, fadeables, cars, van, vanLights, water, fountainWater, lampLights };
}

export function skyTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#060c1e'); grd.addColorStop(0.5, '#15254a'); grd.addColorStop(0.85, '#3b4d7c'); grd.addColorStop(1, '#6a5a6a');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
