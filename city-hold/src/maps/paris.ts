import type { MapDef, PropDef } from './types';

// Paris fountain district (tutorial). Geometry follows images 01/02: a continuous Haussmann row with three
// shops (jewellery, electronics, fashion, left to right), two side streets running north, a central fountain,
// and an open pedestrian street in the foreground between two roof blocks.

const props: PropDef[] = [
  // street lamps placed as in concept 02: on the pavement edge in front of the shops, on the kerbs of the side
  // pavements, one by the café terrace, and a pair flanking the foreground street beside its two trees. The square
  // around the fountain stays open (no lamp ring), which is what makes it read as a square.
  ...([[-14.5, -11.6], [-5, -11.6], [5, -11.6], [14.5, -11.6], // shop pavement
    [-22.8, -4], [22.8, -6], // side kerbs
    [-23.6, 1.2], // café terrace corner
    [-9.2, 12.9], [9.2, 12.9]] as const) // foreground street, outside the two trees
    .map(([x, z]) => ({ type: 'lamp' as const, x, z, collide: true, r: 0.25 })),
  // side streets lit along both kerbs and lined with trees; the far lamps sit outside the play area and only add depth
  ...([[-17.7, -20], [17.7, -20], [-24.3, -32], [24.3, -31], [-17.7, -38], [17.7, -38], [-24.3, -47], [24.3, -47], [-17.7, -55], [17.7, -55]] as const)
    .map(([x, z]) => ({ type: 'lamp' as const, x, z, collide: true, r: 0.25 })),
  ...([[-24.1, -21.5], [24.1, -19], [-24.1, -36.5], [24.1, -36.5], [-24.1, -52], [24.1, -52]] as const)
    .map(([x, z]) => ({ type: 'tree' as const, x, z, collide: true, r: 0.7 })),
  // trees in planters beside the fountain, as in concept 02 (in front of it the square stays open)
  { type: 'tree', x: -11.5, z: -2.5, collide: true, r: 0.8 },
  { type: 'tree', x: 11.5, z: -2.5, collide: true, r: 0.8 },
  // planters with small trees
  { type: 'planter', x: -5, z: -13.1, collide: true, r: 0.7 },
  { type: 'planter', x: 5, z: -13.1, collide: true, r: 0.7 },
  { type: 'tree', x: -24, z: -13, collide: true, r: 0.9 },
  { type: 'tree', x: 24, z: -16, collide: true, r: 0.9 },
  { type: 'planter', x: -15.5, z: -13, collide: true, r: 0.8 },
  { type: 'planter', x: 15.5, z: -13, collide: true, r: 0.8 },
  // concept 02: two trees framing the foreground street with a lamp outside each, low planters along its pavement,
  // and a tree in a planter on each side of the square (left by the café terrace, right in front of the east street)
  { type: 'tree', x: -6.8, z: 12.2, collide: true, r: 0.9 },
  { type: 'tree', x: 6.8, z: 12.2, collide: true, r: 0.9 },
  { type: 'planter', x: -12.2, z: 11.6, collide: true, r: 0.7 },
  { type: 'planter', x: 12.2, z: 11.6, collide: true, r: 0.7 },
  { type: 'tree', x: -19.5, z: 1.8, collide: true, r: 0.8 },
  { type: 'tree', x: 18.6, z: -5.2, collide: true, r: 0.8 }, // up beside the east street: no longer in front of the police van where the reserve stands
  // bollards along the foreground pavement (gaps are walkable)
  ...[-9, -7, -3.4, 3.4, 7, 9, -13, 13].map((x) => ({ type: 'bollard' as const, x, z: 8.5, collide: true, r: 0.15 })),
  // crowd-control fences against the side facades, as in images 02/03 (decor, off the walking lines)
  { type: 'fence', x: 21.7, z: -12.6, rot: 90, collide: true, r: 0.5 },
  // parasols over the CAFE RIVE terrace
  { type: 'umbrella', x: -21.6, z: -8.2, collide: true, r: 0.3 },
  { type: 'umbrella', x: -21.6, z: -2.8, collide: true, r: 0.3 },
  // police van with flashing lights at the crowd fence by the east side street, and a burning barricade far up the
  // north-west side street (both decorative, as in image 02)
  { type: 'police_van', x: 23.2, z: -12.6, rot: 0, collide: true },
  { type: 'barricade_fire', x: -20.5, z: -33 },
  // police line in front of the staging van (decor, as in images 02/03)
  { type: 'fence', x: 25.6, z: 5.3, rot: 0, collide: true, r: 0.5 },
  // café terraces: tables in front of CAFE RIVE and around the foreground umbrellas
  ...([[-22.3, -8.2], [-22.3, -2.8], [-20.0, -5.5], [-21.2, 12.6], [-18.8, 9.6], [17.4, 12.7], [21.6, 12.7]] as const).map(([x, z]) => ({ type: 'cafe_table' as const, x, z, collide: true, r: 0.85 })),
  // café terraces
  { type: 'umbrella', x: -19, z: 11.5, collide: true, r: 1.5 },
  { type: 'umbrella', x: 19.5, z: 11.5, collide: true, r: 1.5 },
  // benches around the fountain are part of the fountain obstacle ring
  // parked cars in the side streets (can be set alight by vandals)
  { type: 'car', x: -23.2, z: -27.2, rot: 90, collide: true, burnable: true },
  // street-props pack: generic delivery van, bus shelter on the foreground pavement, benches at the kerb
  { type: 'delivery_van', x: 23.0, z: -24, rot: 0, collide: true },
  // Paris pack (image-to-3D): a police car behind the staging van, a dusty red van parked far up the west street, a scooter
  // on the foreground pavement and the water cannon waiting at the top of the east street (scenery, beyond the play area)
  { type: 'vehicle', model: 'prop.police_car.paris', x: 23.0, z: -18.6, rot: 0, len: 4.6, wid: 1.9, collide: true },
  { type: 'vehicle', model: 'prop.van_red.paris', x: -23.4, z: -37.5, rot: 180, len: 4.4, wid: 1.9 },
  { type: 'vehicle', model: 'prop.scooter.paris', x: 14.2, z: 13.7, rot: 90, len: 1.9, wid: 0.7, collide: true },
  { type: 'vehicle', model: 'prop.taxi.paris', x: 17.8, z: -40.5, rot: 180, len: 4.8, wid: 1.85 },
  { type: 'vehicle', model: 'prop.solotech_van.paris', x: -19.8, z: -41.5, rot: 0, len: 5.2, wid: 2.0 },
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
    { rect: { x0: -14.6, z0: -40, x1: 14.6, z1: -14 }, height: 14.6, style: 'haussmann' }, // proportions of images 01-03: shops + 3 floors + mansard
    { rect: { x0: -44, z0: -40, x1: -25, z1: 3 }, height: 14, style: 'haussmann' },
    { rect: { x0: 25, z0: -40, x1: 44, z1: 3 }, height: 14, style: 'haussmann' },
    // backdrop beyond the play area: the side streets run on past a cross street, as in images 01/02 (outside the nav bounds)
    { rect: { x0: -46, z0: -76, x1: -25, z1: -46 }, height: 19, style: 'haussmann', backdrop: true },
    { rect: { x0: -17, z0: -76, x1: 17, z1: -46 }, height: 20, style: 'haussmann', backdrop: true },
    { rect: { x0: 25, z0: -76, x1: 46, z1: -46 }, height: 19, style: 'haussmann', backdrop: true },
    { rect: { x0: -44, z0: 15, x1: -11, z1: 34 }, height: 7, style: 'haussmann', fadeable: true }, // corner blocks: the pedestrian street between them is wide, as in images 01/05
    { rect: { x0: 11, z0: 15, x1: 44, z1: 34 }, height: 7, style: 'haussmann', fadeable: true },
  ],
  walls: [],
  water: [],
  bridges: [],
  arcades: [],
  fountain: { x: 0, z: -2, r: 5 },
  islands: [],
  props,
  stores: [
    { name: 'Jewellery', brand: 'LUMIERE', kind: 'jewellery', color: 0x7c1d23, front: { x: -10, z: -14 }, normal: { x: 0, z: 1 }, width: 8 },
    { name: 'Electronics', brand: 'VOLT', kind: 'electronics', color: 0x14264a, front: { x: 0, z: -14 }, normal: { x: 0, z: 1 }, width: 8 },
    { name: 'Fashion', brand: 'ATELIER', kind: 'fashion', color: 0x17553f, front: { x: 10, z: -14 }, normal: { x: 0, z: 1 }, width: 8 },
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
  van: { x: 22.6, z: 1.5, rot: 0 },
  fireEngine: { x: 15.6, z: 6.9, rot: 90 },
  waterCannon: { home: { x: 20.6, z: -38 }, post: { x: 20.6, z: -19.5 }, rot: 180 }, // waits up the east street, sprays from its mouth // along the kerb of the foreground block, facing the cross street
  defenderSpawn: { x: 19.2, z: 0.5 }, // far enough from the foreground block that its roof never hides the staging team
  lowSight: [],
  // the three upper floors of the shop building as painted in concept 01 (floors above the shop fascia up to the cornice)
  // the rest of the riot further up the two side streets (images 05/07): a crowd that is scenery, never part of the game
  riotFires: [{ x: -19.4, z: -38, kind: 'car', rot: 0.35 }, { x: 20.1, z: -35.5, kind: 'car', rot: -0.25 }, { x: 21.2, z: -45, kind: 'bins' }, { x: -21.4, z: -50, kind: 'bins' }],
  backdropCrowd: [{ x0: -22.6, x1: -17.2, z0: -42, z1: -19 }, { x0: 17.2, x1: 22.6, z0: -42, z1: -19 }], // the street mouths: what the camera actually sees of the side streets
  glowLamps: ([[-16.2, -24], [-16.2, -30], [-16.2, -37], [-16.2, -44], [-16.2, -50], [-16.2, -56], [-16.2, -63], [-16.2, -70], [-23.6, -24], [-23.6, -30], [-23.6, -37], [-23.6, -44], [-23.6, -50], [-23.6, -56], [-23.6, -63], [-23.6, -70], [16.2, -24], [16.2, -30], [16.2, -37], [16.2, -44], [16.2, -50], [16.2, -56], [16.2, -63], [16.2, -70], [23.6, -24], [23.6, -30], [23.6, -37], [23.6, -44], [23.6, -50], [23.6, -56], [23.6, -63], [23.6, -70], [-36, -43.5], [-8, -43.5], [8, -43.5], [36, -43.5]] as const).map(([x, z]) => ({ x, z })),
  facadeDecals: [
    { texture: 'textures/facades/paris_main.jpg', x0: -14.6, x1: 14.6, y0: 4.45, y1: 14.6, z: -14 + 0.75, tile: 29.2 },
    // the same painted Haussmann front on the two side blocks that face the square and the side streets (image 02)
    { texture: 'textures/facades/paris_main.jpg', x0: -40, x1: 3, y0: 4.45, y1: 14, z: -25 + 0.75, face: 'x+', tile: 28.6 },
    { texture: 'textures/facades/paris_main.jpg', x0: -40, x1: 3, y0: 4.45, y1: 14, z: 25 - 0.75, face: 'x-', tile: 28.6 },
  ],
  ambient: {
    // guests standing or sitting at the terrace tables (first ones are kept on phones)
    patrons: [
      { x: -21.7, z: -7.7, facing: -2.3 }, { x: -22.9, z: -2.3, facing: 2.3 }, { x: -18.2, z: 10.1, facing: -2.4 }, { x: 18.0, z: 12.2, facing: 2.3 },
      { x: -19.4, z: -5.0, facing: -2.3 }, { x: -20.6, z: 13.1, facing: -2.4 }, { x: 21.0, z: 12.1, facing: 0.7 }, { x: 22.2, z: 13.2, facing: -2.4 },
      { x: -22.9, z: -8.7, facing: 0.8 }, { x: -19.4, z: 9.1, facing: 0.8 },
    ],
    // decorative police line behind the fence at the staging van, facing the square
    police: [{ x: 24.0, z: 6.3, facing: Math.PI }, { x: 25.6, z: 6.4, facing: Math.PI }, { x: 27.2, z: 6.3, facing: Math.PI }, { x: 20.7, z: -11.4, facing: -Math.PI / 2 }, { x: 20.7, z: -13.8, facing: -Math.PI / 2 }],
    // where passers-by stop: shop windows, the fountain rim, the café
    browse: [
      { x: -12, z: -11.6 }, { x: -8, z: -11.6 }, { x: -1.8, z: -11.6 }, { x: 1.8, z: -11.6 }, { x: 8, z: -11.6 }, { x: 12, z: -11.6 },
      { x: -5.6, z: -2 }, { x: 5.6, z: -2 }, { x: 0, z: 4 }, { x: -3.8, z: 2 }, { x: 3.8, z: -6 },
      { x: -20.5, z: -5.4 }, { x: 0, z: 13 },
      // the side streets (image 02: people walking up and down both streets)
      { x: -21, z: -18 }, { x: -20, z: -24 }, { x: -21.5, z: -27 }, { x: 21, z: -17 }, { x: 20.5, z: -21 }, { x: 21.5, z: -27 }, { x: -12, z: 10 }, { x: 12, z: 10 },
    ],
  },
  camera: { x: 0, z: -7, dist: 50, pitch: 42, fov: 44, portraitDist: 1.45, portraitZ: -5 }, // framed like images 01/05: the full main building with its roof, fountain in the middle
  playable: true,
  notes: 'Tutorial district. Four attacker approaches; the east service road is the defenders\' staging lane.',
};
