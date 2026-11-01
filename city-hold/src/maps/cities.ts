import type { MapDef, PropDef } from './types';

// Five further districts built on the shared systems. Geometry is a fictional layout derived from the clean
// reference paintings (21-25); each has its own navigation, entrances, sockets, AI routes and extraction points.

const lamps = (pts: [number, number][]): PropDef[] => pts.map(([x, z]) => ({ type: 'lamp', x, z, collide: true, r: 0.25 }));
const trees = (pts: [number, number][], type: 'tree' | 'palm' = 'tree'): PropDef[] => pts.map(([x, z]) => ({ type, x, z, collide: true, r: type === 'palm' ? 0.5 : 0.9 }));
const planters = (pts: [number, number][]): PropDef[] => pts.map(([x, z]) => ({ type: 'planter', x, z, collide: true, r: 0.8 }));

/** Amsterdam: an impassable canal splits the district; only two bridges connect the banks. Shops on the far bank. */
export const AMSTERDAM: MapDef = {
  id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', district: 'Canal quarter',
  refImage: 'ui/21_amsterdam_canals.jpg', damageImage: 'ui/32_amsterdam_disorder.jpg',
  bounds: { x0: -32, z0: -30, x1: 32, z1: 24 }, ground: 'brick',
  buildings: [
    { rect: { x0: -44, z0: -42, x1: 44, z1: -15 }, height: 15, style: 'canal' },
    { rect: { x0: -44, z0: 15, x1: -18, z1: 34 }, height: 12, style: 'canal', fadeable: true },
    { rect: { x0: 18, z0: 15, x1: 44, z1: 34 }, height: 12, style: 'canal', fadeable: true },
  ],
  // quay railings with gaps at the two bridges
  walls: [
    { x0: -40, z0: -4.4, x1: -16.2, z1: -4.0, h: 1.0 }, { x0: -10.8, z0: -4.4, x1: 10.8, z1: -4.0, h: 1.0 }, { x0: 16.2, z0: -4.4, x1: 40, z1: -4.0, h: 1.0 },
    { x0: -40, z0: 4.0, x1: -16.2, z1: 4.4, h: 1.0 }, { x0: -10.8, z0: 4.0, x1: 10.8, z1: 4.4, h: 1.0 }, { x0: 16.2, z0: 4.0, x1: 40, z1: 4.4, h: 1.0 },
    // bridge parapets
    { x0: -16.2, z0: -4.4, x1: -15.9, z1: 4.4, h: 1.0 }, { x0: -11.1, z0: -4.4, x1: -10.8, z1: 4.4, h: 1.0 },
    { x0: 10.8, z0: -4.4, x1: 11.1, z1: 4.4, h: 1.0 }, { x0: 15.9, z0: -4.4, x1: 16.2, z1: 4.4, h: 1.0 },
  ],
  water: [{ x0: -40, z0: -4, x1: 40, z1: 4 }],
  bridges: [{ x0: -15.9, z0: -4.6, x1: -11.1, z1: 4.6 }, { x0: 11.1, z0: -4.6, x1: 15.9, z1: 4.6 }],
  arcades: [], islands: [],
  props: [
    ...lamps([[-16.5, -6], [-10.5, -6], [10.5, -6], [16.5, -6], [-20, 7], [20, 7], [0, 14]]),
    ...trees([[-26, 8], [-4, 8], [4, 8], [26, 8], [-24, -9], [24, -12]]),
    { type: 'bench', x: -8, z: 9, collide: true, r: 0.8 }, { type: 'bench', x: 8, z: 9, collide: true, r: 0.8 },
    { type: 'kiosk', x: -12, z: 17, collide: true, r: 1.3 },
    { type: 'car', x: 6, z: -9, rot: 0, collide: true, burnable: true },
  ],
  stores: [
    { name: 'Phones', kind: 'phones', color: 0x23345a, front: { x: -18, z: -15 }, normal: { x: 0, z: 1 }, width: 6 },
    { name: 'Jewellery', kind: 'jewellery', color: 0x6a2232, front: { x: -3, z: -15 }, normal: { x: 0, z: 1 }, width: 6 },
    { name: 'Fashion', kind: 'fashion', color: 0x2c5a3a, front: { x: 12, z: -15 }, normal: { x: 0, z: 1 }, width: 6 },
  ],
  entries: [
    { id: 'w', name: 'West quay', x: -31, z: 10, spawn: true, extract: true },
    { id: 's', name: 'South square', x: 0, z: 23, spawn: true, extract: true },
    { id: 'e', name: 'East quay', x: 31, z: 10, spawn: true, extract: true },
  ],
  sockets: [
    { id: 'p1', x: -13.5, z: 7.5, size: 'small', rot: 0 }, { id: 'p2', x: 13.5, z: 7.5, size: 'small', rot: 0 },
    { id: 'p3', x: -13.5, z: -7.5, size: 'small', rot: 0 }, { id: 'p4', x: 13.5, z: -7.5, size: 'small', rot: 0 },
    { id: 'p5', x: -10, z: -10, size: 'small', rot: 0 }, { id: 'p6', x: 4, z: -11, size: 'small', rot: 0 },
    { id: 'p7', x: 0, z: 11, size: 'small', rot: 0 }, { id: 'p8', x: -22, z: -10, size: 'small', rot: 0 },
    { id: 'L1', x: -13.5, z: 0, size: 'large', rot: 0 }, { id: 'L2', x: 13.5, z: 0, size: 'large', rot: 0 },
    { id: 'L3', x: 0, z: 18, size: 'large', rot: 0 },
  ],
  van: { x: 26, z: -10, rot: 90 }, defenderSpawn: { x: 21, z: -8 },
  lowSight: [], camera: { x: 0, z: -3, dist: 54 }, playable: true,
  notes: 'Canal is impassable; only the two bridges connect the banks. Blocking both bridges is refused.',
};

/** London: high street with a covered shopping passage and a marked underground stair entry. */
export const LONDON: MapDef = {
  id: 'london', city: 'London', country: 'United Kingdom', district: 'High street',
  refImage: 'ui/22_london_high_street.jpg', damageImage: 'ui/33_london_disorder.jpg',
  bounds: { x0: -32, z0: -34, x1: 32, z1: 24 }, ground: 'stone',
  buildings: [
    { rect: { x0: -44, z0: -46, x1: 8, z1: -12 }, height: 15, style: 'brick' },
    { rect: { x0: 8, z0: -28, x1: 20, z1: -12 }, height: 13, style: 'brick', passages: [{ x0: 12, z0: -28, x1: 16, z1: -12 }] },
    { rect: { x0: 20, z0: -46, x1: 44, z1: -6 }, height: 16, style: 'brick' },
    { rect: { x0: 8, z0: 8, x1: 44, z1: 34 }, height: 13, style: 'brick', fadeable: true },
    { rect: { x0: -44, z0: 14, x1: -34, z1: 34 }, height: 12, style: 'brick', fadeable: true },
  ],
  walls: [
    // back lane walls north of the passage
    { x0: 7.6, z0: -46, x1: 8, z1: -28 }, { x0: 20, z0: -46, x1: 20.4, z1: -28 },
    // underground stairwell railings (open to the north)
    { x0: -8.3, z0: 10, x1: -8, z1: 15.3, h: 1.0 }, { x0: -4, z0: 10, x1: -3.7, z1: 15.3, h: 1.0 }, { x0: -8.3, z0: 15, x1: -3.7, z1: 15.3, h: 1.0 },
    // canal railing
    { x0: -34, z0: 15.6, x1: -14, z1: 16, h: 1.0 }, { x0: -14.4, z0: 15.6, x1: -14, z1: 30, h: 1.0 },
  ],
  water: [{ x0: -44, z0: 16, x1: -14.4, z1: 34 }],
  bridges: [], arcades: [], islands: [],
  props: [
    ...lamps([[-24, -9], [-6, -9], [5, -9], [24, -2], [-16, 8], [2, 12]]),
    ...trees([[-28, 4], [-12, 2], [4, 2]]),
    { type: 'phonebox', x: -2, z: -9.6, collide: true, r: 0.6 },
    { type: 'bench', x: -20, z: 6, collide: true, r: 0.8 },
    { type: 'car', x: 26, z: 4.6, rot: 0, collide: true, burnable: true },
  ],
  stores: [
    { name: 'Department', kind: 'department', color: 0x2a4a3a, front: { x: -24, z: -12 }, normal: { x: 0, z: 1 }, width: 7 },
    { name: 'Phones', kind: 'phones', color: 0x24324e, front: { x: -12, z: -12 }, normal: { x: 0, z: 1 }, width: 6 },
    { name: 'Fashion', kind: 'fashion', color: 0x5a2a2a, front: { x: 0, z: -12 }, normal: { x: 0, z: 1 }, width: 6 },
  ],
  entries: [
    { id: 'tube', name: 'Underground stairs', x: -6, z: 13.5, spawn: true, extract: true, marker: 'stairs' },
    { id: 'arc', name: 'Shopping passage', x: 14, z: -33, spawn: true, extract: true },
    { id: 'e', name: 'East street', x: 31, z: 1, spawn: true, extract: true },
    { id: 'w', name: 'West street', x: -31, z: -2, spawn: true, extract: true },
  ],
  sockets: [
    { id: 'p1', x: -18, z: -7, size: 'small', rot: 0 }, { id: 'p2', x: -6, z: -6, size: 'small', rot: 0 },
    { id: 'p3', x: 14, z: -8, size: 'small', rot: 0 }, { id: 'p4', x: -6, z: 7.6, size: 'small', rot: 0 },
    { id: 'p5', x: 6, z: -3, size: 'small', rot: 90 }, { id: 'p6', x: -26, z: 0, size: 'small', rot: 90 },
    { id: 'L1', x: 14, z: -10, size: 'large', rot: 0 }, { id: 'L2', x: 19, z: 1, size: 'large', rot: 90 }, { id: 'L3', x: -27, z: -2, size: 'large', rot: 90 },
  ],
  van: { x: 26, z: 0.5, rot: 90 }, defenderSpawn: { x: 21, z: 2 },
  lowSight: [{ x0: 12, z0: -28, x1: 16, z1: -12 }], camera: { x: -2, z: -6, dist: 54 }, playable: true,
  notes: 'Two surface streets plus the covered passage give separate approaches; the underground stairs are a marked spawn.',
};

/** Milan: open piazza and a covered arcade on the right; columns are obstacles, sight is reduced underneath. */
const arcadeCols = Array.from({ length: 12 }, (_, i) => ({ x: 18.6, z: -28 + i * 4, r: 0.4 }));
export const MILAN: MapDef = {
  id: 'milan', city: 'Milan', country: 'Italy', district: 'Piazza and arcade',
  refImage: 'ui/23_milan_arcade.jpg', damageImage: 'ui/34_milan_disorder.jpg',
  bounds: { x0: -32, z0: -30, x1: 32, z1: 24 }, ground: 'plaza',
  buildings: [
    { rect: { x0: -44, z0: -44, x1: 18, z1: -14 }, height: 17, style: 'italian' },
    { rect: { x0: 26, z0: -44, x1: 44, z1: 34 }, height: 17, style: 'italian' },
    { rect: { x0: -44, z0: -14, x1: -26, z1: 10 }, height: 15, style: 'italian' },
    { rect: { x0: -44, z0: 16, x1: -6, z1: 34 }, height: 12, style: 'italian', fadeable: true },
    { rect: { x0: 6, z0: 16, x1: 18, z1: 34 }, height: 12, style: 'italian', fadeable: true },
  ],
  walls: [{ x0: 17.6, z0: 16, x1: 18, z1: 34 }],
  water: [], bridges: [],
  arcades: [{ rect: { x0: 18.2, z0: -30, x1: 26, z1: 16 }, height: 6, columns: arcadeCols }],
  islands: [],
  props: [
    ...planters([[-14, -2], [-2, -2], [10, -2], [-14, 8], [10, 8]]),
    ...lamps([[-20, -10], [12, -10], [-20, 12], [0, 12]]),
    { type: 'bench', x: -6, z: 6, collide: true, r: 0.8 },
  ],
  stores: [
    { name: 'Jewellery', kind: 'jewellery', color: 0x5a1e28, front: { x: -14, z: -14 }, normal: { x: 0, z: 1 }, width: 7 },
    { name: 'Fashion', kind: 'fashion', color: 0x1d4a3a, front: { x: 2, z: -14 }, normal: { x: 0, z: 1 }, width: 7 },
    { name: 'Electronics', kind: 'electronics', color: 0x1c2a4e, front: { x: 26, z: -4 }, normal: { x: -1, z: 0 }, width: 6 },
  ],
  entries: [
    { id: 'arc', name: 'Arcade north', x: 22, z: -29, spawn: true, extract: true },
    { id: 'w', name: 'West street', x: -31, z: 13, spawn: true, extract: true },
    { id: 's', name: 'South steps', x: 0, z: 23, spawn: true, extract: true },
  ],
  sockets: [
    { id: 'p1', x: -8, z: -8, size: 'small', rot: 0 }, { id: 'p2', x: 8, z: -8, size: 'small', rot: 0 },
    { id: 'p3', x: 22, z: 4, size: 'small', rot: 90 }, { id: 'p4', x: 22, z: -18, size: 'small', rot: 90 },
    { id: 'p5', x: -4, z: 2, size: 'small', rot: 0 }, { id: 'p6', x: 14, z: 2, size: 'small', rot: 90 },
    { id: 'L1', x: 22, z: -24, size: 'large', rot: 0 }, { id: 'L2', x: 0, z: 18, size: 'large', rot: 0 }, { id: 'L3', x: -24, z: 13, size: 'large', rot: 90 },
  ],
  van: { x: -20, z: 2, rot: 0 }, defenderSpawn: { x: -17, z: 3 },
  lowSight: [{ x0: 18.2, z0: -30, x1: 26, z1: 16 }], camera: { x: 4, z: -4, dist: 56 }, playable: true,
  notes: 'Arcade is walkable underneath; columns block. Detection is halved under the arcade roof.',
};

/** Berlin: roads around a planted traffic island and an open archway into a real courtyard. */
export const BERLIN: MapDef = {
  id: 'berlin', city: 'Berlin', country: 'Germany', district: 'Courtyards',
  refImage: 'ui/24_berlin_courtyards.jpg', damageImage: 'ui/35_berlin_disorder.jpg',
  bounds: { x0: -32, z0: -40, x1: 32, z1: 24 }, ground: 'asphalt',
  buildings: [
    { rect: { x0: -44, z0: -26, x1: 44, z1: -14 }, height: 11, style: 'berlin', fadeable: true, passages: [{ x0: -2.5, z0: -26, x1: 2.5, z1: -14 }] },
    { rect: { x0: -44, z0: -54, x1: -14, z1: -26 }, height: 18, style: 'berlin' },
    { rect: { x0: 14, z0: -54, x1: 44, z1: -26 }, height: 18, style: 'berlin' },
    { rect: { x0: -14, z0: -54, x1: 14, z1: -38 }, height: 18, style: 'berlin' },
    { rect: { x0: -44, z0: 16, x1: -12, z1: 34 }, height: 14, style: 'berlin', fadeable: true },
    { rect: { x0: 12, z0: 16, x1: 44, z1: 34 }, height: 14, style: 'berlin', fadeable: true },
  ],
  walls: [], water: [], bridges: [], arcades: [],
  islands: [{ x0: -10, z0: 1, x1: 10, z1: 9 }],
  props: [
    ...trees([[-8, -32], [8, -32], [-24, 12], [24, 12]]),
    ...lamps([[-14, -11], [14, -11], [-12, 12], [12, 12], [-12, -28]]),
    { type: 'bench', x: -6, z: -36, collide: true, r: 0.8 },
    { type: 'car', x: -20, z: -9, rot: 0, collide: true, burnable: true },
  ],
  stores: [
    { name: 'Electronics', kind: 'electronics', color: 0x1c2a4e, front: { x: -16, z: -14 }, normal: { x: 0, z: 1 }, width: 7 },
    { name: 'Fashion', kind: 'fashion', color: 0x2c4a3a, front: { x: 16, z: -14 }, normal: { x: 0, z: 1 }, width: 7 },
    { name: 'Courtyard jeweller', kind: 'jewellery', color: 0x5a1e28, front: { x: 0, z: -38 }, normal: { x: 0, z: 1 }, width: 6 },
  ],
  entries: [
    { id: 'w', name: 'West road', x: -31, z: -7, spawn: true, extract: true },
    { id: 'e', name: 'East road', x: 31, z: -7, spawn: true, extract: true },
    { id: 's', name: 'South road', x: 0, z: 23, spawn: true, extract: true },
  ],
  sockets: [
    { id: 'p1', x: 0, z: -11, size: 'small', rot: 0 }, { id: 'p2', x: 0, z: -30, size: 'small', rot: 0 },
    { id: 'p3', x: -22, z: -6, size: 'small', rot: 90 }, { id: 'p4', x: 22, z: -6, size: 'small', rot: 90 },
    { id: 'p5', x: -14, z: 5, size: 'small', rot: 90 }, { id: 'p6', x: 14, z: 5, size: 'small', rot: 90 },
    { id: 'L1', x: 0, z: -12.5, size: 'large', rot: 0 }, { id: 'L2', x: -26, z: -7, size: 'large', rot: 90 }, { id: 'L3', x: 0, z: 13, size: 'large', rot: 0 },
  ],
  van: { x: 24, z: 7, rot: 90 }, defenderSpawn: { x: 19, z: 5 },
  lowSight: [{ x0: -2.5, z0: -26, x1: 2.5, z1: -14 }], camera: { x: 0, z: -16, dist: 64 }, playable: true,
  notes: 'The courtyard is a real navigable area reached only through the archway; walls are solid.',
};

/** São Paulo: retail forecourt, corner shopping centre, loading yard with service lane and a rear approach. */
export const SAOPAULO: MapDef = {
  id: 'saopaulo', city: 'São Paulo', country: 'Brazil', district: 'Retail forecourt',
  refImage: 'ui/25_sao_paulo_retail.jpg', damageImage: 'ui/36_sao_paulo_disorder.jpg',
  bounds: { x0: -32, z0: -36, x1: 32, z1: 24 }, ground: 'stone',
  buildings: [
    { rect: { x0: -10, z0: -30, x1: 20, z1: -10 }, height: 12, style: 'modern' },
    { rect: { x0: 26, z0: -48, x1: 44, z1: 34 }, height: 16, style: 'modern' },
    { rect: { x0: -44, z0: -48, x1: -18, z1: 0 }, height: 18, style: 'modern' },
    { rect: { x0: -18, z0: -48, x1: 20, z1: -34 }, height: 10, style: 'modern' },
    { rect: { x0: -44, z0: 14, x1: -6, z1: 34 }, height: 12, style: 'modern', fadeable: true },
    { rect: { x0: 6, z0: 14, x1: 20, z1: 34 }, height: 12, style: 'modern', fadeable: true },
  ],
  walls: [{ x0: 19.6, z0: 14, x1: 20, z1: 34 }],
  water: [], bridges: [], arcades: [], islands: [],
  props: [
    ...trees([[-14, -4], [-4, -4], [6, -4], [-14, 8], [14, 8]], 'palm'),
    ...planters([[-4, 6], [4, 6]]),
    ...lamps([[-12, -12], [16, -6], [-12, 12], [17, 6]]),
    { type: 'car', x: -22, z: 3, rot: 90, collide: true, burnable: true },
  ],
  stores: [
    { name: 'Sports', kind: 'sports', color: 0x7a2a1a, front: { x: -10, z: -20 }, normal: { x: -1, z: 0 }, width: 6 },
    { name: 'Electronics', kind: 'electronics', color: 0x1c2a4e, front: { x: -1, z: -10 }, normal: { x: 0, z: 1 }, width: 7 },
    { name: 'Fashion', kind: 'fashion', color: 0x2c4a3a, front: { x: 12, z: -10 }, normal: { x: 0, z: 1 }, width: 7 },
  ],
  entries: [
    { id: 'rear', name: 'Rear service lane', x: 23, z: -35, spawn: true, extract: true },
    { id: 'w', name: 'West avenue', x: -31, z: 7, spawn: true, extract: true },
    { id: 's', name: 'South forecourt', x: 0, z: 23, spawn: true, extract: true },
  ],
  sockets: [
    { id: 'p1', x: -14, z: -14, size: 'small', rot: 90 }, { id: 'p2', x: 4, z: -6, size: 'small', rot: 0 },
    { id: 'p3', x: 23, z: -12, size: 'small', rot: 0 }, { id: 'p4', x: -2, z: 10, size: 'small', rot: 0 },
    { id: 'p5', x: -14, z: -26, size: 'small', rot: 0 }, { id: 'p6', x: 14, z: -4, size: 'small', rot: 0 },
    { id: 'L1', x: -26, z: 10, size: 'large', rot: 90 }, { id: 'L2', x: 0, z: 18, size: 'large', rot: 0 }, { id: 'L3', x: -14, z: -32, size: 'large', rot: 90 },
  ],
  van: { x: 12, z: 3, rot: 90 }, defenderSpawn: { x: 8, z: 4 },
  lowSight: [],
  loadingLane: { x0: 20.2, z0: -28, x1: 25.8, z1: -14 },
  supply: { route: [{ x: 23, z: 23 }, { x: 23, z: -21 }, { x: 23, z: -35 }], loadIndex: 1 },
  camera: { x: 0, z: -6, dist: 56 }, playable: true,
  notes: 'Rear service lane doubles as the supply-truck route; the truck stops for anyone in front and pays once.',
};
