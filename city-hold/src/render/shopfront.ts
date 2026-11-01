import * as THREE from 'three';
import type { StoreDef } from '../maps/types';
import { crackTexture, shutterTexture } from './textures';
import { mergeStatic } from './merge';

// Shopfront with real depth: framed glazing, recessed door, fascia with a fictional name, and a lit interior
// (floor, back wall, ceiling, fixtures and products). Products disappear as stock is carried away.
// Damage stages: 0 intact, 1 cracked glass, 2 shattered panes, 3 breached (glass gone, bent shutter, boxes and
// shards on the pavement).

const BOX = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);
const OPEN_H = 3.3;
const DEPTH = 3.2;

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, transparent = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  if (!transparent) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
  draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function signTex(name: string, color: number): THREE.Texture {
  return tex(1024, 128, (g) => {
    g.fillStyle = '#' + color.toString(16).padStart(6, '0'); g.fillRect(0, 0, 1024, 128);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 0, 1024, 14);
    g.strokeStyle = '#c9a75a'; g.lineWidth = 4; g.strokeRect(14, 14, 996, 100);
    g.fillStyle = '#e9cf8a'; g.font = '600 64px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 6; g.fillText(name.toUpperCase(), 512, 68);
  });
}

function wallTex(kind: StoreDef['kind']): THREE.Texture {
  return tex(256, 128, (g) => {
    const base = kind === 'jewellery' ? '#5a2430' : kind === 'electronics' || kind === 'phones' ? '#e8ecf0' : '#d9c7a8';
    g.fillStyle = base; g.fillRect(0, 0, 256, 128);
    if (kind === 'jewellery') { g.strokeStyle = 'rgba(220,180,110,0.6)'; g.lineWidth = 2; for (let x = 8; x < 256; x += 42) g.strokeRect(x, 10, 34, 108); }
    else if (kind === 'electronics' || kind === 'phones') { g.fillStyle = 'rgba(30,60,110,0.25)'; g.fillRect(0, 96, 256, 32); }
    else { g.fillStyle = 'rgba(120,90,60,0.25)'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 2, 128); }
  });
}

function floorTex(kind: StoreDef['kind']): THREE.Texture {
  const t = tex(128, 128, (g) => {
    if (kind === 'jewellery') { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#e8e2d8' : '#2a2626'; g.fillRect(x * 32, y * 32, 32, 32); } }
    else if (kind === 'fashion') { for (let y = 0; y < 128; y += 16) { g.fillStyle = y % 32 ? '#8a6040' : '#7a5236'; g.fillRect(0, y, 128, 15); } }
    else { g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 128; k += 64) { g.fillRect(k, 0, 2, 128); g.fillRect(0, k, 128, 2); } }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function screenTex(): THREE.Texture {
  return tex(128, 80, (g) => {
    const grd = g.createLinearGradient(0, 0, 128, 80); grd.addColorStop(0, '#1d6fd1'); grd.addColorStop(0.5, '#62c5ff'); grd.addColorStop(1, '#7b3fd6');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 80); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(90, 30, 18, 0, Math.PI * 2); g.fill();
  });
}

export class ShopVisual {
  group = new THREE.Group();
  hit: THREE.Mesh;
  light: THREE.PointLight | null = null;
  private panes: THREE.Mesh[] = [];
  private cracks: THREE.Mesh[] = [];
  private products: THREE.InstancedMesh[] = [];
  private productTotals: number[] = [];
  private shutter: THREE.Mesh;
  private bent: THREE.Group;
  private debris: THREE.Group;
  private stage = -1; private fill = -1; private level = -1;

  constructor(readonly def: StoreDef, readonly idx: number, mobile: boolean) {
    const s = def; const g = this.group; const w = s.width;
    g.position.set(s.front.x, 0, s.front.z); g.rotation.y = Math.atan2(s.normal.x, s.normal.z);
    const paint = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.45, metalness: 0.05 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc9a75a, roughness: 0.3, metalness: 0.9 });
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, parent: THREE.Object3D = g, shadow = false) => {
      const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
    };
    // ---- painted timber front: pilasters, fascia, cornice, stall risers
    for (const sx of [-1, 1]) {
      add(BOX, paint, sx * (w / 2 + 0.16), 2.05, 0.06, 0.32, 4.1, 0.24, g, true);
      add(BOX, gold, sx * (w / 2 + 0.16), 3.2, 0.19, 0.2, 0.06, 0.02);
    }
    add(BOX, paint, 0, 3.78, 0.08, w + 0.64, 0.82, 0.26, g, true);
    add(BOX, paint, 0, 4.24, 0.12, w + 0.84, 0.1, 0.4, g, true);
    const sign = add(PLANE, new THREE.MeshStandardMaterial({ map: signTex(s.brand ?? s.name, s.color), roughness: 0.4, emissive: 0xffffff, emissiveMap: signTex(s.brand ?? s.name, s.color), emissiveIntensity: 0.35 }), 0, 3.78, 0.215, w + 0.4, 0.7, 1);
    void sign;
    // gooseneck sign lamps
    const lampGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c8).multiplyScalar(4) });
    for (let k = -1; k <= 1; k++) {
      add(BOX, gold, k * w * 0.32, 4.35, 0.35, 0.04, 0.04, 0.5);
      add(new THREE.ConeGeometry(0.09, 0.14, 8), gold, k * w * 0.32, 4.3, 0.6, 1, 1, 1);
      add(new THREE.CircleGeometry(0.07, 8).rotateX(Math.PI / 2), lampGlow, k * w * 0.32, 4.225, 0.6, 1, 1, 1);
    }
    const paneW = w / 2 - 0.75;
    for (const sx of [-1, 1]) add(BOX, paint, sx * (0.75 + paneW / 2), 0.25, 0.0, paneW, 0.5, 0.18);

    // ---- interior box (behind the glass line)
    const warm = new THREE.Color(0xffd9a8);
    const wallM = new THREE.MeshStandardMaterial({ map: wallTex(s.kind), roughness: 0.7, emissive: warm, emissiveIntensity: mobile ? 0.35 : 0.12, emissiveMap: wallTex(s.kind) });
    const ft = floorTex(s.kind); ft.repeat.set(w / 1.5, DEPTH / 1.5);
    const floorM = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.25, metalness: 0.1, emissive: warm, emissiveIntensity: mobile ? 0.15 : 0.04, emissiveMap: ft });
    const ceilM = new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.9, emissive: warm, emissiveIntensity: 0.2 });
    const interior = new THREE.Group(); g.add(interior);
    add(PLANE, floorM, 0, 0.012, -DEPTH / 2, w, DEPTH, 1, interior).rotation.x = -Math.PI / 2;
    add(PLANE, wallM, 0, OPEN_H / 2 + 0.1, -DEPTH, w, OPEN_H + 0.3, 1, interior);
    const sideL = add(PLANE, wallM, -w / 2, OPEN_H / 2 + 0.1, -DEPTH / 2, DEPTH, OPEN_H + 0.3, 1, interior); sideL.rotation.y = Math.PI / 2;
    const sideR = add(PLANE, wallM, w / 2, OPEN_H / 2 + 0.1, -DEPTH / 2, DEPTH, OPEN_H + 0.3, 1, interior); sideR.rotation.y = -Math.PI / 2;
    add(PLANE, ceilM, 0, OPEN_H + 0.2, -DEPTH / 2, w, DEPTH, 1, interior).rotation.x = Math.PI / 2;
    const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff3dc).multiplyScalar(2.2) });
    for (let k = 0; k < 3; k++) add(PLANE, panel, (k - 1) * w * 0.3, OPEN_H + 0.18, -DEPTH * 0.5, w * 0.18, 0.5, 1, interior).rotation.x = Math.PI / 2;
    this.buildFixtures(interior, w, add);
    mergeStatic(interior); // products are instanced and stay separate so stock can hide them

    // ---- glazing: two display windows, transom and a recessed glazed door, with mullions
    const frameM = new THREE.MeshStandardMaterial({ color: new THREE.Color(s.color).multiplyScalar(0.7), roughness: 0.4 });
    const glassM = new THREE.MeshStandardMaterial({ color: 0xcfe2f0, roughness: 0.03, metalness: 0.3, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.6 });
    for (const sx of [-1, 1]) {
      const cx = sx * (0.75 + paneW / 2);
      this.panes.push(add(PLANE, glassM, cx, 0.5 + (OPEN_H - 0.5) / 2, 0.0, paneW, OPEN_H - 0.5, 1));
      const ck = add(PLANE, new THREE.MeshBasicMaterial({ map: crackTexture(1), transparent: true, depthWrite: false }), cx, 0.5 + (OPEN_H - 0.5) / 2, 0.01, paneW, OPEN_H - 0.5, 1);
      ck.visible = false; this.cracks.push(ck);
      for (const fx of [-paneW / 2, 0, paneW / 2]) add(BOX, frameM, cx + fx, 0.5 + (OPEN_H - 0.5) / 2, 0.02, 0.06, OPEN_H - 0.5, 0.08);
      add(BOX, frameM, cx, OPEN_H + 0.02, 0.02, paneW, 0.08, 0.08);
      add(BOX, frameM, cx, 2.55, 0.02, paneW, 0.05, 0.06);
    }
    // recessed entrance: door reveal, glazed door and transom
    for (const sx of [-1, 1]) add(BOX, paint, sx * 0.72, OPEN_H / 2, -0.3, 0.06, OPEN_H, 0.6);
    add(BOX, frameM, 0, 1.3, -0.58, 1.38, 2.6, 0.06);
    this.panes.push(add(PLANE, glassM, 0, 1.3, -0.54, 1.1, 2.3, 1));
    const dc = add(PLANE, new THREE.MeshBasicMaterial({ map: crackTexture(2), transparent: true, depthWrite: false }), 0, 1.3, -0.53, 1.1, 2.3, 1); dc.visible = false; this.cracks.push(dc);
    add(BOX, gold, 0.4, 1.15, -0.5, 0.04, 0.4, 0.04);
    this.panes.push(add(PLANE, glassM, 0, 2.95, -0.58, 1.38, 0.6, 1));

    // ---- roller shutter: housing + curtain; reinforced levels lower it; breached shows a bent shutter
    add(BOX, new THREE.MeshStandardMaterial({ color: 0x55595f, roughness: 0.4, metalness: 0.7 }), 0, OPEN_H + 0.15, 0.2, w, 0.3, 0.28, g, true);
    const st = shutterTexture().clone(); st.repeat.set(w / 2, 1); st.needsUpdate = true;
    this.shutter = add(PLANE, new THREE.MeshStandardMaterial({ map: st, roughness: 0.35, metalness: 0.75, color: 0xc8d2dc }), 0, OPEN_H, 0.16, w - 0.1, 1, 1);
    this.bent = new THREE.Group(); g.add(this.bent); this.bent.visible = false;
    const slatM = new THREE.MeshStandardMaterial({ map: st, roughness: 0.35, metalness: 0.75, color: 0xb8c2cc, side: THREE.DoubleSide });
    for (let k = 0; k < 7; k++) {
      const sl = add(BOX, slatM, -w * 0.15 + Math.sin(k) * 0.3, OPEN_H - 0.25 - k * 0.24, 0.22 + k * 0.06, w * (0.95 - k * 0.04), 0.22, 0.03, this.bent, true);
      sl.rotation.set(-0.15 - k * 0.12, 0, 0.08 * Math.sin(k * 1.7));
    }

    // ---- debris on the pavement (shown when damaged)
    this.debris = new THREE.Group(); g.add(this.debris); this.debris.visible = false;
    const shardM = new THREE.MeshStandardMaterial({ color: 0xd8ecff, roughness: 0.02, metalness: 0.5, transparent: true, opacity: 0.75 });
    const shards = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shardM, 60);
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler();
    for (let k = 0; k < 60; k++) {
      const a = (k * 2.39) % (Math.PI * 2); const r = 0.2 + ((k * 37) % 29) / 12;
      e.set((Math.sin(k) * 0.2), a * 3, Math.cos(k * 1.3) * 0.2); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(Math.cos(a) * r * (w / 4), 0.02, 0.3 + Math.abs(Math.sin(a)) * r * 0.9), q, new THREE.Vector3(0.06 + (k % 5) * 0.03, 1, 0.04 + (k % 3) * 0.03));
      shards.setMatrixAt(k, m4);
    }
    this.debris.add(shards);
    const cardboard = new THREE.MeshStandardMaterial({ color: 0xa77d4e, roughness: 0.95 });
    for (let k = 0; k < 7; k++) {
      const bx = add(BOX, cardboard, (k - 3) * w * 0.12 + Math.sin(k * 3) * 0.4, 0.15, 0.7 + (k % 3) * 0.55, 0.42, 0.3, 0.34, this.debris, true);
      bx.rotation.set(k % 2 ? 0 : 0.25, k * 0.9, k % 3 === 0 ? Math.PI / 2 : 0);
    }

    if (!mobile) { this.light = new THREE.PointLight(0xffc98a, 22, 10, 1.7); this.light.position.set(0, 2.8, -1.2); g.add(this.light); }
    // picking volume that matches the visible shopfront
    this.hit = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.set(0, 2, 0.6); this.hit.scale.set(w + 0.6, 4.4, 1.6); this.hit.userData.store = this.idx; g.add(this.hit);
  }

  /** fixtures and products per shop type; products are instanced so stock can hide them */
  private buildFixtures(parent: THREE.Group, w: number, add: (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, p?: THREE.Object3D, sh?: boolean) => THREE.Mesh) {
    const k = this.def.kind;
    const wood = new THREE.MeshStandardMaterial({ color: k === 'jewellery' ? 0x3a1a1e : 0x6a4a32, roughness: 0.5 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf1f1ef, roughness: 0.4 });
    const vitrine = new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false });
    const prod = (geo: THREE.BufferGeometry, mat: THREE.Material, pts: [number, number, number, number?][], colors?: number[]) => {
      const im = new THREE.InstancedMesh(geo, mat, pts.length);
      const m4 = new THREE.Matrix4();
      pts.forEach(([x, y, z, ry], i) => { m4.makeRotationY(ry ?? 0); m4.setPosition(x, y, z); im.setMatrixAt(i, m4); if (colors) im.setColorAt(i, new THREE.Color(colors[i % colors.length])); });
      im.castShadow = false; parent.add(im); this.products.push(im); this.productTotals.push(pts.length);
    };
    // back-wall shelving common to all shops
    for (const y of [1.2, 1.9, 2.6]) add(BOX, k === 'electronics' || k === 'phones' ? white : wood, 0, y, -DEPTH + 0.18, w - 0.4, 0.05, 0.34, parent);
    if (k === 'jewellery') {
      for (const [x, z] of [[-w * 0.28, -1.0], [w * 0.28, -1.0], [0, -2.1]]) {
        add(BOX, wood, x, 0.45, z, 1.4, 0.9, 0.6, parent, true);
        add(BOX, vitrine, x, 1.08, z, 1.4, 0.36, 0.6, parent);
      }
      const pts: [number, number, number][] = [];
      for (const [x, z] of [[-w * 0.28, -1.0], [w * 0.28, -1.0], [0, -2.1]]) for (let i = 0; i < 8; i++) pts.push([x - 0.55 + (i % 4) * 0.36, 0.95, z - 0.12 + Math.floor(i / 4) * 0.24]);
      for (const y of [1.28, 1.98, 2.68]) for (let i = 0; i < 8; i++) pts.push([-w / 2 + 0.6 + i * (w - 1.2) / 7, y, -DEPTH + 0.2]);
      prod(new THREE.TorusGeometry(0.045, 0.014, 6, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 0.15, metalness: 1, emissive: 0x6a4a10, emissiveIntensity: 0.6 }), pts);
      prod(new THREE.BoxGeometry(0.12, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0x2a0d14, roughness: 0.5 }), pts.slice(0, 24).map(([x, y, z]) => [x + 0.1, y, z] as [number, number, number]));
    } else if (k === 'electronics' || k === 'phones') {
      const scr = new THREE.MeshBasicMaterial({ map: screenTex(), color: new THREE.Color(1.4, 1.4, 1.4) });
      // wall of screens
      const tvs: [number, number, number][] = [];
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) tvs.push([-w / 2 + 0.9 + i * (w - 1.8) / 3, 1.55 + r * 0.7, -DEPTH + 0.05]);
      prod(new THREE.PlaneGeometry(1.0, 0.58), scr, tvs);
      for (const x of [-w * 0.27, w * 0.27]) add(BOX, white, x, 0.45, -1.3, 1.6, 0.9, 0.8, parent, true);
      const laptops: [number, number, number, number][] = [];
      for (const x of [-w * 0.27, w * 0.27]) for (let i = 0; i < 3; i++) laptops.push([x - 0.5 + i * 0.5, 1.02, -1.25, 0]);
      prod(new THREE.BoxGeometry(0.34, 0.24, 0.015).translate(0, 0.12, 0).rotateX(-0.25), scr, laptops);
      const boxes: [number, number, number][] = [];
      for (const y of [1.33, 2.03, 2.73]) for (let i = 0; i < 6; i++) boxes.push([-w / 2 + 0.5 + i * (w - 1) / 5, y, -DEPTH + 0.22]);
      prod(new THREE.BoxGeometry(0.3, 0.2, 0.2), white, boxes);
    } else {
      // clothing rails with garments and two window mannequins
      for (const x of [-w * 0.25, w * 0.25]) {
        add(BOX, new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.8, roughness: 0.3 }), x, 1.6, -1.6, 1.5, 0.03, 0.03, parent);
        for (const sx of [-0.75, 0.75]) add(BOX, new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.8 }), x + sx, 0.8, -1.6, 0.03, 1.6, 0.03, parent);
      }
      const garments: [number, number, number, number][] = [];
      for (const x of [-w * 0.25, w * 0.25]) for (let i = 0; i < 9; i++) garments.push([x - 0.64 + i * 0.16, 1.2, -1.6, Math.PI / 2]);
      for (let i = 0; i < 10; i++) garments.push([-w / 2 + 0.5 + i * (w - 1) / 9, 2.2, -DEPTH + 0.25, 0]);
      prod(new THREE.BoxGeometry(0.42, 0.8, 0.05), new THREE.MeshStandardMaterial({ roughness: 0.85 }), garments, [0x1f2a44, 0x7a2f2f, 0x2f5a3a, 0xc8b48a, 0x222226, 0xd9d4ca, 0x6a3a5a]);
      const skinM = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.5 });
      for (const x of [-w * 0.33, w * 0.33]) {
        add(new THREE.CapsuleGeometry(0.17, 0.6, 4, 10), new THREE.MeshStandardMaterial({ color: x < 0 ? 0x7a2f2f : 0x2a2a38, roughness: 0.8 }), x, 1.15, -0.5, 1, 1, 0.7, parent, true);
        add(new THREE.SphereGeometry(0.11, 12, 8), skinM, x, 1.75, -0.5, 1, 1, 1, parent);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), skinM, x, 0.4, -0.5, 1, 1, 1, parent);
        add(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12), skinM, x, 0.04, -0.5, 1, 1, 1, parent);
      }
    }
  }

  update(structureRatio: number, stockRatio: number, level: number, breached: boolean) {
    const stage = breached ? 3 : structureRatio < 0.35 ? 2 : structureRatio < 0.7 ? 1 : 0;
    if (stage !== this.stage) {
      this.stage = stage;
      this.cracks.forEach((c, i) => { c.visible = (stage === 1 && i < 2) || stage === 2; (c.material as THREE.MeshBasicMaterial).map = crackTexture(stage >= 2 ? 2 : 1); });
      this.panes.forEach((p) => (p.visible = stage < 3));
      if (stage >= 3) this.cracks.forEach((c) => (c.visible = false));
      this.debris.visible = stage >= 2;
      this.debris.children.forEach((d, i) => (d.visible = stage >= 3 || i === 0));
      if (this.light) this.light.intensity = stage >= 3 ? 9 : 22;
    }
    if (level !== this.level || stage === 3) {
      this.level = level;
      this.shutter.visible = stage < 3; this.bent.visible = stage >= 3;
      const hgt = level >= 3 ? 2.2 : level >= 2 ? 1.3 : 0.18;
      this.shutter.scale.y = hgt; this.shutter.position.y = OPEN_H - hgt / 2;
      (this.shutter.material as THREE.MeshStandardMaterial).color.setHex(level >= 2 ? 0xa8c8e4 : 0xc8d2dc);
    }
    const fill = Math.round(stockRatio * 20);
    if (fill !== this.fill) {
      this.fill = fill;
      this.products.forEach((p, i) => (p.count = Math.round(this.productTotals[i] * stockRatio)));
    }
  }
}
