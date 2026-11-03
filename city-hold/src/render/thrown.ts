import * as THREE from 'three';

// Fictional thrown incendiary as a game object: exterior only (bottle, cloth, flame at the tip). It has no inner
// construction. Shared geometry/material; instances come from a small pool. Pivot at the bottle's centre.

let shared: { bottle: THREE.BufferGeometry; liquid: THREE.BufferGeometry; rag: THREE.BufferGeometry; metal: THREE.BufferGeometry; glass: THREE.Material; fill: THREE.Material; cloth: THREE.Material; iron: THREE.Material } | null = null;
function res() {
  if (shared) return shared;
  const prof = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 16);
  // reference: a round-shouldered clear glass bottle with a thick lip, two-thirds full of dark brown liquid
  const bottle = prof([[0, -0.13], [0.036, -0.13], [0.042, -0.122], [0.043, 0.02], [0.04, 0.045], [0.026, 0.075], [0.018, 0.09], [0.017, 0.135], [0.021, 0.14], [0.021, 0.158], [0.015, 0.162], [0, 0.162]]);
  const liquid = prof([[0, -0.124], [0.0395, -0.124], [0.0395, 0.004], [0, 0.004]]);
  // metal cage: a ring at the neck, a ring round the middle with two clips and two wire straps between them
  const metal: THREE.BufferGeometry[] = [];
  metal.push(new THREE.CylinderGeometry(0.025, 0.025, 0.018, 14, 1, true).translate(0, 0.088, 0));
  metal.push(new THREE.CylinderGeometry(0.046, 0.046, 0.012, 18, 1, true).translate(0, -0.02, 0));
  for (const sx of [-1, 1]) {
    metal.push(new THREE.BoxGeometry(0.014, 0.03, 0.02).translate(sx * 0.048, -0.02, 0)); // clip
    const strap = new THREE.CylinderGeometry(0.0022, 0.0022, 0.11, 5); strap.rotateZ(sx * 0.19); strap.translate(sx * 0.0365, 0.034, 0); metal.push(strap); // hugs the shoulder
  }
  // grey rag: stuffed into the neck, tied off, with long frayed ends hanging down the side
  const parts: THREE.BufferGeometry[] = [];
  parts.push(new THREE.CylinderGeometry(0.012, 0.014, 0.05, 8).translate(0, 0.17, 0));
  parts.push(new THREE.TorusGeometry(0.02, 0.006, 6, 12).rotateX(Math.PI / 2).translate(0, 0.12, 0)); // the knot round the neck
  for (let i = 0; i < 4; i++) { const len = 0.06 + i * 0.015; const g = new THREE.BoxGeometry(0.016, len, 0.005); g.translate(0, -len / 2, 0); g.rotateZ(0.12 + (i - 1.5) * 0.1); g.rotateY(-0.3 + i * 0.22); g.translate(0.024, 0.122, 0.006 * (i - 1.5)); parts.push(g); } // frayed ends hanging down
  const rag = mergeAll(parts);
  shared = {
    bottle, liquid, rag, metal: mergeAll(metal),
    glass: new THREE.MeshStandardMaterial({ color: 0xd8e4e0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false, envMapIntensity: 2 }),
    fill: new THREE.MeshStandardMaterial({ color: 0x2e1c0a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x6e685c, roughness: 0.95, side: THREE.DoubleSide }), // dirty grey rag
    iron: new THREE.MeshStandardMaterial({ color: 0x55524e, roughness: 0.5, metalness: 0.8 }),
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
  const cage = new THREE.Mesh(r.metal, r.iron); cage.castShadow = true; g.add(cage);
  const wick = new THREE.Object3D(); wick.name = 'wick'; wick.position.set(0, 0.2, 0); g.add(wick); // the burning top of the rag
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
