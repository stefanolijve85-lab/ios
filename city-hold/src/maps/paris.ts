import type { MapDef, PropDef } from './types';

// Paris fountain district (tutorial). Geometry follows images 01/02: a continuous Haussmann row with three
// shops (jewellery, electronics, fashion, left to right), two side streets running north, a central fountain,
// and an open pedestrian street in the foreground between two roof blocks.

const props: PropDef[] = [
  // lamps around the square
  { type: 'lamp', x: -14.5, z: -11, collide: true, r: 0.25 },
  { type: 'lamp', x: 14.5, z: -11, collide: true, r: 0.25 },
  { type: 'lamp', x: -16, z: 5, collide: true, r: 0.25 },
  { type: 'lamp', x: 16, z: 5, collide: true, r: 0.25 },
  { type: 'lamp', x: -5.6, z: 13, collide: true, r: 0.25 },
  { type: 'lamp', x: 5.6, z: 13, collide: true, r: 0.25 },
  // planters with small trees
  { type: 'planter', x: -5, z: -13.1, collide: true, r: 0.7 },
  { type: 'planter', x: 5, z: -13.1, collide: true, r: 0.7 },
  { type: 'lamp', x: -18, z: -21, collide: true, r: 0.25 },
  { type: 'lamp', x: 18, z: -21, collide: true, r: 0.25 },
  { type: 'tree', x: -24, z: -13, collide: true, r: 0.9 },
  { type: 'tree', x: 24, z: -16, collide: true, r: 0.9 },
  { type: 'planter', x: -15.5, z: -13, collide: true, r: 0.8 },
  { type: 'planter', x: 15.5, z: -13, collide: true, r: 0.8 },
  { type: 'tree', x: -11, z: 11, collide: true, r: 0.9 },
  { type: 'tree', x: 11, z: 11, collide: true, r: 0.9 },
  { type: 'tree', x: -23.2, z: 1.2, collide: true, r: 0.8 },
  { type: 'tree', x: 23.2, z: 1.2, collide: true, r: 0.8 },
  // bollards along the foreground pavement (gaps are walkable)
  ...[-9, -7, 7, 9].map((x) => ({ type: 'bollard' as const, x, z: 8.5, collide: true, r: 0.15 })),
  // café terraces
  { type: 'umbrella', x: -19, z: 11.5, collide: true, r: 1.5 },
  { type: 'umbrella', x: 19.5, z: 11.5, collide: true, r: 1.5 },
  // benches around the fountain are part of the fountain obstacle ring
  // parked cars in the side streets (can be set alight by vandals)
  { type: 'car', x: -23.2, z: -27.2, rot: 90, collide: true, burnable: true },
  // street-props pack: generic delivery van, bus shelter on the foreground pavement, benches at the kerb
  { type: 'delivery_van', x: 23.0, z: -24, rot: 0, collide: true },
  { type: 'shelter', x: -16, z: 14.05, rot: 180, collide: true },
  { type: 'bench', x: -23.9, z: -13, rot: 90, collide: true, r: 0.75 },
  { type: 'bench', x: 23.9, z: -13, rot: -90, collide: true, r: 0.75 },
];

export const PARIS: MapDef = {
  id: 'paris',
  city: 'Paris',
  country: 'France',
  district: 'Fountain district',
  refImage: 'ui/01_map_clean.jpg',
  damageImage: 'ui/05_map_damaged.jpg',
  bounds: { x0: -32, z0: -30, x1: 32, z1: 24 },
  ground: 'cobble',
  buildings: [
    { rect: { x0: -17, z0: -40, x1: 17, z1: -14 }, height: 19, style: 'haussmann' },
    { rect: { x0: -44, z0: -40, x1: -25, z1: 3 }, height: 17, style: 'haussmann' },
    { rect: { x0: 25, z0: -40, x1: 44, z1: 3 }, height: 17, style: 'haussmann' },
    { rect: { x0: -44, z0: 15, x1: -5, z1: 34 }, height: 13, style: 'haussmann', fadeable: true },
    { rect: { x0: 5, z0: 15, x1: 44, z1: 34 }, height: 13, style: 'haussmann', fadeable: true },
  ],
  walls: [],
  water: [],
  bridges: [],
  arcades: [],
  fountain: { x: 0, z: -2, r: 5 },
  islands: [],
  props,
  stores: [
    { name: 'Jewellery', brand: 'LUMIERE', kind: 'jewellery', color: 0x18382c, front: { x: -10, z: -14 }, normal: { x: 0, z: 1 }, width: 8 },
    { name: 'Electronics', brand: 'VOLT', kind: 'electronics', color: 0x152337, front: { x: 0, z: -14 }, normal: { x: 0, z: 1 }, width: 8 },
    { name: 'Fashion', brand: 'ATELIER', kind: 'fashion', color: 0x541d2b, front: { x: 10, z: -14 }, normal: { x: 0, z: 1 }, width: 8 },
  ],
  // decorative shopfronts on the square's side facades (no gameplay stock)
  decorShops: [
    { name: 'Cafe', brand: 'CAFE RIVE', kind: 'cafe', color: 0x38261c, front: { x: -25, z: -5.5 }, normal: { x: 1, z: 0 }, width: 8 },
    { name: 'Grocery', brand: 'MARCHE', kind: 'grocery', color: 0x60705a, front: { x: -25, z: -20.5 }, normal: { x: 1, z: 0 }, width: 8 },
    { name: 'Sneakers', brand: 'COURT', kind: 'sneakers', color: 0x292b30, front: { x: 25, z: -5.5 }, normal: { x: -1, z: 0 }, width: 8 },
  ],
  entries: [
    { id: 'nw', name: 'North-west street', x: -21, z: -29, spawn: true, extract: true, marker: 'street' },
    { id: 'ne', name: 'North-east street', x: 21, z: -29, spawn: true, extract: true, marker: 'street' },
    { id: 's', name: 'South pedestrian street', x: 0, z: 23, spawn: true, extract: true, marker: 'street' },
    { id: 'w', name: 'West passage', x: -31, z: 9, spawn: true, extract: true, marker: 'street' },
  ],
  sockets: [
    { id: 'p1', x: -21, z: -9, size: 'small', rot: 0 },
    { id: 'p2', x: 21, z: -9, size: 'small', rot: 0 },
    { id: 'p3', x: -3.5, z: 10.5, size: 'small', rot: 0 },
    { id: 'p4', x: 3.5, z: 10.5, size: 'small', rot: 0 },
    { id: 'p5', x: -10, z: -8, size: 'small', rot: 0 },
    { id: 'p6', x: 10, z: -8, size: 'small', rot: 0 },
    { id: 'p7', x: 0, z: -10, size: 'small', rot: 0 },
    { id: 'p8', x: -16, z: 0, size: 'small', rot: 90 },
    { id: 'p9', x: 16, z: 0, size: 'small', rot: 90 },
    { id: 'p10', x: -26, z: 6, size: 'small', rot: 90 },
    { id: 'L1', x: -21, z: -16, size: 'large', rot: 0 },
    { id: 'L2', x: 21, z: -16, size: 'large', rot: 0 },
    { id: 'L3', x: 0, z: 18, size: 'large', rot: 0 },
    { id: 'L4', x: -28.5, z: 9, size: 'large', rot: 90 },
  ],
  van: { x: 24.5, z: 9, rot: 90 },
  defenderSpawn: { x: 19.5, z: 9 },
  lowSight: [],
  camera: { x: 0, z: -3, dist: 52 },
  playable: true,
  notes: 'Tutorial district. Four attacker approaches; the east service road is the defenders\' staging lane.',
};
