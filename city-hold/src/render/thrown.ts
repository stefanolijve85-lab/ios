import * as THREE from 'three';

// Fictional thrown incendiary as a game object: exterior only (bottle, cloth, flame at the tip). It has no inner
// construction. Shared geometry/material; instances come from a small pool. Pivot at the bottle's centre.

let shared: { bottle: THREE.BufferGeometry; liquid: THREE.BufferGeometry; rag: THREE.BufferGeometry; glass: THREE.Material; fill: THREE.Material; cloth: THREE.Material } | null = null;
function res() {
  if (shared) return shared;
  const prof = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 14);
  const bottle = prof([[0, -0.13], [0.04, -0.13], [0.043, -0.11], [0.043, 0.03], [0.035, 0.07], [0.015, 0.1], [0.014, 0.15], [0.017, 0.16], [0, 0.16]]);
  const liquid = prof([[0, -0.125], [0.039, -0.125], [0.039, 0.0], [0, 0.0]]);
  // cloth: a few crumpled strips hanging from the neck
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) { const g = new THREE.BoxGeometry(0.03, 0.08 + i * 0.012, 0.008); g.rotateZ((i - 1.5) * 0.35); g.rotateY(i * 1.4); g.translate((i - 1.5) * 0.008, 0.19 + i * 0.006, 0); parts.push(g); }
  const rag = mergeAll(parts);
  shared = {
    bottle, liquid, rag,
    glass: new THREE.MeshStandardMaterial({ color: 0x4a6a3a, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }),
    fill: new THREE.MeshStandardMaterial({ color: 0x8a6a2a, roughness: 0.3, transparent: true, opacity: 0.6 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xcfc2a8, roughness: 0.95 }),
  };
  return shared;
}
function mergeAll(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry(); const pos: number[] = []; const nor: number[] = [];
  for (const g of gs) { const ng = g.index ? g.toNonIndexed() : g; pos.push(...(ng.attributes.position.array as Float32Array)); nor.push(...(ng.attributes.normal.array as Float32Array)); }
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

/** one thrown object; node "wick" marks where the small flame sits */
export function buildIncendiary(): THREE.Group {
  const r = res(); const g = new THREE.Group(); g.name = 'incendiary';
  const liquid = new THREE.Mesh(r.liquid, r.fill); g.add(liquid);
  const b = new THREE.Mesh(r.bottle, r.glass); b.renderOrder = 3; g.add(b);
  const rag = new THREE.Mesh(r.rag, r.cloth); rag.castShadow = true; g.add(rag);
  const wick = new THREE.Object3D(); wick.name = 'wick'; wick.position.set(0, 0.27, 0); g.add(wick);
  return g;
}

/** fixed-size pool of visuals for projectiles in flight (no per-throw allocation) */
export class IncendiaryPool {
  private free: THREE.Group[] = [];
  private used = new Map<number, THREE.Group>();
  constructor(private parent: THREE.Object3D, size: number) {
    for (let i = 0; i < size; i++) { const o = buildIncendiary(); o.visible = false; parent.add(o); this.free.push(o); }
  }
  get(id: number): THREE.Group | null {
    let o = this.used.get(id);
    if (!o) { o = this.free.pop(); if (!o) return null; o.visible = true; this.used.set(id, o); }
    return o;
  }
  /** return every visual whose projectile no longer exists */
  sweep(alive: Set<number>) { for (const [id, o] of this.used) if (!alive.has(id)) { o.visible = false; this.used.delete(id); this.free.push(o); } }
  get active() { return this.used.size; }
}
