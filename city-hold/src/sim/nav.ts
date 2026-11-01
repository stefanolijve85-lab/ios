import type { MapDef, Rect, Vec2 } from '../maps/types';
import { rectContains } from '../maps/types';

export const CELL = 0.5;
export const AGENT_R = 0.35;

export interface StaticObstacleSet { rects: Rect[]; circles: { x: number; z: number; r: number }[] }

const CAR = { len: 4.4, wid: 1.9 };
export const VAN = { len: 5.6, wid: 2.2 };

/** Collect every static obstacle of a map (used by nav and by placement checks). */
export function staticObstacles(map: MapDef): StaticObstacleSet {
  const rects: Rect[] = [];
  const circles: { x: number; z: number; r: number }[] = [];
  for (const b of map.buildings) {
    if (!b.passages || b.passages.length === 0) { rects.push(b.rect); continue; }
    // split building into solid pieces around passages: represent passages by carving later
    rects.push(b.rect);
  }
  rects.push(...map.walls, ...map.islands);
  for (const a of map.arcades) circles.push(...a.columns);
  if (map.fountain) circles.push(map.fountain);
  for (const p of map.props) {
    if (!p.collide) continue;
    if (p.type === 'car') {
      const vert = p.rot === 90;
      const hl = (vert ? CAR.wid : CAR.len) / 2, hw = (vert ? CAR.len : CAR.wid) / 2;
      rects.push({ x0: p.x - hl, z0: p.z - hw, x1: p.x + hl, z1: p.z + hw });
    } else circles.push({ x: p.x, z: p.z, r: p.r ?? 0.4 });
  }
  const v = map.van;
  const vert = v.rot === 0;
  const hl = (vert ? VAN.wid : VAN.len) / 2, hw = (vert ? VAN.len : VAN.wid) / 2;
  rects.push({ x0: v.x - hl, z0: v.z - hw, x1: v.x + hl, z1: v.z + hw });
  return { rects, circles };
}

export function barrierRect(x: number, z: number, size: 'small' | 'large', rot: 0 | 90): Rect {
  const len = size === 'small' ? 2.6 : 4.6;
  const th = size === 'small' ? 0.5 : 0.9;
  const hx = (rot === 0 ? len : th) / 2, hz = (rot === 0 ? th : len) / 2;
  return { x0: x - hx, z0: z - hz, x1: x + hx, z1: z + hz };
}

class Heap {
  private a: number[] = [];
  private f: Float64Array;
  constructor(n: number) { this.f = new Float64Array(n); }
  get size() { return this.a.length; }
  push(i: number, f: number) {
    this.f[i] = f; const a = this.a; a.push(i);
    let k = a.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (this.f[a[p]] <= f) break; a[k] = a[p]; k = p; }
    a[k] = i;
  }
  pop(): number {
    const a = this.a; const top = a[0]; const last = a.pop()!;
    if (a.length) {
      let k = 0; const n = a.length; const fl = this.f[last];
      for (;;) {
        let c = 2 * k + 1; if (c >= n) break;
        if (c + 1 < n && this.f[a[c + 1]] < this.f[a[c]]) c++;
        if (this.f[a[c]] >= fl) break;
        a[k] = a[c]; k = c;
      }
      a[k] = last;
    }
    return top;
  }
}

export class NavGrid {
  readonly w: number; readonly h: number;
  readonly ox: number; readonly oz: number;
  /** 1 = statically blocked */
  readonly blocked: Uint8Array;
  /** barrier id occupying a cell (-1 none) */
  readonly barrier: Int32Array;
  /** cell inside a reduced-sight zone */
  readonly lowSight: Uint8Array;
  private g: Float64Array; private came: Int32Array; private stamp: Uint32Array; private closed: Uint32Array; private run = 1;

  constructor(public readonly map: MapDef) {
    const b = map.bounds;
    this.ox = b.x0; this.oz = b.z0;
    this.w = Math.ceil((b.x1 - b.x0) / CELL); this.h = Math.ceil((b.z1 - b.z0) / CELL);
    const n = this.w * this.h;
    this.blocked = new Uint8Array(n); this.barrier = new Int32Array(n).fill(-1); this.lowSight = new Uint8Array(n);
    this.g = new Float64Array(n); this.came = new Int32Array(n); this.stamp = new Uint32Array(n); this.closed = new Uint32Array(n);
    const obs = staticObstacles(map);
    const passages: Rect[] = map.buildings.flatMap((bd) => bd.passages ?? []);
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const x = this.ox + (i + 0.5) * CELL, z = this.oz + (j + 0.5) * CELL;
      const k = j * this.w + i;
      let bl = false;
      // a passage counts from just outside the facade so the inflated wall band does not seal its mouths
      const grow = (p: Rect): Rect => (p.x1 - p.x0 > p.z1 - p.z0 ? { x0: p.x0 - AGENT_R - 0.05, z0: p.z0, x1: p.x1 + AGENT_R + 0.05, z1: p.z1 } : { x0: p.x0, z0: p.z0 - AGENT_R - 0.05, x1: p.x1, z1: p.z1 + AGENT_R + 0.05 });
      const inPassage = passages.some((p) => rectContains(grow(p), x, z));
      for (const r of obs.rects) {
        if (x > r.x0 - AGENT_R && x < r.x1 + AGENT_R && z > r.z0 - AGENT_R && z < r.z1 + AGENT_R) {
          // building rects can be cut by passages
          if (inPassage && map.buildings.some((bd) => bd.rect === r)) continue;
          bl = true; break;
        }
      }
      if (!bl) for (const c of obs.circles) { const dx = x - c.x, dz = z - c.z; const rr = c.r + AGENT_R; if (dx * dx + dz * dz < rr * rr) { bl = true; break; } }
      if (!bl && map.water.some((r) => x > r.x0 - AGENT_R && x < r.x1 + AGENT_R && z > r.z0 - AGENT_R && z < r.z1 + AGENT_R)) {
        bl = !map.bridges.some((r) => rectContains(r, x, z));
      }
      // passages must stay clear of the passage's own side walls
      if (!bl && inPassage) {
        const p = passages.find((pp) => rectContains(grow(pp), x, z))!;
        const horizontal = p.x1 - p.x0 > p.z1 - p.z0;
        if (horizontal ? (z < p.z0 + AGENT_R || z > p.z1 - AGENT_R) : (x < p.x0 + AGENT_R || x > p.x1 - AGENT_R)) bl = true;
      }
      this.blocked[k] = bl ? 1 : 0;
      if (map.lowSight.some((r) => rectContains(r, x, z))) this.lowSight[k] = 1;
    }
  }

  cellOf(x: number, z: number): [number, number] {
    return [Math.floor((x - this.ox) / CELL), Math.floor((z - this.oz) / CELL)];
  }
  idx(x: number, z: number): number {
    const [i, j] = this.cellOf(x, z);
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return -1;
    return j * this.w + i;
  }
  center(k: number): Vec2 { const i = k % this.w, j = (k / this.w) | 0; return { x: this.ox + (i + 0.5) * CELL, z: this.oz + (j + 0.5) * CELL }; }

  walkable(x: number, z: number): boolean { const k = this.idx(x, z); return k >= 0 && !this.blocked[k]; }
  /** walkable and not occupied by an intact barrier */
  open(x: number, z: number): boolean { const k = this.idx(x, z); return k >= 0 && !this.blocked[k] && this.barrier[k] < 0; }

  setBarrier(id: number, r: Rect, on: boolean) {
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const x = this.ox + (i + 0.5) * CELL, z = this.oz + (j + 0.5) * CELL;
      if (x > r.x0 - AGENT_R && x < r.x1 + AGENT_R && z > r.z0 - AGENT_R && z < r.z1 + AGENT_R) {
        const k = j * this.w + i;
        if (on) { if (this.barrier[k] < 0) this.barrier[k] = id; }
        else if (this.barrier[k] === id) this.barrier[k] = -1;
      }
    }
  }

  nearestWalkable(x: number, z: number, maxR = 6): Vec2 | null {
    const k0 = this.idx(x, z);
    if (k0 >= 0 && !this.blocked[k0]) return { x, z };
    const [ci, cj] = this.cellOf(x, z);
    const R = Math.ceil(maxR / CELL);
    let best = -1, bd = Infinity;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
      const k = j * this.w + i; if (this.blocked[k]) continue;
      const d = di * di + dj * dj; if (d < bd) { bd = d; best = k; }
    }
    return best >= 0 ? this.center(best) : null;
  }

  /**
   * A* over the grid. mode 'att': barrier cells are passable at high cost (units must break through).
   * mode 'def': barrier cells are passable (own staff can step past). mode 'solid': barriers are walls.
   */
  findPath(from: Vec2, to: Vec2, mode: 'att' | 'def' | 'solid' = 'att', extraCost = 14): Vec2[] | null {
    const s = this.nearestWalkable(from.x, from.z, 3); const t = this.nearestWalkable(to.x, to.z, 6);
    if (!s || !t) return null;
    const sk = this.idx(s.x, s.z), tk = this.idx(t.x, t.z);
    if (sk < 0 || tk < 0) return null;
    const run = ++this.run; const W = this.w, H = this.h;
    const g = this.g, came = this.came, stamp = this.stamp, closed = this.closed;
    const heap = new Heap(W * H);
    const tx = tk % W, tz = (tk / W) | 0;
    const hfn = (k: number) => { const dx = Math.abs((k % W) - tx), dz = Math.abs(((k / W) | 0) - tz); return (dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz)); };
    stamp[sk] = run; g[sk] = 0; came[sk] = -1; heap.push(sk, hfn(sk));
    const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1];
    let found = false; let iter = 0;
    while (heap.size) {
      const k = heap.pop();
      if (closed[k] === run) continue;
      closed[k] = run;
      if (k === tk) { found = true; break; }
      if (++iter > 60000) break;
      const i = k % W, j = (k / W) | 0;
      for (let d = 0; d < 8; d++) {
        const ni = i + DI[d], nj = j + DJ[d];
        if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
        const nk = nj * W + ni;
        if (this.blocked[nk]) continue;
        if (d >= 4 && (this.blocked[j * W + ni] || this.blocked[nj * W + i])) continue; // no corner cutting
        let c = d >= 4 ? Math.SQRT2 : 1;
        if (this.barrier[nk] >= 0) { if (mode === 'solid') continue; if (mode === 'att') c += extraCost; }
        const ng = g[k] + c;
        if (stamp[nk] !== run || ng < g[nk]) { stamp[nk] = run; g[nk] = ng; came[nk] = k; heap.push(nk, ng + hfn(nk)); }
      }
    }
    if (!found) return null;
    const cells: number[] = [];
    for (let k = tk; k !== -1; k = came[k]) cells.push(k);
    cells.reverse();
    const pts = cells.map((k) => this.center(k));
    pts[pts.length - 1] = t;
    return this.smooth([s, ...pts.slice(1)], mode);
  }

  /** line of sight across walkable cells (barriers interrupt for attackers so they still meet them) */
  los(a: Vec2, b: Vec2, mode: 'att' | 'def' | 'solid' = 'att'): boolean {
    const dx = b.x - a.x, dz = b.z - a.z; const len = Math.hypot(dx, dz);
    const steps = Math.ceil(len / 0.08);
    for (let s = 0; s <= steps; s++) {
      const t = s / Math.max(1, steps);
      const x = a.x + dx * t, z = a.z + dz * t;
      const k = this.idx(x, z);
      if (k < 0 || this.blocked[k]) return false;
      if (mode !== 'def' && this.barrier[k] >= 0) return false;
    }
    return true;
  }

  private smooth(pts: Vec2[], mode: 'att' | 'def' | 'solid'): Vec2[] {
    if (pts.length <= 2) return pts;
    const out: Vec2[] = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.los(pts[i], pts[j], mode)) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }
}
