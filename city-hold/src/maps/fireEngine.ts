import type { MapDef, Vec2 } from './types';

/** where the fire engine parks: the map's own spot, or behind the staging van in its lane. rot in degrees, nose to +z at 0 */
/** how far back along its lane the engine starts its drive-in (far enough to come from beyond the play area) */
export const FIRE_ENGINE_RUN = 42;
export function fireEnginePark(map: MapDef): { x: number; z: number; rot: number } {
  let p: { x: number; z: number; rot: number };
  if (map.fireEngine) p = { ...map.fireEngine };
  else { const v = map.van; const r = (v.rot * Math.PI) / 180; p = { x: v.x - Math.sin(r) * 7.6, z: v.z - Math.cos(r) * 7.6, rot: v.rot }; }
  // it drives in along its lane from the side of the map: face the way that puts the start outside the play area
  const r = (p.rot * Math.PI) / 180; const sx = p.x - Math.sin(r) * FIRE_ENGINE_RUN, sz = p.z - Math.cos(r) * FIRE_ENGINE_RUN;
  const b = map.bounds; const inside = sx > b.x0 && sx < b.x1 && sz > b.z0 && sz < b.z1;
  if (inside) p.rot = (p.rot + 180) % 360;
  return p;
}

/** where a firefighter waits by the engine: beside its pump panel (local +x side, a little forward) */
export function fireStation(map: MapDef): Vec2 {
  const p = fireEnginePark(map); const a = (p.rot * Math.PI) / 180; const lx = 2.6, lz = 1.0;
  return { x: p.x + lx * Math.cos(a) + lz * Math.sin(a), z: p.z - lx * Math.sin(a) + lz * Math.cos(a) };
}
