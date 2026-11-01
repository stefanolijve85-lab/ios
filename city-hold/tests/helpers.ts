import { Game } from '../src/sim/game';
import type { MapDef } from '../src/maps/types';

export function run(g: Game, seconds: number, onTick?: (g: Game) => void) {
  const dt = 1 / 30;
  for (let t = 0; t < seconds && !g.over; t += dt) { g.step(dt); onTick?.(g); }
}

/** a simple scripted defence player: buys teams, posts them at stores, upgrades shutters */
export function autoDefence(g: Game) {
  const m = g.map;
  let posted = 0;
  const post = () => {
    for (const u of g.defenders()) {
      if (u.kind !== 'security' && u.kind !== 'shield') continue;
      if ((u as any)._posted) continue;
      const s = g.stores[posted % g.stores.length]; const sd = m.stores[s.idx];
      const dist = u.kind === 'shield' ? 2.2 : 4 + (posted % 2) * 2;
      g.moveUnits([u.id], s.door.x + sd.normal.x * dist, s.door.z + sd.normal.z * dist);
      (u as any)._posted = true; posted++;
    }
  };
  return (gg: Game) => {
    if (gg.phase !== 'prep') return;
    while (gg.budget >= 250 && gg.defenders().filter((d) => d.kind === 'security').length < 6) if (!gg.buyUnit('security').ok) break;
    if (gg.budget >= 400 && gg.defenders().filter((d) => d.kind === 'shield').length < 1) gg.buyUnit('shield');
    if (gg.budget >= 200 && gg.cameras.length < 1) { const s = m.sockets.find((so) => so.size === 'small' && !gg.socketUsed(so.id)); if (s) gg.place('camera', s.id); }
    if (gg.budget >= 250 && !gg.securityTrained) gg.upgradeSecurity();
    for (const s of gg.stores) if (gg.budget >= 300 && s.shutterLevel === 1) gg.upgradeShutter(s.idx);
    post();
    gg.startWave();
  };
}

export function autoLooter(g: Game, opts: { route?: string; target?: number } = {}) {
  return (gg: Game) => {
    if (gg.attackers().length + gg.dispatchQueue.length > 0) return;
    // pick the store with the fewest defenders nearby, and the closest route to it
    const guard = (i: number) => gg.defenders().filter((d) => Math.hypot(d.x - gg.stores[i].door.x, d.z - gg.stores[i].door.z) < 8).length;
    const target = opts.target ?? gg.stores.filter((s) => s.stock > 0).map((s) => s.idx).sort((a, b) => guard(a) - guard(b))[0] ?? 0;
    gg.setLooterTarget(target);
    const door = gg.stores[target].door;
    const route = opts.route ?? gg.map.entries.filter((e) => e.spawn).sort((a, b) => Math.hypot(a.x - door.x, a.z - door.z) - Math.hypot(b.x - door.x, b.z - door.z))[0].id;
    gg.setLooterRoute(route);
    while (gg.budget >= 150 && gg.squad.length < 6) if (!gg.recruit(gg.squad.length % 3 === 2 ? 'runner' : 'carrier').ok) break;
    if (gg.squad.length === 0 && gg.budget >= 100) gg.recruit('runner');
    if (gg.squad.length) gg.dispatch();
  };
}

export function mapReachability(map: MapDef) {
  const g = new Game(map, 'defence');
  const res: string[] = [];
  for (const e of map.entries) for (const s of g.stores) {
    if (e.spawn && !g.nav.findPath({ x: e.x, z: e.z }, s.door, 'solid')) res.push(`spawn ${e.id} -> ${s.name}`);
    if (e.extract && !g.nav.findPath(s.door, { x: e.x, z: e.z }, 'solid')) res.push(`${s.name} -> exit ${e.id}`);
  }
  return res;
}
