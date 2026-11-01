import { BALANCE, DIFFICULTY, type Difficulty, type AttKind, type DefKind, type UnitKind, waveComposition } from '../config/balance';
import type { MapDef, Rect, SocketDef, Vec2 } from '../maps/types';
import { storeDoor } from '../maps/types';
import { NavGrid, barrierRect } from './nav';

export type Side = 'defence' | 'looters';
export type Phase = 'prep' | 'wave' | 'running' | 'won' | 'lost';

export class Rng {
  constructor(private s: number) { if (!this.s) this.s = 1; }
  next(): number { let x = this.s; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.s = x >>> 0; return this.s / 4294967296; }
  int(n: number) { return Math.floor(this.next() * n); }
  pick<T>(a: T[]): T { return a[this.int(a.length)]; }
}

export interface Store {
  idx: number;
  name: string;
  structure: number;
  maxStructure: number;
  stock: number;
  /** stock currently being carried away (not yet lost) */
  reserved: number;
  shutterLevel: number;
  door: Vec2;
  /** total extracted (permanently lost) */
  lost: number;
  /** plywood boards over the front (protection layer, separate from structure damage) */
  boards: number;
  boardsMax: number;
  /** visible fire damage stays after extinguishing (soot); separate from stock */
  scorched: boolean;
}

export type AttState = 'approach' | 'throw' | 'breach' | 'collect' | 'extract' | 'flee' | 'barrier' | 'held' | 'restrained' | 'escorted' | 'removed' | 'escaped';
export type DefState = 'idle' | 'move' | 'chase' | 'restrain' | 'escort' | 'extinguish' | 'return';

export interface Unit {
  id: number;
  side: 'def' | 'att';
  kind: UnitKind;
  x: number; z: number;
  facing: number;
  r: number;
  /** appearance seed: independent of stats */
  variant: number;
  state: AttState | DefState;
  stateT: number;
  path: Vec2[] | null;
  pi: number;
  goal: Vec2 | null;
  repathT: number;
  moving: boolean;
  speedNow: number;
  // attacker
  targetStore: number;
  exitId: string;
  carrying: number;
  pending: number;
  carryStore: number;
  capacity: number;
  detectedUntil: number;
  camSeen: number;
  heldBy: number;
  holdT: number;
  restrainP: number;
  restrainBy: number;
  immuneT: number;
  barrierId: number;
  /** thrower: throws left, cooldown, release done in the current throw, aim */
  throwsLeft: number; throwCd: number; released: boolean; aim: ThrowTarget | null;
  stuckT: number; lastX: number; lastZ: number; totalStuck: number;
  // defender
  home: Vec2;
  engage: number;
  escortOf: number;
  fireId: number;
  selected: boolean;
  chaseT: number;
  escortSolo: boolean;
}

export interface Barrier { id: number; socketId: string; x: number; z: number; size: 'small' | 'large'; rot: 0 | 90; hp: number; maxHp: number; rect: Rect; broken: boolean; brokenT: number }
export interface CameraMast { id: number; socketId: string; x: number; z: number }
export interface Fire { id: number; x: number; z: number; store: number; prop: number; progress: number; out: boolean; t: number; /** ground fires burn out by themselves */ ttl: number }
export type NpcRole = 'civilian' | 'shopkeeper' | 'helper';
/** neutral person: never targeted, never counted, only reacts to danger */
export interface Npc { id: number; role: NpcRole; x: number; z: number; facing: number; state: 'stroll' | 'idle' | 'flee' | 'guide' | 'gone'; path: Vec2[] | null; pi: number; goal: Vec2 | null; moving: boolean; speed: number; store: number; variant: number; carrying: boolean; exit: string; t: number }
export interface ThrowTarget { kind: 'store' | 'prop' | 'ground'; idx: number; x: number; z: number }
/** fictional thrown incendiary in flight (game object; physics is a simple configurable arc) */
export interface Projectile { id: number; owner: number; x: number; y: number; z: number; sx: number; sy: number; sz: number; tx: number; tz: number; t: number; T: number; apex: number; target: ThrowTarget; spin: number }
export interface Drop { id: number; x: number; z: number; amount: number; t: number }
export interface Truck { x: number; z: number; facing: number; seg: number; done: boolean; rewarded: boolean; waitT: number; active: boolean; blocked: boolean }

export type EventType = 'purchase' | 'denied' | 'intercept' | 'extract' | 'breach' | 'fire' | 'extinguished' | 'barrierBroken' | 'waveStart' | 'waveEnd' | 'won' | 'lost' | 'upgrade' | 'held' | 'recovered' | 'dispatch' | 'supply' | 'info' | 'collect' | 'release' | 'impact';
export interface GameEvent { type: EventType; text: string; x?: number; z?: number; amount?: number; side?: 'def' | 'att'; id?: number }

export interface GameOptions {
  seed?: number;
  perks?: string[];
  mobile?: boolean;
  difficulty?: Difficulty;
}

export interface ActionResult { ok: boolean; reason?: string }

const DEF_KINDS: DefKind[] = ['security', 'shield', 'firefighter'];

export class Game {
  readonly nav: NavGrid;
  readonly rng: Rng;
  time = 0;
  phase: Phase;
  budget: number;
  wave = 1;
  units: Unit[] = [];
  stores: Store[];
  barriers: Barrier[] = [];
  cameras: CameraMast[] = [];
  fires: Fire[] = [];
  projectiles: Projectile[] = [];
  npcs: Npc[] = [];
  readonly difficulty: Difficulty;
  /** separate random stream: neutral people must never change the course of the game */
  private npcRng!: Rng;
  maxCivilians: number = BALANCE.npc.civilians.desktop;
  private npcSpawnT = 0;
  /** projectile budget (lower on phones) */
  maxProjectiles: number = BALANCE.throw.maxActive.desktop;
  drops: Drop[] = [];
  burnedProps = new Set<number>();
  events: GameEvent[] = [];
  truck: Truck | null = null;
  private nextId = 1;
  // defence progression
  securityTrained = false;
  securitySpec: 'none' | 'mobile' | 'fixed' = 'none';
  cameraSpec: 'none' | 'wide' | 'fast' = 'none';
  // wave director (defence mode)
  spawnQueue: { kind: AttKind; entry: string; store: number; at: number }[] = [];
  nextWavePlan: { kinds: AttKind[]; entries: string[] } = { kinds: [], entries: [] };
  wavesCleared = 0;
  // looter mode
  squad: AttKind[] = [];
  looterTarget = -1;
  looterRoute: string;
  extracted = 0;
  looterUpgrade: 'none' | 'capacity' | 'speed' = 'none';
  timeLeft = BALANCE.looters.timeLimit;
  dispatchQueue: { kind: AttKind; at: number; store: number; entry: string }[] = [];
  // AI defence (looter mode)
  aiBudget = 250;
  private aiIncomeT = 0;
  private aiThinkT = 0;
  private aiBarrierPlaced = false;
  // stats
  intercepted = 0;
  recovered = 0;
  rewardsGranted = 0;
  perks: Set<string>;
  result: { title: string; detail: string; storesHeld: number; extracted: number; research: number } | null = null;

  constructor(readonly map: MapDef, readonly side: Side, opts: GameOptions = {}) {
    this.nav = new NavGrid(map);
    this.rng = new Rng(opts.seed ?? 12345);
    this.perks = new Set(opts.perks ?? []);
    this.difficulty = opts.difficulty ?? 'normal';
    if (opts.mobile) this.maxProjectiles = BALANCE.throw.maxActive.mobile;
    this.maxCivilians = opts.mobile ? BALANCE.npc.civilians.mobile : BALANCE.npc.civilians.desktop;
    const bonus = this.perks.has('budget') ? 100 : 0;
    this.stores = map.stores.map((s, idx) => ({
      idx, name: s.name, structure: BALANCE.defence.storeStructure, maxStructure: BALANCE.defence.storeStructure,
      stock: BALANCE.defence.storeStock, reserved: 0, shutterLevel: 1, door: storeDoor(s), lost: 0, boards: 0, boardsMax: BALANCE.defence.boardsHp, scorched: false,
    }));
    this.looterRoute = map.entries.find((e) => e.spawn)!.id;
    if (side === 'defence') {
      this.phase = 'prep';
      this.budget = BALANCE.defence.startBudget + bonus;
      // initial mobile reserve
      const sp = map.defenderSpawn;
      this.spawnDefender('security', { x: sp.x - 2, z: sp.z - 1 });
      this.planWave();
    } else {
      this.phase = 'running';
      this.budget = BALANCE.looters.startBudget + bonus;
      this.setupAiDefence();
    }
    this.npcRng = new Rng(((opts.seed ?? 12345) * 7919) ^ 0x5bd1e995);
    this.initNpcs();
    if (map.supply) {
      const p = map.supply.route[0];
      this.truck = { x: p.x, z: p.z, facing: 0, seg: 0, done: false, rewarded: false, waitT: 0, active: false, blocked: false };
    }
  }

  // ------------------------------------------------------------------ helpers
  emit(e: GameEvent) { this.events.push(e); }
  drainEvents(): GameEvent[] { const e = this.events; this.events = []; return e; }
  unit(id: number) { return this.units.find((u) => u.id === id); }
  available(s: Store) { return Math.max(0, s.stock - s.reserved); }
  attackers() { return this.units.filter((u) => u.side === 'att' && u.state !== 'removed' && u.state !== 'escaped'); }
  defenders() { return this.units.filter((u) => u.side === 'def'); }
  storesWithStock() { return this.stores.filter((s) => s.stock > 0).length; }
  socket(id: string): SocketDef | undefined { return this.map.sockets.find((s) => s.id === id); }
  socketUsed(id: string) { return this.barriers.some((b) => b.socketId === id && !b.broken) || this.cameras.some((c) => c.socketId === id); }
  get over() { return this.phase === 'won' || this.phase === 'lost'; }

  private baseUnit(side: 'def' | 'att', kind: UnitKind, p: Vec2): Unit {
    const st = BALANCE.units[kind] as { radius: number };
    return {
      id: this.nextId++, side, kind, x: p.x, z: p.z, facing: 0, r: st.radius, variant: Math.floor(this.rng.next() * 1e6),
      state: side === 'def' ? 'idle' : 'approach', stateT: 0, path: null, pi: 0, goal: null, repathT: 0, moving: false, speedNow: 0,
      targetStore: -1, exitId: '', carrying: 0, pending: 0, carryStore: -1, capacity: 0, detectedUntil: -1, camSeen: 0, heldBy: -1, holdT: 0,
      restrainP: 0, restrainBy: -1, immuneT: 0, barrierId: -1, throwsLeft: kind === 'thrower' ? BALANCE.throw.throwsPerUnit : 0, throwCd: 0, released: false, aim: null, stuckT: 0, lastX: p.x, lastZ: p.z, totalStuck: 0,
      home: { x: p.x, z: p.z }, engage: -1, escortOf: -1, fireId: -1, selected: false, chaseT: 0, escortSolo: false,
    };
  }

  spawnDefender(kind: DefKind, p: Vec2): Unit {
    const q = this.nav.nearestWalkable(p.x, p.z, 4) ?? p;
    const u = this.baseUnit('def', kind, q);
    this.units.push(u);
    return u;
  }

  spawnAttacker(kind: AttKind, entryId: string, store: number, exitId?: string): Unit {
    const e = this.map.entries.find((en) => en.id === entryId)!;
    const jitter = { x: e.x + (this.rng.next() - 0.5) * 1.5, z: e.z + (this.rng.next() - 0.5) * 1.5 };
    const p = this.nav.nearestWalkable(jitter.x, jitter.z, 4) ?? { x: e.x, z: e.z };
    const u = this.baseUnit('att', kind, p);
    const st = BALANCE.units[kind];
    u.capacity = (st as { capacity: number }).capacity + (this.perks.has('carry') && this.side === 'looters' ? 1 : 0);
    if (this.side === 'looters' && this.looterUpgrade === 'capacity') u.capacity = Math.round(u.capacity * BALANCE.looters.capacityUpgrade);
    u.targetStore = store;
    u.exitId = exitId ?? this.nearestExit(this.stores[store]?.door ?? p).id;
    this.units.push(u);
    this.setAttGoal(u);
    return u;
  }

  nearestExit(p: Vec2) {
    let best = this.map.entries[0], bd = Infinity;
    for (const e of this.map.entries) { if (!e.extract) continue; const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  doorSlot(u: Unit, storeIdx: number): Vec2 {
    const s = this.map.stores[storeIdx]; const d = this.stores[storeIdx].door;
    const tx = -s.normal.z, tz = s.normal.x; // tangent
    const off = ((u.id % 5) - 2) * Math.min(1.1, s.width / 6);
    const out = 0.3 + (u.id % 2) * 0.6;
    return { x: d.x + tx * off + s.normal.x * out, z: d.z + tz * off + s.normal.z * out };
  }

  speedOf(u: Unit): number {
    const base = (BALANCE.units[u.kind] as { speed: number }).speed;
    let s = base;
    if (u.side === 'att') {
      if (u.carrying > 0) s *= BALANCE.loadedSpeedFactor;
      if (this.side === 'looters' && this.looterUpgrade === 'speed') s *= BALANCE.looters.speedUpgrade;
    } else if (u.kind === 'security') {
      if (this.securityTrained) s *= BALANCE.upgrades.securityTraining.speedMul;
      if (this.securitySpec === 'mobile') s *= BALANCE.upgrades.securitySpec.mobile.speedMul;
    }
    return s;
  }

  private setPath(u: Unit, goal: Vec2) {
    const mode = u.side === 'att' ? 'att' : 'def';
    u.goal = goal;
    u.path = this.nav.findPath(u, goal, mode, BALANCE.barrier.extraPathCost);
    u.pi = 1;
    u.repathT = 0;
  }

  private setAttGoal(u: Unit) {
    if (u.state === 'approach') this.setPath(u, this.doorSlot(u, u.targetStore));
    else if (u.state === 'extract' || u.state === 'flee') {
      const e = this.map.entries.find((en) => en.id === u.exitId) ?? this.nearestExit(u);
      this.setPath(u, { x: e.x, z: e.z });
    }
  }

  /** move along path; returns true when arrived */
  private follow(u: Unit, dt: number, speed: number): boolean {
    u.moving = false; u.speedNow = 0;
    if (!u.path) return false; // no route yet: callers request a new path
    if (u.pi >= u.path.length) return true;
    let budget = speed * dt;
    while (budget > 0 && u.pi < u.path.length) {
      const p = u.path[u.pi];
      const dx = p.x - u.x, dz = p.z - u.z; const d = Math.hypot(dx, dz);
      if (d < 0.05) { u.pi++; continue; }
      const step = Math.min(d, budget);
      const nx = u.x + (dx / d) * step, nz = u.z + (dz / d) * step;
      // attackers must stop at intact barriers and break them
      if (u.side === 'att') {
        const ahead = this.nav.idx(u.x + (dx / d) * Math.min(d, 0.45), u.z + (dz / d) * Math.min(d, 0.45));
        if (ahead >= 0 && this.nav.barrier[ahead] >= 0) {
          const bid = this.nav.barrier[ahead];
          const b = this.barriers.find((bb) => bb.id === bid);
          if (b && !b.broken) { u.barrierId = b.id; u.state = 'barrier'; u.facing = Math.atan2(dx, dz); return false; }
        }
      }
      if (!this.nav.walkable(nx, nz)) {
        // slide along the obstacle instead of stopping dead, then ask for a new path
        u.repathT = 99;
        if (this.nav.walkable(nx, u.z)) { u.x = nx; u.moving = true; }
        else if (this.nav.walkable(u.x, nz)) { u.z = nz; u.moving = true; }
        else { u.path = null; }
        break;
      }
      u.x = nx; u.z = nz; u.facing = Math.atan2(dx, dz);
      budget -= step; u.moving = true; u.speedNow = speed;
      if (step >= d - 1e-6) u.pi++;
    }
    return !!u.path && u.pi >= u.path.length;
  }

  // ------------------------------------------------------------------ player actions (defence)
  buyUnit(kind: DefKind): ActionResult {
    if (this.side !== 'defence' || this.over) return { ok: false, reason: 'Not available' };
    const cost = BALANCE.defence.costs[kind];
    if (this.defenders().length >= BALANCE.defence.maxDefenders) return this.deny('Unit limit reached');
    if (this.budget < cost) return this.deny('Insufficient budget');
    this.budget -= cost;
    const sp = this.map.defenderSpawn;
    const n = this.defenders().length;
    const u = this.spawnDefender(kind, { x: sp.x - (n % 3), z: sp.z + ((n % 2) ? 1 : -1) });
    this.emit({ type: 'purchase', text: `${kind === 'security' ? 'Security team' : kind === 'shield' ? 'Shield team' : 'Firefighter'} deployed at the van (-${cost})`, x: u.x, z: u.z, amount: cost });
    return { ok: true };
  }

  private deny(reason: string): ActionResult { this.emit({ type: 'denied', text: reason }); return { ok: false, reason }; }

  /** check that every spawn can still reach every store and every store an exit with barriers treated as walls */
  routesOpenWith(extra: Rect | null): boolean {
    const id = 2_000_000_000; // temporary barrier id (must be >= 0 to count as a barrier)
    if (extra) this.nav.setBarrier(id, extra, true);
    let ok = true;
    const spawns = this.map.entries.filter((e) => e.spawn);
    const exits = this.map.entries.filter((e) => e.extract);
    outer: for (const s of this.stores) {
      // at least one spawn must reach each store, and the store must reach at least one exit
      let anyIn = false;
      for (const e of spawns) if (this.nav.findPath({ x: e.x, z: e.z }, s.door, 'solid')) { anyIn = true; break; }
      let anyOut = false;
      for (const e of exits) if (this.nav.findPath(s.door, { x: e.x, z: e.z }, 'solid')) { anyOut = true; break; }
      if (!anyIn || !anyOut) { ok = false; break outer; }
    }
    if (extra) this.nav.setBarrier(id, extra, false);
    return ok;
  }

  canPlace(kind: 'barrier' | 'concrete' | 'camera', socketId: string): ActionResult {
    const s = this.socket(socketId);
    if (!s) return { ok: false, reason: 'Invalid location' };
    if (this.socketUsed(socketId)) return { ok: false, reason: 'Socket occupied' };
    if (kind === 'concrete' && s.size !== 'large') return { ok: false, reason: 'Concrete barriers need a large socket' };
    if (kind !== 'concrete' && s.size !== 'small' && kind === 'camera') return { ok: false, reason: 'Cameras need a small socket' };
    const cost = BALANCE.defence.costs[kind];
    if (this.budget < cost) return { ok: false, reason: 'Insufficient budget' };
    if (kind !== 'camera') {
      const r = barrierRect(s.x, s.z, kind === 'concrete' ? 'large' : s.size, s.rot);
      // units standing on the spot block placement
      if (this.units.some((u) => u.x > r.x0 - 0.4 && u.x < r.x1 + 0.4 && u.z > r.z0 - 0.4 && u.z < r.z1 + 0.4)) return { ok: false, reason: 'Units are standing there' };
      if (!this.routesOpenWith(r)) return { ok: false, reason: 'Would block every route' };
    }
    return { ok: true };
  }

  place(kind: 'barrier' | 'concrete' | 'camera', socketId: string): ActionResult {
    if (this.over) return { ok: false };
    const chk = this.canPlace(kind, socketId);
    if (!chk.ok) return this.deny(chk.reason!);
    const s = this.socket(socketId)!;
    const cost = this.side === 'defence' ? BALANCE.defence.costs[kind] : 0;
    this.budget -= cost;
    this.addStructure(kind, s);
    this.emit({ type: 'purchase', text: `${kind === 'camera' ? 'Camera mast' : kind === 'concrete' ? 'Concrete barrier' : 'Barrier'} placed (-${cost})`, x: s.x, z: s.z, amount: cost });
    return { ok: true };
  }

  private addStructure(kind: 'barrier' | 'concrete' | 'camera', s: SocketDef) {
    if (kind === 'camera') { this.cameras.push({ id: this.nextId++, socketId: s.id, x: s.x, z: s.z }); return; }
    const size = kind === 'concrete' ? 'large' : s.size;
    const hp = kind === 'concrete' ? BALANCE.barrier.concreteHp : BALANCE.barrier.hp;
    // remove a previously broken barrier from this socket
    this.barriers = this.barriers.filter((b) => b.socketId !== s.id);
    const b: Barrier = { id: this.nextId++, socketId: s.id, x: s.x, z: s.z, size, rot: s.rot, hp, maxHp: hp, rect: barrierRect(s.x, s.z, size, s.rot), broken: false, brokenT: 0 };
    this.barriers.push(b);
    this.nav.setBarrier(b.id, b.rect, true);
    for (const u of this.units) u.repathT = 99;
  }

  moveUnits(ids: number[], x: number, z: number): ActionResult {
    const p = this.nav.nearestWalkable(x, z, 3);
    if (!p) return this.deny('Cannot move there');
    let i = 0;
    for (const id of ids) {
      const u = this.unit(id);
      if (!u || u.side !== 'def' || u.state === 'escort') continue;
      if (u.state === 'restrain') this.releaseRestrain(u);
      const ang = i * 2.399; const rad = i === 0 ? 0 : 0.9 + 0.3 * i;
      const q = this.nav.nearestWalkable(p.x + Math.cos(ang) * rad, p.z + Math.sin(ang) * rad, 2) ?? p;
      u.state = 'move'; u.engage = -1; u.fireId = -1; u.home = q; this.setPath(u, q);
      if (!u.path) return this.deny('No route');
      i++;
    }
    return { ok: i > 0 };
  }

  pathPreview(id: number, x: number, z: number): Vec2[] | null {
    const u = this.unit(id); if (!u) return null;
    return this.nav.findPath(u, { x, z }, u.side === 'att' ? 'att' : 'def');
  }

  orderEngage(ids: number[], targetId: number): ActionResult {
    const t = this.unit(targetId);
    if (!t || t.side !== 'att') return { ok: false };
    let any = false;
    for (const id of ids) {
      const u = this.unit(id);
      if (!u || u.kind !== 'security' || u.state === 'escort' || u.state === 'restrain') continue;
      u.state = 'chase'; u.engage = t.id; u.chaseT = 0; this.setPath(u, t); any = true;
      t.detectedUntil = this.time + 6;
    }
    return { ok: any };
  }

  orderExtinguish(ids: number[], fireId: number): ActionResult {
    const f = this.fires.find((ff) => ff.id === fireId && !ff.out);
    if (!f) return { ok: false };
    let any = false;
    for (const id of ids) { const u = this.unit(id); if (u?.kind === 'firefighter') { u.fireId = f.id; u.state = 'extinguish'; this.setPath(u, f); any = true; } }
    return any ? { ok: true } : this.deny('Select a firefighter to extinguish fires');
  }

  shutterNext(idx: number) { return BALANCE.upgrades.shutter.find((s) => s.level === this.stores[idx].shutterLevel + 1) ?? null; }

  /** nail plywood over the front. Protection only: it does not repair damage and does not change stock. */
  boardUp(idx: number): ActionResult {
    if (this.over || this.side !== 'defence') return { ok: false };
    const s = this.stores[idx]; if (!s) return { ok: false };
    if (s.boards >= s.boardsMax) return this.deny('Already boarded');
    const c = BALANCE.defence.costs.boards;
    if (this.budget < c) return this.deny('Insufficient budget');
    this.budget -= c; s.boards = s.boardsMax;
    this.emit({ type: 'upgrade', text: `${s.name}: boarded up (+${s.boardsMax} protection, -${c})`, x: s.door.x, z: s.door.z });
    return { ok: true };
  }

  /** repair glass and shutter between waves. Restores structure only; stock is NOT refilled. */
  repairStore(idx: number): ActionResult {
    if (this.over || this.side !== 'defence') return { ok: false };
    const s = this.stores[idx]; if (!s) return { ok: false };
    if (this.phase !== 'prep') return this.deny('Repairs only between waves');
    if (s.structure >= s.maxStructure) return this.deny('Nothing to repair');
    const c = BALANCE.defence.costs.repair;
    if (this.budget < c) return this.deny('Insufficient budget');
    this.budget -= c; s.structure = s.maxStructure;
    this.emit({ type: 'upgrade', text: `${s.name}: storefront repaired (-${c}); stock stays at ${s.stock}`, x: s.door.x, z: s.door.z });
    return { ok: true };
  }

  upgradeShutter(idx: number): ActionResult {
    if (this.over) return { ok: false };
    const s = this.stores[idx]; const nxt = this.shutterNext(idx);
    if (!nxt) return this.deny('Shutter already at maximum level');
    if (this.budget < nxt.cost) return this.deny('Insufficient budget');
    this.budget -= nxt.cost;
    s.shutterLevel = nxt.level;
    s.maxStructure += nxt.addCapacity;
    s.structure = Math.min(s.maxStructure, s.structure + nxt.addCapacity); // repairs only the capacity added
    this.emit({ type: 'upgrade', text: `${s.name}: shutter level ${nxt.level} (+${nxt.addCapacity} structure, -${nxt.cost})`, x: s.door.x, z: s.door.z });
    return { ok: true };
  }

  upgradeSecurity(): ActionResult {
    if (this.securityTrained) return this.deny('Already trained');
    const c = BALANCE.upgrades.securityTraining.cost;
    if (this.budget < c) return this.deny('Insufficient budget');
    this.budget -= c; this.securityTrained = true;
    this.emit({ type: 'upgrade', text: `Security level 2: +12% speed, 15% faster restraint (-${c})` });
    return { ok: true };
  }

  chooseSecuritySpec(spec: 'mobile' | 'fixed'): ActionResult {
    if (!this.securityTrained) return this.deny('Requires security level 2');
    if (this.securitySpec !== 'none') return this.deny('Specialisation already chosen');
    const c = BALANCE.upgrades.securitySpec.cost;
    if (this.budget < c) return this.deny('Insufficient budget');
    this.budget -= c; this.securitySpec = spec;
    this.emit({ type: 'upgrade', text: spec === 'mobile' ? `Mobile response: +20% speed, +4 m response range (-${c})` : `Fixed protection: 40% faster restraint near post (-${c})` });
    return { ok: true };
  }

  chooseCameraSpec(spec: 'wide' | 'fast'): ActionResult {
    if (this.cameraSpec !== 'none') return this.deny('Camera specialisation already chosen');
    if (this.cameras.length === 0) return this.deny('Place a camera mast first');
    const c = BALANCE.upgrades.cameraSpec.cost;
    if (this.budget < c) return this.deny('Insufficient budget');
    this.budget -= c; this.cameraSpec = spec;
    this.emit({ type: 'upgrade', text: spec === 'wide' ? `Wider coverage: camera radius ${BALANCE.camera.radius} → ${BALANCE.camera.wideRadius} m (-${c})` : `Faster detection: ${BALANCE.camera.detectDelay}s → ${BALANCE.camera.fastDelay}s (-${c})` });
    return { ok: true };
  }

  cameraRadius() { return this.cameraSpec === 'wide' ? BALANCE.camera.wideRadius : BALANCE.camera.radius; }

  startWave(): ActionResult {
    if (this.side !== 'defence' || this.phase !== 'prep') return { ok: false };
    this.phase = 'wave';
    const plan = this.nextWavePlan;
    let t = this.time + 1;
    // offenders arrive in small groups from the announced entries
    plan.kinds.forEach((kind, i) => {
      const entry = plan.entries[Math.floor(i / 4) % plan.entries.length];
      this.spawnQueue.push({ kind, entry, store: -1, at: t });
      t += i % 4 === 3 ? 3 + this.rng.next() * 3 : 0.5;
    });
    if (this.truck && !this.truck.rewarded && !this.truck.active) this.truck.active = true;
    this.emit({ type: 'waveStart', text: `Wave ${this.wave} started: ${plan.kinds.length} offenders` });
    return { ok: true };
  }

  planWave() {
    const kinds = waveComposition(this.wave);
    const extra = Math.round(kinds.length * (DIFFICULTY[this.difficulty].waveMul - 1));
    for (let i = 0; i < extra; i++) kinds.push(i % 3 === 2 ? 'runner' : 'carrier');
    for (let i = kinds.length - 1; i > 0; i--) { const j = this.rng.int(i + 1); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const spawns = this.map.entries.filter((e) => e.spawn).map((e) => e.id);
    const count = Math.min(spawns.length, this.wave < 3 ? 1 : this.wave < 7 ? 2 : 3);
    const entries: string[] = [];
    while (entries.length < count) { const e = this.rng.pick(spawns); if (!entries.includes(e)) entries.push(e); }
    this.nextWavePlan = { kinds, entries };
  }

  // ------------------------------------------------------------------ player actions (looters)
  recruit(kind: AttKind): ActionResult {
    if (this.side !== 'looters' || this.over) return { ok: false };
    const cost = BALANCE.looters.costs[kind];
    if (this.attackers().length + this.squad.length + this.dispatchQueue.length >= BALANCE.looters.maxActive) return this.deny('Group limit reached');
    if (this.budget < cost) return this.deny('Insufficient budget');
    this.budget -= cost; this.squad.push(kind);
    this.emit({ type: 'purchase', text: `${kind} recruited (-${cost})`, amount: cost });
    return { ok: true };
  }

  unrecruit(i: number): ActionResult {
    const k = this.squad[i]; if (!k) return { ok: false };
    this.squad.splice(i, 1); this.budget += BALANCE.looters.costs[k];
    return { ok: true };
  }

  setLooterTarget(idx: number): ActionResult {
    if (idx < 0 || idx >= this.stores.length) return { ok: false };
    this.looterTarget = idx; return { ok: true };
  }
  setLooterRoute(id: string): ActionResult {
    const e = this.map.entries.find((en) => en.id === id && en.spawn);
    if (!e) return { ok: false }; this.looterRoute = id; return { ok: true };
  }

  dispatch(): ActionResult {
    if (this.side !== 'looters' || this.over) return { ok: false };
    if (this.squad.length === 0) return this.deny('Recruit units first');
    if (this.looterTarget < 0) return this.deny('Choose a target store');
    let t = this.time;
    for (const kind of this.squad) { this.dispatchQueue.push({ kind, at: t, store: this.looterTarget, entry: this.looterRoute }); t += 0.7; }
    this.emit({ type: 'dispatch', text: `${this.squad.length} units dispatched via ${this.map.entries.find((e) => e.id === this.looterRoute)!.name} → ${this.stores[this.looterTarget].name}` });
    this.squad = [];
    return { ok: true };
  }

  retarget(ids: number[], storeIdx: number): ActionResult {
    let n = 0;
    for (const id of ids) {
      const u = this.unit(id);
      if (!u || u.side !== 'att' || u.state !== 'approach') continue;
      u.targetStore = storeIdx; this.setAttGoal(u); n++;
    }
    if (n === 0) return this.deny('Only approaching units can be retargeted');
    this.emit({ type: 'info', text: `${n} unit(s) retargeted to ${this.stores[storeIdx].name}` });
    return { ok: true };
  }

  looterUpgradeChoose(kind: 'capacity' | 'speed'): ActionResult {
    if (this.looterUpgrade !== 'none') return this.deny('Upgrade already chosen');
    const c = BALANCE.looters.upgradeCost;
    if (this.budget < c) return this.deny('Insufficient budget');
    this.budget -= c; this.looterUpgrade = kind;
    if (kind === 'capacity') for (const u of this.attackers()) if (u.carrying === 0 && u.pending === 0) u.capacity = Math.round(u.capacity * BALANCE.looters.capacityUpgrade);
    this.emit({ type: 'upgrade', text: kind === 'capacity' ? `Capacity +30% (-${c})` : `Speed +15% (-${c})` });
    return { ok: true };
  }

  // ------------------------------------------------------------------ simulation
  step(dt: number) {
    if (this.over) return;
    this.time += dt;
    if (this.side === 'defence') this.stepDirector(dt); else this.stepLooterMode(dt);
    this.stepDetection(dt);
    for (const u of this.units) { if (u.side === 'def') this.stepDefender(u, dt); else this.stepAttacker(u, dt); }
    this.stepShields(dt);
    this.separate();
    this.stepProjectiles(dt);
    this.stepNpcs(dt);
    this.stepFires(dt);
    this.stepTruck(dt);
    for (const d of this.drops) d.t += dt;
    this.drops = this.drops.filter((d) => d.t < 6);
    for (const b of this.barriers) if (b.broken) b.brokenT += dt;
    this.units = this.units.filter((u) => u.state !== 'removed' && u.state !== 'escaped');
    this.checkEnd();
  }

  private stepDirector(dt: number) {
    if (this.phase !== 'wave') return;
    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.time) {
      const q = this.spawnQueue.shift()!;
      const store = this.pickStore();
      if (store < 0) continue;
      this.spawnAttacker(q.kind, q.entry, store);
    }
    if (this.spawnQueue.length === 0 && this.attackers().length === 0) {
      this.phase = 'prep';
      this.wavesCleared = this.wave;
      this.budget += BALANCE.defence.waveReward; this.rewardsGranted++;
      this.emit({ type: 'waveEnd', text: `Wave ${this.wave} secured — ${this.storesWithStock()} stores hold stock. +${BALANCE.defence.waveReward} budget`, amount: BALANCE.defence.waveReward });
      for (const d of this.defenders()) if (d.kind === 'security' && d.state === 'idle') { d.state = 'return'; this.setPath(d, d.home); }
      if (this.wave >= BALANCE.defence.waves) return; // checkEnd resolves victory
      this.wave++;
      this.planWave();
    }
  }

  private pickStore(): number {
    const cand = this.stores.filter((s) => this.available(s) > 0);
    if (!cand.length) return -1;
    let tot = 0; for (const s of cand) tot += this.available(s) + 20;
    let r = this.rng.next() * tot;
    for (const s of cand) { r -= this.available(s) + 20; if (r <= 0) return s.idx; }
    return cand[cand.length - 1].idx;
  }

  private stepLooterMode(dt: number) {
    this.timeLeft = Math.max(0, BALANCE.looters.timeLimit - this.time);
    while (this.dispatchQueue.length && this.dispatchQueue[0].at <= this.time) {
      const q = this.dispatchQueue.shift()!;
      this.spawnAttacker(q.kind, q.entry, q.store, q.entry);
    }
    this.stepAiDefence(dt);
    if (this.truck && !this.truck.active && !this.truck.rewarded && this.time > 60) this.truck.active = true;
  }

  private setupAiDefence() {
    const m = this.map;
    const mid = this.stores[Math.floor(this.stores.length / 2)];
    const guardPos = (s: Store, dist: number) => { const sd = m.stores[s.idx]; return { x: s.door.x + sd.normal.x * dist, z: s.door.z + sd.normal.z * dist }; };
    const s0 = this.stores[0], s2 = this.stores[this.stores.length - 1];
    const ai = BALANCE.looters.ai;
    for (let i = 0; i < ai.security + DIFFICULTY[this.difficulty].aiExtraSecurity; i++) { const st = [s0, s2, mid][i % 3]; const a = this.spawnDefender('security', guardPos(st, 7)); a.home = { x: a.x, z: a.z }; }
    for (let i = 0; i < ai.shield; i++) { const c = this.spawnDefender('shield', guardPos(mid, 2.2)); c.home = { x: c.x, z: c.z }; }
    const f = this.spawnDefender('firefighter', m.defenderSpawn); f.home = { x: f.x, z: f.z };
    // one camera on the socket closest to the middle store
    const smalls = m.sockets.filter((s) => s.size === 'small');
    smalls.sort((p, q) => Math.hypot(p.x - mid.door.x, p.z - mid.door.z) - Math.hypot(q.x - mid.door.x, q.z - mid.door.z));
    if (smalls[0] && ai.camera) this.addStructure('camera', smalls[0]);
  }

  private stepAiDefence(dt: number) {
    this.aiIncomeT += dt; this.aiThinkT += dt;
    if (this.aiIncomeT >= BALANCE.looters.ai.incomeEvery) { this.aiIncomeT = 0; this.aiBudget += Math.round(BALANCE.looters.ai.income * DIFFICULTY[this.difficulty].aiIncomeMul); }
    if (this.aiThinkT < 2) return;
    this.aiThinkT = 0;
    // threat per store = approaching attackers
    const threat = this.stores.map((s) => this.attackers().filter((u) => u.targetStore === s.idx && u.carrying === 0).length);
    const hot = threat.indexOf(Math.max(...threat));
    // shield guards the most threatened store
    const shield = this.defenders().find((d) => d.kind === 'shield');
    if (shield && threat[hot] > 0 && (shield.state === 'idle' || shield.state === 'return')) {
      const sd = this.map.stores[hot]; const s = this.stores[hot];
      const pos = { x: s.door.x + sd.normal.x * 2.2, z: s.door.z + sd.normal.z * 2.2 };
      if (Math.hypot(shield.home.x - pos.x, shield.home.z - pos.z) > 1) { shield.home = pos; shield.state = 'return'; this.setPath(shield, pos); }
    }
    // reinforce when threatened
    const secCount = this.defenders().filter((d) => d.kind === 'security').length;
    if (threat[hot] > 0 && this.time > BALANCE.looters.ai.reinforceAfter && this.aiBudget >= BALANCE.defence.costs.security && secCount < BALANCE.looters.ai.maxSecurity) {
      this.aiBudget -= BALANCE.defence.costs.security;
      const u = this.spawnDefender('security', this.map.defenderSpawn);
      const sd = this.map.stores[hot]; const s = this.stores[hot];
      u.home = this.nav.nearestWalkable(s.door.x + sd.normal.x * 5, s.door.z + sd.normal.z * 5) ?? u.home;
      u.state = 'return'; this.setPath(u, u.home);
      this.emit({ type: 'info', text: 'Defence AI deployed a security team' });
    }
    if (!this.aiBarrierPlaced && this.time > 75 && this.aiBudget >= 250) {
      const used = new Map<string, number>();
      for (const u of this.attackers()) used.set(u.exitId, (used.get(u.exitId) ?? 0) + 1);
      let best = ''; let bn = 0; for (const [k, v] of used) if (v > bn) { bn = v; best = k; }
      const e = this.map.entries.find((en) => en.id === best);
      if (e) {
        const socks = this.map.sockets.filter((s) => s.size === 'large' && !this.socketUsed(s.id));
        socks.sort((p, q) => Math.hypot(p.x - e.x, p.z - e.z) - Math.hypot(q.x - e.x, q.z - e.z));
        for (const s of socks) {
          if (this.routesOpenWith(barrierRect(s.x, s.z, 'large', s.rot)) && !this.units.some((u) => Math.hypot(u.x - s.x, u.z - s.z) < 3)) {
            this.aiBudget -= 250; this.addStructure('concrete', s); this.aiBarrierPlaced = true;
            this.emit({ type: 'info', text: 'Defence AI placed a concrete barrier', x: s.x, z: s.z });
            break;
          }
        }
      }
    }
  }

  inCamera(x: number, z: number): boolean {
    const r = this.cameraRadius();
    return this.cameras.some((c) => (c.x - x) ** 2 + (c.z - z) ** 2 < r * r);
  }

  private stepDetection(dt: number) {
    const delay = this.cameraSpec === 'fast' ? BALANCE.camera.fastDelay : BALANCE.camera.detectDelay;
    const defs = this.defenders();
    for (const a of this.attackers()) {
      if (this.inCamera(a.x, a.z)) { a.camSeen += dt; if (a.camSeen >= delay) a.detectedUntil = this.time + 4; } else a.camSeen = 0;
      const low = this.nav.lowSight[this.nav.idx(a.x, a.z)] === 1;
      for (const d of defs) {
        const sight = (BALANCE.units[d.kind] as { sight: number }).sight * (low ? 0.5 : 1);
        if (sight > 0 && (d.x - a.x) ** 2 + (d.z - a.z) ** 2 < sight * sight) { a.detectedUntil = this.time + 3; break; }
      }
    }
  }

  isDetected(a: Unit) { return a.detectedUntil >= this.time; }

  private responseRange(d: Unit, a: Unit) {
    let r = BALANCE.units.security.sight;
    if (this.securitySpec === 'mobile') r += BALANCE.upgrades.securitySpec.mobile.sightAdd;
    if (this.inCamera(a.x, a.z)) r *= BALANCE.camera.responseBoost;
    if (this.nav.lowSight[this.nav.idx(a.x, a.z)] === 1) r *= 0.6;
    return r;
  }

  private restrainTime(d: Unit, a: Unit) {
    let t = BALANCE.units.security.restrainTime * (BALANCE.units[a.kind] as { resist: number }).resist;
    if (this.securityTrained) t *= BALANCE.upgrades.securityTraining.restrainMul;
    if (this.securitySpec === 'fixed' && Math.hypot(d.x - d.home.x, d.z - d.home.z) < BALANCE.upgrades.securitySpec.fixed.leash + 2) t *= BALANCE.upgrades.securitySpec.fixed.restrainMul;
    if (this.perks.has('restrain') && this.side === 'defence') t *= 0.9;
    return t;
  }

  private stepDefender(u: Unit, dt: number) {
    u.stateT += dt;
    const sp = this.speedOf(u);
    if (u.kind === 'firefighter') { this.stepFirefighter(u, dt, sp); return; }
    switch (u.state) {
      case 'move': case 'return': {
        if (u.repathT > 5 || !u.path) this.setPath(u, u.goal ?? u.home);
        u.repathT += dt;
        if (this.follow(u, dt, sp)) { u.state = 'idle'; u.moving = false; }
        if (u.kind === 'security' && u.state === 'return') this.autoEngage(u);
        break;
      }
      case 'idle': {
        u.moving = false;
        if (u.kind === 'security') this.autoEngage(u);
        break;
      }
      case 'chase': {
        const t = this.unit(u.engage);
        u.chaseT += dt;
        if (!t || t.state === 'removed' || t.state === 'escaped' || t.state === 'escorted' || (t.restrainBy >= 0 && t.restrainBy !== u.id) || u.chaseT > 25) { this.goHome(u); break; }
        if (this.securitySpec === 'fixed' && Math.hypot(t.x - u.home.x, t.z - u.home.z) > BALANCE.upgrades.securitySpec.fixed.leash * 2.5) { this.goHome(u); break; }
        const d = Math.hypot(t.x - u.x, t.z - u.z);
        if (d < u.r + t.r + 0.45) {
          u.state = 'restrain'; u.stateT = 0; u.moving = false; u.facing = Math.atan2(t.x - u.x, t.z - u.z);
          t.restrainBy = u.id;
          if (t.state !== 'held') t.state = 'restrained';
          t.stateT = 0;
          break;
        }
        u.repathT += dt;
        if (u.repathT > 0.4) {
          if (this.nav.los(u, t, 'def')) { u.path = [{ x: u.x, z: u.z }, { x: t.x, z: t.z }]; u.pi = 1; u.repathT = 0; }
          else this.setPath(u, t);
        }
        this.follow(u, dt, sp);
        break;
      }
      case 'restrain': {
        const t = this.unit(u.engage);
        u.moving = false;
        if (!t || t.restrainBy !== u.id || t.state === 'removed' || t.state === 'escorted') { this.goHome(u); break; }
        t.restrainP += dt / this.restrainTime(u, t);
        if (t.restrainP >= 1) this.intercept(t, u);
        break;
      }
      case 'escort': {
        const t = this.unit(u.escortOf);
        if (!u.path) this.setPath(u, this.map.defenderSpawn);
        this.follow(u, dt, sp * 0.55);
        if (t) {
          // offender walks upright beside the officer
          const bx = u.x - Math.sin(u.facing) * 0.2 + Math.cos(u.facing) * 0.7, bz = u.z - Math.cos(u.facing) * 0.2 - Math.sin(u.facing) * 0.7;
          if (this.nav.walkable(bx, bz)) { t.x = bx; t.z = bz; }
          t.facing = u.facing; t.moving = u.moving;
        }
        if (u.stateT > 3.5) {
          if (t) { t.state = 'removed'; }
          u.escortOf = -1; this.goHome(u);
        }
        break;
      }
    }
  }

  private goHome(u: Unit) { u.engage = -1; u.state = 'return'; u.stateT = 0; this.setPath(u, u.home); }

  private releaseRestrain(u: Unit) {
    const t = this.unit(u.engage);
    if (t && t.restrainBy === u.id) { t.restrainBy = -1; if (t.state === 'restrained') { t.state = t.carrying > 0 ? 'extract' : 'approach'; this.setAttGoal(t); } }
  }

  private autoEngage(u: Unit) {
    let best: Unit | null = null; let bd = Infinity;
    for (const a of this.attackers()) {
      if (!this.isDetected(a)) continue;
      if (a.state === 'escorted' || a.state === 'restrained') continue;
      if (a.restrainBy >= 0) continue;
      if (this.units.some((o) => o !== u && o.kind === 'security' && o.engage === a.id && (o.state === 'chase' || o.state === 'restrain'))) continue;
      if (this.securitySpec === 'fixed' && Math.hypot(a.x - u.home.x, a.z - u.home.z) > BALANCE.upgrades.securitySpec.fixed.leash * 2) continue;
      const d = Math.hypot(a.x - u.x, a.z - u.z);
      // prefer loaded offenders: they are the ones causing permanent losses
      const score = d - (a.carrying > 0 ? 4 : 0) - (a.state === 'held' ? 3 : 0);
      if (d < this.responseRange(u, a) && score < bd) { bd = score; best = a; }
    }
    if (best) { u.state = 'chase'; u.engage = best.id; u.chaseT = 0; u.repathT = 99; }
  }

  intercept(a: Unit, by: Unit) {
    if (a.state === 'escorted' || a.state === 'removed') return;
    const amt = a.carrying + a.pending;
    if (amt > 0 && a.carryStore >= 0) {
      const s = this.stores[a.carryStore];
      s.reserved = Math.max(0, s.reserved - amt);
      if (a.carrying > 0) this.drops.push({ id: this.nextId++, x: a.x, z: a.z, amount: a.carrying, t: 0 });
      this.recovered += amt;
      this.emit({ type: 'recovered', text: `${amt} stock recovered for ${s.name}`, x: a.x, z: a.z, amount: amt });
    }
    a.carrying = 0; a.pending = 0;
    a.state = 'escorted'; a.stateT = 0; a.restrainBy = -1; a.heldBy = -1; a.moving = false;
    this.intercepted++;
    this.emit({ type: 'intercept', text: `${a.kind} intercepted`, x: a.x, z: a.z, side: 'def' });
    if (by.kind === 'security') { by.state = 'escort'; by.stateT = 0; by.escortOf = a.id; by.engage = -1; by.path = null; }
    else { // shield: offender is led away by itself
      a.stateT = 0; a.escortSolo = true;
    }
  }

  private stepShields(dt: number) {
    const st = BALANCE.units.shield;
    for (const s of this.defenders()) {
      if (s.kind !== 'shield') continue;
      const held = this.attackers().filter((a) => a.heldBy === s.id && a.state === 'held');
      for (const a of this.attackers()) {
        if (held.length >= st.holdMax) break;
        if (a.heldBy >= 0 || a.immuneT > this.time || a.state === 'held' || a.state === 'restrained' || a.state === 'escorted') continue;
        if (a.state === 'breach' || a.state === 'collect') continue;
        if ((a.x - s.x) ** 2 + (a.z - s.z) ** 2 < st.holdRadius ** 2) {
          a.heldBy = s.id; a.state = 'held'; a.holdT = 0; a.moving = false; held.push(a);
          a.facing = Math.atan2(s.x - a.x, s.z - a.z);
          s.facing = Math.atan2(a.x - s.x, a.z - s.z);
          this.emit({ type: 'held', text: 'Shield contact', x: a.x, z: a.z });
          a.detectedUntil = this.time + 6;
        }
      }
      for (const a of held) {
        a.holdT += dt;
        if (a.restrainBy < 0) a.restrainP += dt * st.restrainRate;
        if (a.restrainP >= 1) { this.intercept(a, s); continue; }
        if (a.holdT >= st.holdTime || s.state === 'move') {
          a.heldBy = -1; a.immuneT = this.time + 4; a.restrainP = Math.max(0, a.restrainP - 0.2);
          if (a.restrainBy < 0) { a.state = a.carrying > 0 ? 'extract' : 'approach'; this.setAttGoal(a); }
          else a.state = 'restrained';
        }
      }
    }
  }

  private stepFirefighter(u: Unit, dt: number, sp: number) {
    if (u.state === 'move' || u.state === 'return') {
      if (!u.path || u.repathT > 50) this.setPath(u, u.goal ?? u.home);
      if (this.follow(u, dt, sp)) u.state = 'idle';
    }
    if (u.state === 'idle' || u.state === 'return') {
      const fire = this.fires.filter((f) => !f.out).sort((a, b) => (a.store < 0 ? 1 : 0) - (b.store < 0 ? 1 : 0) || Math.hypot(a.x - u.x, a.z - u.z) - Math.hypot(b.x - u.x, b.z - u.z))[0];
      if (fire && Math.hypot(fire.x - u.x, fire.z - u.z) < 40) { u.fireId = fire.id; u.state = 'extinguish'; this.setPath(u, fire); }
    }
    if (u.state === 'extinguish') {
      const f = this.fires.find((ff) => ff.id === u.fireId);
      if (!f || f.out) { u.fireId = -1; this.goHome(u); return; }
      const d = Math.hypot(f.x - u.x, f.z - u.z);
      if (d > 2.6) { if (this.follow(u, dt, sp) || u.repathT > 50) this.setPath(u, f); }
      else {
        u.moving = false; u.facing = Math.atan2(f.x - u.x, f.z - u.z);
        f.progress += dt / BALANCE.units.firefighter.extinguishTime;
        if (f.progress >= 1) { f.out = true; this.emit({ type: 'extinguished', text: 'Fire extinguished', x: f.x, z: f.z }); }
      }
    }
  }

  private stepAttacker(u: Unit, dt: number) {
    u.stateT += dt;
    const sp = this.speedOf(u);
    switch (u.state) {
      case 'approach': {
        const s = this.stores[u.targetStore];
        if (this.available(s) <= 0) { this.reroute(u); break; }
        u.repathT += dt;
        if (u.repathT > 50 || !u.path) this.setAttGoal(u);
        this.maybeIgniteCar(u);
        if (this.tryStartThrow(u, dt)) break;
        if (this.follow(u, dt, sp)) {
          u.facing = Math.atan2(-this.map.stores[u.targetStore].normal.x, -this.map.stores[u.targetStore].normal.z);
          u.state = s.structure > 0 || s.boards > 0 ? 'breach' : 'collect'; u.stateT = 0;
          if (u.state === 'collect') this.beginCollect(u);
        }
        this.checkStuck(u, dt);
        break;
      }
      case 'throw': {
        u.moving = false;
        const a = u.aim!;
        u.facing = Math.atan2(a.x - u.x, a.z - u.z);
        if (!u.released && u.stateT >= BALANCE.throw.releaseAt) { u.released = true; this.release(u); }
        if (u.stateT >= BALANCE.throw.duration) { u.state = 'approach'; u.stateT = 0; u.aim = null; u.throwCd = BALANCE.throw.cooldown; u.path = null; }
        break;
      }
      case 'breach': {
        u.moving = false;
        const s = this.stores[u.targetStore];
        const rate = (BALANCE.units[u.kind] as { breakRate: number }).breakRate;
        if (s.boards > 0) {
          // boards absorb the attack first; the shutter is untouched until they are gone
          s.boards = Math.max(0, s.boards - rate * dt);
          if (s.boards <= 0) this.emit({ type: 'barrierBroken', text: `${s.name}: boards torn down`, x: s.door.x, z: s.door.z });
        } else if (s.structure > 0) {
          s.structure = Math.max(0, s.structure - rate * dt);
          if (s.structure <= 0) {
            this.emit({ type: 'breach', text: `${s.name} shutter breached`, x: s.door.x, z: s.door.z });
            if (u.kind === 'vandal' && this.rng.next() < BALANCE.fire.vandalIgniteChance) this.startFire(s.door.x, s.door.z - 0.0, s.idx, -1);
          }
        } else { u.state = 'collect'; u.stateT = 0; this.beginCollect(u); }
        break;
      }
      case 'collect': {
        u.moving = false;
        if (u.pending <= 0) { this.reroute(u); break; }
        if (u.stateT >= u.pending * BALANCE.collectTimePerStock + 0.6) {
          u.carrying = u.pending; u.pending = 0; u.state = 'extract'; u.stateT = 0;
          this.emit({ type: 'collect', text: `${u.kind} took ${u.carrying} stock`, x: u.x, z: u.z });
          this.setAttGoal(u);
        }
        break;
      }
      case 'extract': case 'flee': {
        u.repathT += dt;
        if (u.repathT > 50 || !u.path) this.setAttGoal(u);
        if (this.follow(u, dt, sp)) {
          const e = this.map.entries.find((en) => en.id === u.exitId)!;
          if (Math.hypot(e.x - u.x, e.z - u.z) < 2.5) this.escape(u);
          else this.setAttGoal(u);
        }
        this.checkStuck(u, dt);
        break;
      }
      case 'barrier': {
        u.moving = false;
        const b = this.barriers.find((bb) => bb.id === u.barrierId);
        if (!b || b.broken) { u.state = u.carrying > 0 ? 'extract' : (u.pending > 0 ? 'extract' : 'approach'); if (u.carrying === 0 && u.targetStore < 0) u.state = 'flee'; this.setAttGoal(u); break; }
        b.hp -= (BALANCE.units[u.kind] as { breakRate: number }).breakRate * dt * (u.kind === 'vandal' ? 1 : 0.8);
        if (b.hp <= 0) {
          b.hp = 0; b.broken = true; this.nav.setBarrier(b.id, b.rect, false);
          this.emit({ type: 'barrierBroken', text: 'Barrier knocked over', x: b.x, z: b.z });
          for (const o of this.units) o.repathT = 99;
        }
        break;
      }
      case 'held': case 'restrained': u.moving = false; break;
      case 'escorted': {
        u.moving = false;
        const solo = u.escortSolo;
        if (solo && u.stateT > 2.5) u.state = 'removed';
        if (!solo && !this.units.some((d) => d.escortOf === u.id)) { if (u.stateT > 3) u.state = 'removed'; }
        break;
      }
    }
  }

  private beginCollect(u: Unit) {
    const s = this.stores[u.targetStore];
    const amt = Math.min(u.capacity, this.available(s));
    u.pending = amt; u.carryStore = s.idx; s.reserved += amt;
  }

  private reroute(u: Unit) {
    // the target store is empty: retarget to another store (defence AI) or leave empty-handed
    if (u.pending > 0 || u.carrying > 0) { u.state = 'extract'; this.setAttGoal(u); return; }
    const others = this.stores.filter((s) => this.available(s) > 0);
    if (this.side === 'defence' && others.length) {
      others.sort((a, b) => Math.hypot(a.door.x - u.x, a.door.z - u.z) - Math.hypot(b.door.x - u.x, b.door.z - u.z));
      u.targetStore = others[0].idx; u.state = 'approach'; this.setAttGoal(u); return;
    }
    if (this.side === 'looters' && others.length && this.looterTarget >= 0 && this.available(this.stores[this.looterTarget]) > 0 && this.looterTarget !== u.targetStore) {
      u.targetStore = this.looterTarget; u.state = 'approach'; this.setAttGoal(u); return;
    }
    u.state = 'flee'; u.targetStore = -1; this.setAttGoal(u);
  }

  private checkStuck(u: Unit, dt: number) {
    u.stuckT += dt;
    if (u.stuckT < 4) return;
    const moved = Math.hypot(u.x - u.lastX, u.z - u.lastZ);
    u.lastX = u.x; u.lastZ = u.z; u.stuckT = 0;
    if (moved < 0.6) {
      u.totalStuck += 4;
      // sidestep then repath
      const a = this.rng.next() * Math.PI * 2;
      const nx = u.x + Math.cos(a) * 0.4, nz = u.z + Math.sin(a) * 0.4;
      if (this.nav.walkable(nx, nz)) { u.x = nx; u.z = nz; }
      this.setAttGoal(u);
      if (u.totalStuck > 40) { u.state = 'flee'; this.setAttGoal(u); }
    } else u.totalStuck = 0;
  }

  private escape(u: Unit) {
    if (u.carrying > 0 && u.carryStore >= 0) {
      const s = this.stores[u.carryStore];
      s.stock = Math.max(0, s.stock - u.carrying);
      s.reserved = Math.max(0, s.reserved - u.carrying);
      s.lost += u.carrying;
      this.extracted += u.carrying;
      if (this.side === 'looters') this.budget += u.carrying * BALANCE.looters.budgetPerExtractedStock;
      this.emit({ type: 'extract', text: `${u.carrying} stock extracted from ${s.name}`, x: u.x, z: u.z, amount: u.carrying, side: 'att' });
    }
    u.carrying = 0; u.state = 'escaped';
  }

  private maybeIgniteCar(u: Unit) {
    if (u.kind !== 'vandal' || this.fires.filter((f) => !f.out).length >= BALANCE.fire.max) return;
    this.map.props.forEach((p, i) => {
      if (!p.burnable || this.burnedProps.has(i)) return;
      if (Math.hypot(p.x - u.x, p.z - u.z) < 4 && this.rng.next() < 0.02) {
        this.burnedProps.add(i); this.startFire(p.x, p.z, -1, i);
      }
    });
  }

  // ------------------------------------------------------------------ neutral people
  private newNpc(role: NpcRole, x: number, z: number, store = -1): Npc {
    const q = this.nav.nearestWalkable(x, z, 4) ?? { x, z };
    const n: Npc = { id: this.nextId++, role, x: q.x, z: q.z, facing: 0, state: role === 'civilian' ? 'stroll' : 'idle', path: null, pi: 0, goal: null, moving: false, speed: 0, store, variant: Math.floor(this.npcRng.next() * 1e6), carrying: false, exit: '', t: 0 };
    this.npcs.push(n); return n;
  }
  private initNpcs() {
    this.map.stores.forEach((sd, i) => { const n = this.newNpc('shopkeeper', sd.front.x + sd.normal.x * 1.0 + sd.normal.z * 1.6, sd.front.z + sd.normal.z * 1.0 + sd.normal.x * 1.6, i); n.facing = Math.atan2(sd.normal.x, sd.normal.z); });
    const v = this.map.van; this.newNpc('helper', v.x - 2.2, v.z + 1.5);
  }
  /** nearest danger (attacker or fire) to a point */
  private danger(x: number, z: number): { x: number; z: number; d: number } | null {
    let best: { x: number; z: number; d: number } | null = null;
    for (const a of this.attackers()) { const d = Math.hypot(a.x - x, a.z - z); if (d < BALANCE.npc.fleeRadius && (!best || d < best.d)) best = { x: a.x, z: a.z, d }; }
    for (const f of this.fires) { if (f.out) continue; const d = Math.hypot(f.x - x, f.z - z); if (d < BALANCE.npc.fireRadius && (!best || d < best.d)) best = { x: f.x, z: f.z, d }; }
    return best;
  }
  /** exit that leads away from the danger */
  private safeExit(n: Npc, from: { x: number; z: number }) {
    const ex = this.map.entries.filter((e) => e.extract);
    ex.sort((a, b) => (Math.hypot(a.x - n.x, a.z - n.z) - Math.hypot(a.x - from.x, a.z - from.z) * 1.5) - (Math.hypot(b.x - n.x, b.z - n.z) - Math.hypot(b.x - from.x, b.z - from.z) * 1.5));
    return ex[0];
  }
  private npcGo(n: Npc, x: number, z: number) { n.goal = { x, z }; n.path = this.nav.findPath(n, n.goal, 'def'); n.pi = 1; }
  private stepNpcs(dt: number) {
    const N = BALANCE.npc;
    // ambient passers-by
    this.npcSpawnT -= dt;
    const civs = this.npcs.filter((n) => n.role === 'civilian' && n.state !== 'gone');
    if (this.npcSpawnT <= 0 && civs.length < this.maxCivilians) {
      this.npcSpawnT = N.spawnEvery;
      const sp = this.map.entries.filter((e) => e.spawn); const a = sp[this.npcRng.int(sp.length)];
      if (!this.danger(a.x, a.z)) { const n = this.newNpc('civilian', a.x, a.z); const b = sp.filter((e) => e !== a)[this.npcRng.int(Math.max(1, sp.length - 1))] ?? a; n.exit = b.id; this.npcGo(n, b.x, b.z); }
    }
    const fleeing: Npc[] = [];
    for (const n of this.npcs) {
      n.t += dt;
      const dz = this.danger(n.x, n.z);
      if (n.role !== 'helper' && dz && n.state !== 'flee') {
        const e = this.safeExit(n, dz); n.exit = e.id; n.state = 'flee'; this.npcGo(n, e.x, e.z);
        if (n.role === 'shopkeeper') n.carrying = true; // takes the till box along
      }
      if (n.state === 'flee') fleeing.push(n);
      if (n.role === 'shopkeeper' && n.state === 'gone' && this.phase === 'prep' && n.store >= 0 && !this.isBurning(n.store)) {
        // back at the shop once the street is calm
        const sd = this.map.stores[n.store]; const q = this.nav.nearestWalkable(sd.front.x + sd.normal.x * 1.0 + sd.normal.z * 1.6, sd.front.z + sd.normal.z * 1.0 + sd.normal.x * 1.6, 4);
        if (q) { n.x = q.x; n.z = q.z; n.state = 'idle'; n.carrying = false; n.facing = Math.atan2(sd.normal.x, sd.normal.z); }
      }
      if (n.state === 'gone' || n.state === 'idle') { n.moving = false; continue; }
      const sp = n.state === 'flee' ? N.runSpeed : n.role === 'helper' ? 2.6 : N.walkSpeed;
      n.moving = false; n.speed = 0;
      if (n.path && n.pi < n.path.length) {
        let budget = sp * dt;
        while (budget > 0 && n.pi < n.path.length) {
          const p = n.path[n.pi]; const dx = p.x - n.x, dzz = p.z - n.z; const d = Math.hypot(dx, dzz);
          if (d < 0.05) { n.pi++; continue; }
          const st = Math.min(d, budget); const nx = n.x + (dx / d) * st, nz = n.z + (dzz / d) * st;
          if (!this.nav.walkable(nx, nz)) { n.path = null; break; }
          n.x = nx; n.z = nz; n.facing = Math.atan2(dx, dzz); budget -= st; n.moving = true; n.speed = sp; if (st >= d - 1e-6) n.pi++;
        }
      } else if (n.role === 'helper') { n.state = n.state === 'guide' ? 'guide' : 'idle'; }
      else if (n.state === 'flee' || n.state === 'stroll') {
        const e = this.map.entries.find((en) => en.id === n.exit);
        if (!e || Math.hypot(e.x - n.x, e.z - n.z) < 2.5) n.state = 'gone'; else this.npcGo(n, e.x, e.z);
      }
    }
    // the helper (hi-vis vest) walks towards fleeing people and points them to the exit; returns to the van after
    const helper = this.npcs.find((n) => n.role === 'helper');
    if (helper) {
      const target = fleeing.sort((a, b) => Math.hypot(a.x - helper.x, a.z - helper.z) - Math.hypot(b.x - helper.x, b.z - helper.z))[0];
      if (target) {
        const d = Math.hypot(target.x - helper.x, target.z - helper.z);
        if (d > 3 && (!helper.goal || Math.hypot(helper.goal.x - target.x, helper.goal.z - target.z) > 2 || !helper.path)) { helper.state = 'stroll'; this.npcGo(helper, target.x, target.z); }
        else if (d <= 3) { helper.state = 'guide'; helper.path = null; const e = this.map.entries.find((en) => en.id === target.exit); if (e) helper.facing = Math.atan2(e.x - helper.x, e.z - helper.z); }
      } else if (helper.state === 'guide' || (helper.state === 'idle' && Math.hypot(helper.x - (this.map.van.x - 2.2), helper.z - (this.map.van.z + 1.5)) > 2)) {
        helper.state = 'stroll'; this.npcGo(helper, this.map.van.x - 2.2, this.map.van.z + 1.5);
      }
    }
    this.npcs = this.npcs.filter((n) => n.state !== 'gone' || n.role === 'shopkeeper');
  }

  // ------------------------------------------------------------------ throwing
  /** aim points a thrower may use: its target store (front) and unburnt marked burnable props */
  throwCandidates(u: Unit): ThrowTarget[] {
    const out: ThrowTarget[] = [];
    if (u.targetStore >= 0) {
      const s = this.stores[u.targetStore]; const sd = this.map.stores[u.targetStore];
      if (!this.isBurning(s.idx) && (s.structure > 0 || s.boards > 0)) out.push({ kind: 'store', idx: s.idx, x: sd.front.x + sd.normal.x * 0.5, z: sd.front.z + sd.normal.z * 0.5 });
    }
    this.map.props.forEach((p, i) => { if (p.burnable && !this.burnedProps.has(i) && !this.fires.some((f) => !f.out && f.prop === i)) out.push({ kind: 'prop', idx: i, x: p.x, z: p.z }); });
    return out;
  }

  /** height (m) of solid geometry at a point, for arc collision: buildings and walls */
  solidHeightAt(x: number, z: number): number {
    let h = 0;
    for (const b of this.map.buildings) if (x > b.rect.x0 && x < b.rect.x1 && z > b.rect.z0 && z < b.rect.z1 && !(b.passages ?? []).some((p) => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1)) h = Math.max(h, b.height + 3);
    for (const w of this.map.walls) if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) h = Math.max(h, w.h ?? 2.6);
    return h;
  }

  private arcPoint(p: { sx: number; sy: number; sz: number; tx: number; tz: number; apex: number }, s: number) {
    return { x: p.sx + (p.tx - p.sx) * s, y: p.sy * (1 - s) + 0.25 * s + 4 * p.apex * s * (1 - s), z: p.sz + (p.tz - p.sz) * s };
  }

  /** true if the arc from the unit's hand to the aim point does not hit a building first */
  arcClear(x: number, z: number, a: { x: number; z: number }): boolean {
    const arc = { sx: x, sy: BALANCE.throw.handHeight, sz: z, tx: a.x, tz: a.z, apex: BALANCE.throw.apex };
    for (let i = 1; i < 40; i++) { const q = this.arcPoint(arc, i / 40); if (q.y < this.solidHeightAt(q.x, q.z)) return false; }
    return true;
  }

  private tryStartThrow(u: Unit, dt: number): boolean {
    if (u.kind !== 'thrower' || u.throwsLeft <= 0) return false;
    u.throwCd -= dt;
    if (u.throwCd > 0) return false;
    if (this.projectiles.length >= this.maxProjectiles) return false;
    const T = BALANCE.throw;
    for (const c of this.throwCandidates(u)) {
      const d = Math.hypot(c.x - u.x, c.z - u.z);
      if (d < T.minRange || d > T.range) continue;
      if (!this.arcClear(u.x, u.z, c)) continue;
      u.aim = c; u.state = 'throw'; u.stateT = 0; u.released = false; u.moving = false; u.throwsLeft--;
      return true;
    }
    u.throwCd = 0.5; // re-check twice per second
    return false;
  }

  /** the single release event of a throw: the game object leaves the hand socket */
  private release(u: Unit) {
    const a = u.aim; if (!a) return;
    if (this.projectiles.length >= this.maxProjectiles) return;
    const T = BALANCE.throw;
    const hx = u.x + Math.sin(u.facing) * 0.3, hz = u.z + Math.cos(u.facing) * 0.3;
    const dist = Math.hypot(a.x - hx, a.z - hz);
    const p: Projectile = { id: this.nextId++, owner: u.id, x: hx, y: T.handHeight, z: hz, sx: hx, sy: T.handHeight, sz: hz, tx: a.x, tz: a.z, t: 0, T: Math.max(0.35, dist / T.flightSpeed), apex: T.apex, target: a, spin: 7 + this.rng.next() * 5 };
    this.projectiles.push(p);
    this.emit({ type: 'release', text: 'Throw', x: hx, z: hz, id: p.id });
  }

  /** test/debug helper: launch a projectile from any point towards any aim point */
  launchProjectile(x: number, z: number, aim: ThrowTarget): Projectile | null {
    if (this.projectiles.length >= this.maxProjectiles) return null;
    const T = BALANCE.throw; const dist = Math.hypot(aim.x - x, aim.z - z);
    const p: Projectile = { id: this.nextId++, owner: -1, x, y: T.handHeight, z, sx: x, sy: T.handHeight, sz: z, tx: aim.x, tz: aim.z, t: 0, T: Math.max(0.35, dist / T.flightSpeed), apex: T.apex, target: aim, spin: 8 };
    this.projectiles.push(p); return p;
  }

  private stepProjectiles(dt: number) {
    const keep: Projectile[] = [];
    for (const p of this.projectiles) {
      const s0 = p.t / p.T; p.t += dt; const s1 = Math.min(1, p.t / p.T);
      // collision along the segment travelled this tick
      let hit: { x: number; y: number; z: number } | null = null; const N = 6;
      for (let i = 1; i <= N && !hit; i++) {
        const q = this.arcPoint(p, s0 + ((s1 - s0) * i) / N);
        if (q.y < this.solidHeightAt(q.x, q.z)) { const b = this.arcPoint(p, s0 + ((s1 - s0) * (i - 1)) / N); hit = b; }
      }
      const q = this.arcPoint(p, s1); p.x = q.x; p.y = q.y; p.z = q.z;
      if (hit) { this.impact(p, hit.x, hit.z, true); continue; }
      if (s1 >= 1) { this.impact(p, p.tx, p.tz, false); continue; }
      keep.push(p);
    }
    this.projectiles = keep;
  }

  /** exactly one impact per projectile; consequences follow the existing fire rules (no stacking) */
  private impact(p: Projectile, x: number, z: number, blocked: boolean) {
    const R = BALANCE.throw.igniteRadius;
    this.emit({ type: 'impact', text: blocked ? 'Hit a wall' : 'Impact', x, z, id: p.id });
    // the intended target if it was reached, otherwise any marked burnable object near the impact point
    let store = -1, prop = -1;
    const near = (tx: number, tz: number) => Math.hypot(tx - x, tz - z) <= R;
    if (!blocked && p.target.kind === 'store') store = p.target.idx;
    else if (!blocked && p.target.kind === 'prop') prop = p.target.idx;
    else {
      this.map.stores.forEach((sd, i) => { if (store < 0 && near(sd.front.x + sd.normal.x * 0.5, sd.front.z + sd.normal.z * 0.5)) store = i; });
      if (store < 0) this.map.props.forEach((pp, i) => { if (prop < 0 && pp.burnable && near(pp.x, pp.z)) prop = i; });
    }
    if (store >= 0) { const sd = this.map.stores[store]; this.startFire(sd.front.x + sd.normal.x * 0.6, sd.front.z + sd.normal.z * 0.6, store, -1); }
    else if (prop >= 0) { if (!this.burnedProps.has(prop) && this.startFire(this.map.props[prop].x, this.map.props[prop].z, -1, prop)) this.burnedProps.add(prop); }
    else if (!blocked && this.nav.walkable(x, z)) this.startFire(x, z, -1, -1);
  }

  /** returns false when the fire cap or an existing fire on the same object prevents a new one (no stacking) */
  startFire(x: number, z: number, store: number, prop: number): boolean {
    if (this.fires.filter((f) => !f.out).length >= BALANCE.fire.max) return false;
    if (prop >= 0 && this.fires.some((f) => !f.out && f.prop === prop)) return false;
    if (store >= 0 && this.fires.some((f) => !f.out && f.store === store)) return false;
    const sd = store >= 0 ? this.map.stores[store] : null;
    const fx = sd ? x - sd.normal.x * 0.2 : x, fz = sd ? z - sd.normal.z * 0.2 : z;
    this.fires.push({ id: this.nextId++, x: fx, z: fz, store, prop, progress: 0, out: false, t: 0, ttl: store < 0 && prop < 0 ? BALANCE.fire.groundBurnSec : -1 });
    this.emit({ type: 'fire', text: store >= 0 ? `Fire at ${this.stores[store].name}` : prop >= 0 ? 'Vehicle fire' : 'Small fire on the street', x, z });
    return true;
  }

  isBurning(store: number) { return this.fires.some((f) => !f.out && f.store === store); }

  private stepFires(dt: number) {
    for (const f of this.fires) {
      if (f.out) continue;
      f.t += dt;
      if (f.ttl >= 0 && f.t >= f.ttl) { f.out = true; continue; }
      if (f.store >= 0) {
        const s = this.stores[f.store];
        // fire damages the boards first, then the shopfront; it never touches stock
        const d = BALANCE.fire.storeDamagePerSec * dt;
        if (s.boards > 0) s.boards = Math.max(0, s.boards - d);
        else if (s.structure > 0) s.structure = Math.max(0, s.structure - d);
        if (f.t >= BALANCE.fire.scorchAfterSec) s.scorched = true;
      }
    }
    this.fires = this.fires.filter((f) => !f.out || f.t < 0); // keep only active fires
  }

  private stepTruck(dt: number) {
    const t = this.truck; const sup = this.map.supply;
    if (!t || !sup || !t.active || t.done) return;
    if (t.waitT > 0) { t.waitT -= dt; return; }
    const target = sup.route[t.seg + 1];
    if (!target) { t.done = true; t.active = false; return; }
    const dx = target.x - t.x, dz = target.z - t.z; const d = Math.hypot(dx, dz);
    // cannot pass through people: stop if anyone stands in front
    const fx = dx / (d || 1), fz = dz / (d || 1);
    t.blocked = this.units.some((u) => { const rx = u.x - t.x, rz = u.z - t.z; const along = rx * fx + rz * fz; const side = Math.abs(rx * fz - rz * fx); return along > 0 && along < 4.2 && side < 1.6; });
    if (t.blocked) return;
    const step = BALANCE.supplyTruck.speed * dt;
    t.facing = Math.atan2(dx, dz);
    if (d <= step) {
      t.x = target.x; t.z = target.z; t.seg++;
      if (t.seg === sup.loadIndex && !t.rewarded) {
        t.rewarded = true; t.waitT = 4;
        if (this.side === 'defence') this.budget += BALANCE.supplyTruck.reward; else this.aiBudget += BALANCE.supplyTruck.reward;
        this.emit({ type: 'supply', text: `Supply delivered: +${BALANCE.supplyTruck.reward} budget`, x: t.x, z: t.z, amount: BALANCE.supplyTruck.reward });
      }
    } else { t.x += fx * step; t.z += fz * step; }
  }

  private separate() {
    const us = this.units;
    // the supply truck is a solid moving body: nudge people sideways out of its footprint
    const t = this.truck;
    if (t && t.active && !t.done) {
      const fx = Math.sin(t.facing), fz = Math.cos(t.facing);
      for (const u of us) {
        const rx = u.x - t.x, rz = u.z - t.z; const along = rx * fx + rz * fz; const side = rx * fz - rz * fx;
        if (Math.abs(along) < 3.2 && Math.abs(side) < 1.6) {
          const push = (1.6 - Math.abs(side)) * Math.sign(side || 1);
          const nx = u.x + fz * push, nz = u.z - fx * push;
          if (this.nav.walkable(nx, nz)) { u.x = nx; u.z = nz; }
        }
      }
    }
    for (let i = 0; i < us.length; i++) {
      const a = us[i];
      if (a.state === 'escorted') continue;
      for (let j = i + 1; j < us.length; j++) {
        const b = us[j];
        if (b.state === 'escorted') continue;
        if ((a.escortOf === b.id) || (b.escortOf === a.id)) continue;
        const dx = b.x - a.x, dz = b.z - a.z; const d2 = dx * dx + dz * dz; const rr = (a.r + b.r) * 0.9;
        if (d2 >= rr * rr || d2 < 1e-6) continue;
        const d = Math.sqrt(d2); const push = (rr - d) / 2; const nx = dx / d, nz = dz / d;
        const aFixed = !a.moving, bFixed = !b.moving;
        const pa = aFixed && !bFixed ? 0 : bFixed && !aFixed ? 2 : 1;
        const ax = a.x - nx * push * pa * 0.5 * 1, az = a.z - nz * push * pa * 0.5;
        const bx = b.x + nx * push * (2 - pa) * 0.5, bz = b.z + nz * push * (2 - pa) * 0.5;
        if (pa > 0 && this.nav.walkable(ax, az)) { a.x = ax; a.z = az; }
        if (pa < 2 && this.nav.walkable(bx, bz)) { b.x = bx; b.z = bz; }
      }
    }
  }

  private checkEnd() {
    if (this.side === 'defence') {
      const empty = this.stores.filter((s) => s.stock <= 0).length;
      if (empty >= this.stores.length - BALANCE.defence.storesNeededToWin + 1) {
        this.finish(false, 'District lost', `${empty} stores lost all stock.`);
      } else if (this.wavesCleared >= BALANCE.defence.waves && this.phase === 'prep') {
        this.finish(true, 'District held', `All ${BALANCE.defence.waves} waves repelled with ${this.storesWithStock()} stores holding stock.`);
      }
    } else {
      if (this.extracted >= BALANCE.looters.targetStock) this.finish(true, 'Objective complete', `${this.extracted} stock extracted in ${Math.floor(this.time / 60)}:${String(Math.floor(this.time % 60)).padStart(2, '0')}.`);
      else if (this.timeLeft <= 0) this.finish(false, 'Time expired', `Only ${this.extracted} / ${BALANCE.looters.targetStock} stock extracted.`);
      else {
        const minCost = Math.min(...Object.values(BALANCE.looters.costs));
        if (this.attackers().length === 0 && this.squad.length === 0 && this.dispatchQueue.length === 0 && this.budget < minCost) {
          this.finish(false, 'No units left', `No active units and not enough budget to recruit. ${this.extracted} / ${BALANCE.looters.targetStock} extracted.`);
        }
      }
    }
  }

  private finish(won: boolean, title: string, detail: string) {
    this.phase = won ? 'won' : 'lost';
    const research = won ? BALANCE.research.winPoints : BALANCE.research.lossPoints;
    this.result = { title, detail, storesHeld: this.storesWithStock(), extracted: this.extracted, research };
    this.emit({ type: won ? 'won' : 'lost', text: title });
  }
}
