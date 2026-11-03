import type { MapDef, Vec2 } from './types';

/** where the fire engine parks: the map's own spot, or behind the staging van in its lane. rot in degrees, nose to +z at 0 */
export function fireEnginePark(map: MapDef): { x: number; z: number; rot: number } {
  if (map.fireEngine) return map.fireEngine;
  const v = map.van; const r = (v.rot * Math.PI) / 180;
  return { x: v.x - Math.sin(r) * 7.6, z: v.z - Math.cos(r) * 7.6, rot: v.rot };
}

/** where a firefighter waits by the engine: beside its pump panel (local +x side, a little forward) */
export function fireStation(map: MapDef): Vec2 {
  const p = fireEnginePark(map); const a = (p.rot * Math.PI) / 180; const lx = 2.6, lz = 1.0;
  return { x: p.x + lx * Math.cos(a) + lz * Math.sin(a), z: p.z - lx * Math.sin(a) + lz * Math.cos(a) };
}
