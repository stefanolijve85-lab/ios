import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BuildingDef, MapDef, PropDef, StoreDef } from '../maps/types';
import { mat } from './humans';
import { VAN } from '../sim/nav';
import { cloneModel, slotStatus } from './assets';
import { buildExtinguisher, buildBusShelter, buildCameraMast, buildCrowdBarrier, buildDeliveryVan, buildOctagonFountain, buildStreetBench, buildStreetLamp, buildTreePlanter, LAMP_LIGHT_Y, buildBistroSet } from './streetProps';
import { buildHaussmann } from './haussmann';
import { ShopModule } from './shopModule';
import { mergeStatic } from './merge';
import { pbr } from './pbr';
import { buildBench, buildFountain, buildLamp, buildStreetDetails, type Scroll } from './street';
import { crackTexture, facadeEmissive, facadeTexture, groundNormal, groundTexture, interiorTexture, fallingWaterTexture, radialTexture, rippleTexture, roofTexture, streakTexture, shutterTexture, signTexture, waterTexture } from './textures';

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

/** anything that draws a store and reacts to its state */
export interface ShopLike { hit: THREE.Mesh; update(structureRatio: number, stockRatio: number, level: number, breached: boolean, boardRatio?: number): void; setLod?(dist: number): void; justBroke?: boolean; group?: THREE.Group; setScorched?(on: boolean): void }

export interface Fadeable { meshes: THREE.Mesh[]; box: THREE.Box3; opacity: number }

export interface WorldHandles {
  group: THREE.Group;
  ground: THREE.Mesh;
  stores: ShopLike[];
  fadeables: Fadeable[];
  cars: Map<number, { intact: THREE.Group; burned: THREE.Group }>;
  van: THREE.Group;
  vanLights: THREE.Mesh[];
  water: THREE.Mesh[];
  fountainWater: THREE.Points | null;
  animated: Scroll[];
  decorShops: ShopModule[];
  lampLights: THREE.PointLight[];
}

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);

function mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, shadow = true) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz);
  o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
}

/** darker upper storeys and a warm glow from the street on the lower floors (as in the blue-hour concepts) */
export function heightGrade(m: THREE.MeshStandardMaterial, strength = 1) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying float vWY;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = 'varying float vWY;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>\n  diffuseColor.rgb *= mix(1.0, 0.62, smoothstep(5.0, 22.0, vWY) * ${strength.toFixed(2)});`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.6, 0.3) * 0.16 * ${strength.toFixed(2)} * smoothstep(7.5, 0.0, vWY) * diffuseColor.rgb;`);
  };
  m.customProgramCacheKey = () => 'hgrade' + strength;
  return m;
}

function facadeMat(b: BuildingDef, width: number, variant: number): THREE.MeshStandardMaterial {
  const cols = b.style === 'canal' ? 2 : b.style === 'modern' ? 4 : 3;
  const floors = b.style === 'haussmann' || b.style === 'berlin' ? 6 : 5;
  const prep = (src: THREE.Texture) => {
    const t = src.clone();
    t.repeat.set(Math.max(1, Math.round(width / (cols * 2))), b.height / (floors * 3.2));
    t.offset.y = 1 - (b.height / (floors * 3.2)) % 1;
    t.needsUpdate = true; return t;
  };
  const m = new THREE.MeshStandardMaterial({ map: prep(facadeTexture(b.style, variant)), emissiveMap: prep(facadeEmissive(b.style, variant)), emissive: 0xffc080, emissiveIntensity: 1.05, roughness: 0.85 });
  return heightGrade(m);
}

/** chimney row sits near the street-facing (south) edge so it reads from the camera */
function side0(r: { z0: number; z1: number }, idx: number) { const c = (r.z0 + r.z1) / 2; return c > 0 ? r.z0 + 2.2 + (idx % 2) * 1.5 : r.z1 - 2.2 - (idx % 2) * 1.5; }

function registerFade(b: BuildingDef, meshes: THREE.Mesh[], fadeables: Fadeable[]) {
  if (!b.fadeable) return;
  const r = b.rect;
  const bx = new THREE.Box3(new THREE.Vector3(r.x0, 0, r.z0), new THREE.Vector3(r.x1, b.height + 4, r.z1));
  for (const m of meshes) {
    const ms = Array.isArray(m.material) ? m.material : [m.material];
    m.material = ms.map((mm) => { const c = (mm as THREE.Material).clone(); c.transparent = true; return c; });
    if ((m.material as THREE.Material[]).length === 1) m.material = (m.material as THREE.Material[])[0];
  }
  fadeables.push({ meshes, box: bx, opacity: 1 });
}

function buildBuilding(b: BuildingDef, parent: THREE.Group, idx: number, fadeables: Fadeable[], map?: MapDef, mobile = false) {
  // Paris uses the modular Haussmann facade kit (real window depth, balconies, cornices)
  if (map && map.id === 'paris' && b.style === 'haussmann' && !(b.passages?.length)) {
    const res = buildHaussmann(b, map, parent, { stores: [...map.stores, ...(map.decorShops ?? [])], mobile, index: idx });
    registerFade(b, res.meshes, fadeables);
    return;
  }
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
  const rt = roofTexture(b.style).clone(); rt.repeat.set(Math.max(1, w / 5), Math.max(1, d / 5)); rt.needsUpdate = true;
  const slate = new THREE.MeshStandardMaterial({ map: rt, color: 0xa8a49e, roughness: 0.55, metalness: 0.1 });
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
      if (i % 3 === 1) {
        // limestone chimney stack with terracotta pots
        const cxp = x + 1.5, czp = side0(r, idx);
        meshes.push(mesh(box, mat(0x9a8c74, 0.9), g, cxp, b.height + 3.6, czp, 2.4, 2.2, 0.9));
        meshes.push(mesh(box, mat(0xd4c4a4, 0.9), g, cxp, b.height + 4.75, czp, 2.6, 0.15, 1.05));
        for (let k = 0; k < 4; k++) meshes.push(mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.45, 7), mat(0xa5532e, 0.8), g, cxp - 0.9 + k * 0.6, b.height + 5.05, czp));
      }
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
  registerFade(b, meshes, fadeables);
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
  for (const w of v.windows) (w.material as THREE.MeshBasicMaterial).color.setScalar(1.05 * dim * (w === v.windows[2] ? 0.75 : 1)); // >1 so bright shop interiors bloom
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

function beaconsOf(o: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  o.traverse((c) => { if (c.name.startsWith('beacon') && (c as THREE.Mesh).isMesh) { const m = c as THREE.Mesh; m.material = (m.material as THREE.Material).clone(); out.push(m); } });
  return out;
}

export function buildVan(): { g: THREE.Group; lights: THREE.Mesh[] } {
  const g = new THREE.Group();
  mesh(box, mat(0xf2f3f5, 0.35, 0.2), g, 0, 1.25, 0, 2.1, 1.9, VAN.len);
  mesh(box, mat(0x1b3a8a, 0.4), g, 0, 1.0, 0, 2.12, 0.3, VAN.len * 0.98);
  mesh(box, new THREE.MeshStandardMaterial({ color: 0x18222c, roughness: 0.1, metalness: 0.6 }), g, 0, 1.6, VAN.len / 2 - 0.4, 1.9, 0.7, 0.8);
  for (const [x, z] of [[-0.95, 1.8], [0.95, 1.8], [-0.95, -1.8], [0.95, -1.8]]) { const wh = mesh(cyl, mat(0x141414, 0.9), g, x, 0.36, z, 0.36, 0.24, 0.36); wh.rotation.z = Math.PI / 2; }
  const lights: THREE.Mesh[] = [];
  for (const x of [-0.45, 0.45]) { const l = mesh(box, new THREE.MeshBasicMaterial({ color: 0x2a5cff }), g, x, 2.28, VAN.len / 2 - 0.9, 0.7, 0.14, 0.25, false); l.name = 'beacon'; lights.push(l); }
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

/** clipped shrub: a few overlapping rounded clusters with small blossoms */
function bush(parent: THREE.Object3D, x: number, y: number, z: number, r: number, seed: number) {
  const greens = [0x2f4a26, 0x3a5a2c, 0x34522a];
  for (let k = 0; k < 4; k++) {
    const a = k * 2.2 + seed; const rr = k === 0 ? 0 : r * 0.45;
    mesh(new THREE.IcosahedronGeometry(r * (k === 0 ? 0.85 : 0.6), 1), mat(greens[(seed + k) % 3], 0.9), parent, x + Math.cos(a) * rr, y + r * 0.45 + (k === 0 ? 0.1 : 0), z + Math.sin(a) * rr);
  }
  if (seed % 2 === 0) for (let k = 0; k < 5; k++) { const a = k * 1.3 + seed; mesh(new THREE.SphereGeometry(0.05, 5, 4), mat([0xd8c060, 0xe0e0d0, 0xc06050][seed % 3], 0.7), parent, x + Math.cos(a) * r * 0.6, y + r * 0.95, z + Math.sin(a) * r * 0.6, 1, 1, 1, false); }
}

/** occluders (tree crowns, shelter roofs) registered while props are built, turned into fadeables afterwards */
const pendingFades: { meshes: THREE.Mesh[]; root: THREE.Object3D }[] = [];

export function buildProp(p: PropDef, parent: THREE.Group, i: number, cars: WorldHandles['cars'], lamps: THREE.Vector3[]) {
  const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = ((p.rot ?? 0) * Math.PI) / 180; parent.add(g);
  // a loaded GLB in the prop's slot replaces the procedural placeholder
  const slotType = p.type === 'palm' ? null : p.type;
  const finalProp = (slot: string) => (slotStatus(slot) === 'final' ? cloneModel(slot) : null); // placeholders come from this same code
  const glb = slotType && p.type !== 'car' ? finalProp('prop.' + slotType) : null;
  if (glb) { g.add(glb); if (p.type === 'lamp') lamps.push(new THREE.Vector3(p.x, LAMP_LIGHT_Y, p.z)); return; }
  switch (p.type) {
    case 'lamp': {
      buildStreetLamp(g);
      lamps.push(new THREE.Vector3(p.x, LAMP_LIGHT_Y, p.z));
      break;
    }
    case 'shelter': {
      const sh = buildBusShelter(g);
      for (const r of sh.roof) r.userData.noMerge = true;
      pendingFades.push({ meshes: sh.roof, root: sh.group });
      break;
    }
    case 'delivery_van': buildDeliveryVan().children.slice().forEach((c) => g.add(c)); break;
    case 'cafe_table': buildBistroSet(g, 2 + (i % 2), i); break;
    case 'fence': for (const dx of [-1.27, 1.27]) { const b = buildCrowdBarrier(2.5); b.position.x = dx; g.add(b); } break;
    case 'tree': case 'palm': {
      if (p.type === 'palm') {
        const tr = mesh(cyl, mat(0x6a5440, 0.9), g, 0, 2.6, 0, 0.14, 5.2, 0.14); tr.rotation.z = 0.08;
        for (let k = 0; k < 7; k++) { const f = mesh(new THREE.ConeGeometry(0.3, 2.6, 4), mat(0x2f5a2a, 0.8), g, Math.cos(k) * 0.9, 5.0, Math.sin(k) * 0.9); f.rotation.set(Math.sin(k) * 1.2, 0, -Math.cos(k) * 1.2); }
      } else if (p.type === 'tree') {
        // Versailles planter with tapering trunk and a LOD leaf crown that fades when it hides the action
        const t = buildTreePlanter(g, i);
        t.crown.userData.noMerge = true;
        pendingFades.push({ meshes: t.crownMeshes, root: t.crown });
      } else {
        mesh(new THREE.CylinderGeometry(0.09, 0.15, 3.0, 7), mat(0x3e3226, 0.9), g, 0, 1.5, 0);
        // autumn crown built from several leaf clusters (green to ochre, as in the Paris concepts)
        const pal = [0x6f7a2a, 0x9a8a2c, 0xb98a2e, 0x5f6e2a, 0xa27a28];
        for (let k = 0; k < 7; k++) {
          const a = k * 2.4 + i, rr = k === 0 ? 0 : 0.75 + (k % 2) * 0.25;
          const leaf = mat(pal[(i + k) % pal.length], 0.85);
          mesh(new THREE.IcosahedronGeometry(k === 0 ? 1.15 : 0.75 + (k % 3) * 0.12, 1), leaf, g, Math.cos(a) * rr, 3.6 + (k % 3) * 0.45 - (k === 0 ? 0 : 0.3), Math.sin(a) * rr);
        }
        mesh(box, mat(0x5a5048, 0.9), g, 0, 0.2, 0, 1.4, 0.4, 1.4);
      }
      break;
    }
    case 'planter': mesh(box, mat(0x2e3034, 0.6, 0.2), g, 0, 0.35, 0, 1.4, 0.7, 1.4); bush(g, 0, 0.75, 0, 0.62, i); break;
    case 'bench': buildStreetBench(g); break;
    case 'bollard': mesh(cyl, mat(0x202226, 0.6, 0.3), g, 0, 0.45, 0, 0.12, 0.9, 0.12); break;
    case 'umbrella': {
      // large cream café parasol (images 01/02): 8 ribs, scalloped valance, warm light underneath
      mesh(cyl, mat(0x2a2a2a, 0.6), g, 0, 1.25, 0, 0.045, 2.5, 0.045);
      mesh(cyl, mat(0x2a2a2a, 0.6), g, 0, 0.04, 0, 0.35, 0.08, 0.35);
      const canopy = mesh(new THREE.ConeGeometry(2.0, 0.55, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xeee3c8, roughness: 0.85, side: THREE.DoubleSide, emissive: 0x6a4a22, emissiveIntensity: 0.25 }), g, 0, 2.62, 0);
      canopy.rotation.y = Math.PI / 8;
      mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.16, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xe4d6b6, roughness: 0.9, side: THREE.DoubleSide }), g, 0, 2.28, 0).rotation.y = Math.PI / 8;
      mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(2) }), g, 0, 2.2, 0, 1, 1, 1, false);
      break;
    }
    case 'kiosk': mesh(box, mat(0x2f4a3a, 0.6), g, 0, 1.3, 0, 2, 2.6, 2); mesh(box, new THREE.MeshBasicMaterial({ color: 0xffd28a }), g, 0, 1.4, 1.01, 1.4, 0.8, 0.02, false); break;
    case 'phonebox': mesh(box, mat(0x9a1a1a, 0.5), g, 0, 1.25, 0, 0.9, 2.5, 0.9); mesh(box, new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), g, 0, 1.4, 0.46, 0.6, 1.2, 0.02, false); break;
    case 'column': mesh(cyl, mat(0xd9c8a4, 0.8), g, 0, 2.5, 0, p.r ?? 0.35, 5, p.r ?? 0.35); break;
    case 'car': {
      const intact = (finalProp('prop.car') as THREE.Group | null) ?? buildCar([0x5a5f66, 0x2a3a5a, 0x7a2a2a, 0x8a8a88, 0x1a1a1a][i % 5], false);
      const burned = (finalProp('prop.car_burned') as THREE.Group | null) ?? buildCar(0, true); burned.visible = false;
      g.add(intact, burned); cars.set(i, { intact, burned });
      g.rotation.y = p.rot === 90 ? 0 : Math.PI / 2;
      break;
    }
  }
}

/** Moving water for a fountain model: finds the basin and the top bowl in the mesh and adds a rippling surface,
 *  a falling-water sheet from the bowl rim and warm underwater lights (the model itself is static). */
function fountainWaterFor(model: THREE.Object3D, parent: THREE.Group, outerR: number, reducedFx: boolean): Scroll[] {
  model.updateMatrixWorld(true); parent.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert(); const v = new THREE.Vector3();
  const pts: [number, number][] = []; let top = 0;
  model.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const pa = m.geometry.attributes.position;
    for (let i = 0; i < pa.count; i += 2) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); pts.push([Math.hypot(v.x, v.z), v.y]); top = Math.max(top, v.y); } });
  // basin: lowest surface between 45 % and 80 % of the radius; bowl: the widest vertices in the upper half
  const inner = pts.filter(([r]) => r > outerR * 0.45 && r < outerR * 0.8).map(([, y]) => y).sort((a, b) => a - b);
  const waterY = (inner[Math.floor(inner.length * 0.5)] ?? 0.4) + 0.03;
  const upper = pts.filter(([, y]) => y > top * 0.5 && y < top * 0.85);
  const bowlR = upper.reduce((a, [r]) => Math.max(a, r), 0.6); const bowlY = upper.filter(([r]) => r > bowlR * 0.9).reduce((a, [, y]) => Math.max(a, y), top * 0.7);
  const animated: Scroll[] = [];
  const rip = rippleTexture().clone(); rip.repeat.set(3, 3); rip.needsUpdate = true; animated.push({ tex: rip, vx: 0.06, vy: 0.045 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(outerR * 0.78, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rip, color: 0x6f8f8a, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.55, depthWrite: false, emissive: 0x2e4440, emissiveIntensity: 0.5 }));
  water.position.y = waterY; parent.add(water);
  const glow = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,220,150,0.26)', 'rgba(255,200,120,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; const d = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20).rotateX(-Math.PI / 2), glow); d.position.set(Math.cos(a) * outerR * 0.58, waterY + 0.01, Math.sin(a) * outerR * 0.58); parent.add(d); }
  void reducedFx; // the falling sheet is one cheap mesh: shown on phones too, so the water visibly moves everywhere
  if (bowlY > waterY + 0.3) {
    const ft = fallingWaterTexture().clone(); ft.repeat.set(14, 1); ft.needsUpdate = true; animated.push({ tex: ft, vx: 0, vy: 1.4 });
    const h = bowlY - waterY; const sheet = new THREE.Mesh(new THREE.CylinderGeometry(bowlR + 0.04, bowlR + 0.18, h, 40, 1, true), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xf4fbff, opacity: 0.45 }));
    sheet.position.y = waterY + h / 2; parent.add(sheet);
    // splash ring where the sheet meets the basin
    const ring = rippleTexture().clone(); ring.repeat.set(6, 1); ring.needsUpdate = true; animated.push({ tex: ring, vx: 0.25, vy: 0 });
    const splash = new THREE.Mesh(new THREE.RingGeometry(bowlR * 0.9, bowlR + 0.6, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ring, color: 0xe8f6ff, transparent: true, opacity: 0.35, depthWrite: false }));
    splash.position.y = waterY + 0.02; parent.add(splash);
  }
  return animated;
}

export function buildWorld(map: MapDef, scene: THREE.Scene, reducedFx: boolean): WorldHandles {
  const group = new THREE.Group(); scene.add(group);
  const b = map.bounds; const W = b.x1 - b.x0 + 80, D = b.z1 - b.z0 + 80;
  const gt = groundTexture(map.ground).clone(); gt.repeat.set(W / 3.5, D / 3.5); gt.needsUpdate = true;
  const gn = groundNormal(map.ground).clone(); gn.repeat.copy(gt.repeat); gn.needsUpdate = true;
  // puddles: the wet-setts roughness map (tools/make_pbr.py) on top of the fan-pattern setts
  const wet = pbr('setts', W / 9, D / 9).roughnessMap;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: gt, normalMap: gn, normalScale: new THREE.Vector2(0.9, 0.9), roughnessMap: wet, roughness: 0.75, metalness: 0.2, envMapIntensity: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); ground.receiveShadow = true; group.add(ground);
  // kerbs/pavement bands along every building
  for (const bd of map.buildings) {
    const r = bd.rect;
    const pt = groundTexture('stone').clone(); pt.repeat.set((r.x1 - r.x0 + 3.2) / 2.4, (r.z1 - r.z0 + 3.2) / 2.4); pt.needsUpdate = true;
    const pn = groundNormal('stone').clone(); pn.repeat.copy(pt.repeat); pn.needsUpdate = true;
    const pave = new THREE.MeshStandardMaterial({ map: pt, normalMap: pn, normalScale: new THREE.Vector2(0.5, 0.5), color: 0x8a8378, roughness: 0.3, metalness: 0.15, polygonOffset: true, polygonOffsetFactor: -1 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0 + 3.2, r.z1 - r.z0 + 3.2), pave);
    m.rotation.x = -Math.PI / 2; m.position.set((r.x0 + r.x1) / 2, 0.015, (r.z0 + r.z1) / 2); m.receiveShadow = true; group.add(m);
    const kerb = mat(0xb5ab98, 0.6);
    const kx = (r.x0 + r.x1) / 2, kz = (r.z0 + r.z1) / 2, kw = r.x1 - r.x0 + 3.2, kd = r.z1 - r.z0 + 3.2;
    mesh(box, kerb, group, kx, 0.06, kz + kd / 2, kw, 0.12, 0.18, false); mesh(box, kerb, group, kx, 0.06, kz - kd / 2, kw, 0.12, 0.18, false);
    mesh(box, kerb, group, kx + kw / 2, 0.06, kz, 0.18, 0.12, kd, false); mesh(box, kerb, group, kx - kw / 2, 0.06, kz, 0.18, 0.12, kd, false);
  }
  const decorShops: ShopModule[] = (map.decorShops ?? []).map((s, i) => { const sm = new ShopModule(s, 100 + i, { quality: reducedFx ? 'mobile' : 'desktop', seed: 201 + i, withLight: false }); sm.hit.userData.store = -1; group.add(sm.group); return sm; });
  const fadeables: Fadeable[] = [];
  map.buildings.forEach((bd, i) => { if (!(reducedFx && bd.backdrop)) buildBuilding(bd, group, i, fadeables, map, reducedFx); });
  const stores: ShopLike[] = map.stores.map((s, i) => {
    if (map.id === 'paris') { const sm = new ShopModule(s, i, { quality: reducedFx ? 'mobile' : 'desktop', seed: 101 + i, withLight: !reducedFx }); group.add(sm.group); return sm; }
    const v = buildStore(s, i, group, !reducedFx);
    return { hit: v.hit, update: (a: number, b: number, c: number, d: boolean) => updateStoreVisual(v, a, b, c, d) };
  });
  // walls / railings / quays
  for (const w of map.walls) {
    const h = w.h ?? 2.6;
    const cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2, lx = w.x1 - w.x0, lz = w.z1 - w.z0;
    if (h <= 1.2) {
      // iron railing on a stone kerb: top rail, posts and balusters (the collision footprint is unchanged)
      const iron = mat(0x18191c, 0.45, 0.7);
      mesh(box, mat(0x8f8576, 0.85), group, cx, 0.12, cz, lx, 0.24, lz);
      mesh(box, iron, group, cx, h, cz, Math.max(lx, 0.06), 0.06, Math.max(lz, 0.06));
      mesh(box, iron, group, cx, 0.32, cz, Math.max(lx, 0.04), 0.04, Math.max(lz, 0.04));
      const along = lx > lz; const len = along ? lx : lz; const n = Math.max(1, Math.round(len / 0.25));
      for (let k = 0; k <= n; k++) {
        const t = -len / 2 + (k * len) / n; const post = k % 8 === 0;
        mesh(box, iron, group, along ? cx + t : cx, (h + 0.24) / 2, along ? cz : cz + t, post ? 0.07 : 0.025, h - 0.24, post ? 0.07 : 0.025, post);
      }
    } else mesh(box, mat(0xb8ab92, 0.85), group, cx, h / 2, cz, lx, h, lz);
  }
  // water with quay walls and bridges
  const water: THREE.Mesh[] = [];
  for (const wr of map.water) {
    const wt = waterTexture().clone(); wt.repeat.set((wr.x1 - wr.x0) / 8, (wr.z1 - wr.z0) / 8); wt.needsUpdate = true;
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(wr.x1 - wr.x0, wr.z1 - wr.z0), new THREE.MeshStandardMaterial({ map: wt, emissiveMap: wt, color: 0x4a6470, roughness: 0.1, metalness: 0.3, emissive: 0x5a4a38, emissiveIntensity: 0.55, envMapIntensity: 1.2 }));
    wm.rotation.x = -Math.PI / 2; wm.position.set((wr.x0 + wr.x1) / 2, -0.9, (wr.z0 + wr.z1) / 2); group.add(wm); water.push(wm);
    // dark pit walls so the canal reads as a cut below street level
    const quay = mat(0x6a5a48, 0.9);
    mesh(box, quay, group, (wr.x0 + wr.x1) / 2, 0.08, wr.z0 + 0.15, wr.x1 - wr.x0, 0.16, 0.3, false);
    mesh(box, quay, group, (wr.x0 + wr.x1) / 2, 0.08, wr.z1 - 0.15, wr.x1 - wr.x0, 0.16, 0.3, false);
    // water surface drawn just above street level (the quay edge and railings mark the drop)
    wm.position.y = 0.008; // below the wet-street reflection layer
  }
  for (const br of map.bridges) {
    const bt = groundTexture('brick').clone(); bt.repeat.set((br.x1 - br.x0) / 3, (br.z1 - br.z0) / 3); bt.needsUpdate = true;
    const deck = mesh(box, new THREE.MeshStandardMaterial({ map: bt, color: 0xb09a88, roughness: 0.35, metalness: 0.1 }), group, (br.x0 + br.x1) / 2, 0.06, (br.z0 + br.z1) / 2, br.x1 - br.x0, 0.12, br.z1 - br.z0);
    void deck;
    const along = br.z1 - br.z0 > br.x1 - br.x0;
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, true, 0, Math.PI), mat(0x7a3e2c, 0.9));
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
  const animated: Scroll[] = [];
  if (map.fountain) {
    const f = map.fountain;
    const glbFountain = slotStatus('prop.fountain') === 'final' ? cloneModel('prop.fountain') : null;
    let fh: { group: THREE.Group; animated: Scroll[]; spray: THREE.Points | null };
    if (glbFountain) {
      // a final model (e.g. image-to-3D from concept 03): scaled to the basin inside the planter ring, standing on the ground
      const fg = new THREE.Group(); fg.position.set(f.x, 0, f.z); group.add(fg);
      const bb = new THREE.Box3().setFromObject(glbFountain); const size = bb.getSize(new THREE.Vector3());
      const k = (2 * (f.r - 0.9)) / Math.max(size.x, size.z, 1e-3); glbFountain.scale.setScalar(k);
      const c = bb.getCenter(new THREE.Vector3()); glbFountain.position.set(-c.x * k, -bb.min.y * k, -c.z * k);
      // image-to-3D models carry the concept's own night lighting in their colour texture and often no normals:
      // smooth the normals once and let the texture glow a little so it reads like the painting under our lights
      glbFountain.traverse((o) => {
        const m = o as THREE.Mesh; if (!m.isMesh) return;
        if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
        const src = m.material as THREE.MeshStandardMaterial; if (!src.isMeshStandardMaterial) return;
        const mm = src.clone(); mm.flatShading = false; mm.roughness = 0.7; mm.metalness = 0;
        if (mm.map) { mm.emissive = new THREE.Color(0xffffff); mm.emissiveMap = mm.map; mm.emissiveIntensity = 0.6; }
        mm.needsUpdate = true; m.material = mm;
      });
      fg.add(glbFountain); fh = { group: fg, animated: fountainWaterFor(glbFountain, fg, f.r - 0.9, reducedFx), spray: null };
    } else fh = buildOctagonFountain(f, group, reducedFx, map.id === 'paris' ? 'round' : 'octagon');
    animated.push(...fh.animated); fountainWater = fh.spray;
    // ring of planters with benches between them, all inside the fountain's collision circle
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      mesh(box, mat(0x2e3034, 0.6, 0.2), fh.group, Math.cos(a) * (f.r - 0.35), 0.35, Math.sin(a) * (f.r - 0.35), 1.0, 0.7, 1.0).rotation.y = -a;
      bush(fh.group, Math.cos(a) * (f.r - 0.35), 0.7, Math.sin(a) * (f.r - 0.35), 0.5, k);
      const ab = a + Math.PI / 8; const bg = new THREE.Group(); bg.position.set(Math.cos(ab) * (f.r - 0.32), 0, Math.sin(ab) * (f.r - 0.32)); bg.rotation.y = -ab - Math.PI / 2; fh.group.add(bg);
      buildBench(bg, 1.5);
    }
    mergeStatic(fh.group);
  }
  const cars: WorldHandles['cars'] = new Map();
  const lampPos: THREE.Vector3[] = [];
  // static props are merged per material after building (cars stay separate: they can catch fire)
  const propGroup = new THREE.Group(); group.add(propGroup);
  pendingFades.length = 0;
  map.props.forEach((p, i) => buildProp(p, p.type === 'car' ? group : propGroup, i, cars, lampPos));
  mergeStatic(propGroup);
  group.updateMatrixWorld(true);
  for (const pf of pendingFades) {
    for (const m of pf.meshes) { m.material = (m.material as THREE.Material).clone(); (m.material as THREE.Material).transparent = true; }
    fadeables.push({ meshes: pf.meshes, box: new THREE.Box3().setFromObject(pf.root), opacity: 1 });
  }
  // warm light pools on the wet ground (cheap reflection substitute) + a few real lights
  const pool = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,190,110,0.42)', 'rgba(255,170,90,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const lampLights: THREE.PointLight[] = [];
  // light pools and wet-street streaks are each merged into one mesh (one draw call each, whatever the lamp count)
  const flat = (w: number, d: number, x: number, y: number, z: number, rotY = 0) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).rotateY(rotY).translate(x, y, z);
  const pools: THREE.BufferGeometry[] = []; const streaks: THREE.BufferGeometry[] = [];
  lampPos.forEach((lp, i) => {
    pools.push(flat(8, 8, lp.x, 0.03, lp.z));
    if (!reducedFx && i < 6) { const l = new THREE.PointLight(0xffc27a, 22, 13, 1.6); l.position.copy(lp); group.add(l); lampLights.push(l); }
  });
  for (const s of map.stores) pools.push(flat(s.width + 2, 5, s.front.x + s.normal.x * 2.4, 0.032, s.front.z + s.normal.z * 2.4, Math.atan2(s.normal.x, s.normal.z)));
  // long reflections of lamps and shop windows on the wet setts, smeared towards the camera (which never turns)
  const streak = new THREE.MeshBasicMaterial({ map: streakTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: reducedFx ? 0.55 : 0.4 });
  const addStreak = (x: number, z: number, w: number, len: number) => streaks.push(flat(w, len, x, 0.035, z + len / 2 - 0.3));
  for (const lp of lampPos) addStreak(lp.x, lp.z, 0.9, 6.5);
  for (const s of map.stores) if (s.normal.z > 0.5) for (const dx of [-2.3, 2.3]) addStreak(s.front.x + dx, s.front.z + 2.2, 1.6, 7);
  if (pools.length) group.add(new THREE.Mesh(mergeGeometries(pools)!, pool));
  if (streaks.length) { const sm = new THREE.Mesh(mergeGeometries(streaks)!, streak); sm.renderOrder = 2; group.add(sm); }
  // support van (staging point)
  const vanGlb = cloneModel('prop.van') as THREE.Group | null;
  const { g: van, lights: vanLights } = vanGlb && slotStatus('prop.van') === 'final' ? { g: vanGlb, lights: beaconsOf(vanGlb) } : buildVan();
  van.position.set(map.van.x, 0, map.van.z); van.rotation.y = (map.van.rot * Math.PI) / 180; group.add(van);
  // extinguishers at the staging van (decorative, firefighters carry the hose)
  for (const dx of [-0.25, 0.25]) { const e = buildExtinguisher(); e.position.set(1.35, 0, dx + 1.6); van.add(e); }
  // loading lane markings
  if (map.loadingLane) {
    const r = map.loadingLane;
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), new THREE.MeshBasicMaterial({ color: 0xe0b020, transparent: true, opacity: 0.18, depthWrite: false }));
    lm.rotation.x = -Math.PI / 2; lm.position.set((r.x0 + r.x1) / 2, 0.04, (r.z0 + r.z1) / 2); group.add(lm);
  }
  buildStreetDetails(map, group);
  return { group, ground, stores, fadeables, cars, van, vanLights, water, fountainWater, lampLights, animated, decorShops };
}

export function skyTexture(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#060c1e'); grd.addColorStop(0.5, '#15254a'); grd.addColorStop(0.85, '#3b4d7c'); grd.addColorStop(1, '#6a5a6a');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---- placeholder builders shared by the game (fallback) and the GLB export tool
export function buildBarrierModel(size: 'small' | 'large'): THREE.Group {
    const g = new THREE.Group();
    if (size === 'small') {
      const metal = mat(0xb9bec4, 0.35, 0.8);
      const bar = new THREE.BoxGeometry(1, 1, 1);
      const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => { const m = new THREE.Mesh(bar, metal); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); };
      add(0, 1.05, 0, 2.5, 0.05, 0.05); add(0, 0.25, 0, 2.5, 0.05, 0.05);
      for (let i = 0; i <= 12; i++) add(-1.25 + i * (2.5 / 12), 0.65, 0, 0.025, 0.8, 0.025);
      add(-1.25, 0.55, 0, 0.05, 1.1, 0.05); add(1.25, 0.55, 0, 0.05, 1.1, 0.05);
      add(-1.15, 0.02, 0, 0.05, 0.04, 0.7); add(1.15, 0.02, 0, 0.05, 0.04, 0.7);
    } else {
      const conc = mat(0xa8a49c, 0.9);
      const shape = new THREE.Shape(); shape.moveTo(-0.4, 0); shape.lineTo(0.4, 0); shape.lineTo(0.15, 0.3); shape.lineTo(0.1, 0.85); shape.lineTo(-0.1, 0.85); shape.lineTo(-0.15, 0.3); shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.45, bevelEnabled: false }).translate(0, 0, -0.725).rotateY(Math.PI / 2);
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(geo, conc); m.position.x = -1.5 + i * 1.5; m.castShadow = true; m.receiveShadow = true; g.add(m); }
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.32), mat(0xe0b020, 0.6)); stripe.position.set(2.15, 0.45, 0); g.add(stripe);
    }
    return g;
  }

export function buildMastModel(): THREE.Group {
  return buildCameraMast();
}
