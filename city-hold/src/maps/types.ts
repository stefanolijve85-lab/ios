// Map definitions are the single geometric authority for navigation, placement and rendering.
// Coordinates: metres, x to the right (east), z towards the camera (south). All rects are axis aligned.

export interface Rect { x0: number; z0: number; x1: number; z1: number }
export interface Circle { x: number; z: number; r: number }
export interface Vec2 { x: number; z: number }

export type BuildingStyle = 'haussmann' | 'canal' | 'brick' | 'italian' | 'berlin' | 'modern';

export interface BuildingDef {
  rect: Rect;
  /** scenery outside the play area only (skipped in mobile quality) */
  backdrop?: boolean;
  /** draw the block this much smaller on every side (landmark buildings stand in front of it); navigation keeps the full rect */
  renderInset?: number;
  height: number;
  style: BuildingStyle;
  /** fade when it occludes the view (foreground roofs) */
  fadeable?: boolean;
  /** walkable passage cut through the building (London passage, Berlin arch) - rendered as an opening */
  passages?: Rect[];
}

export type StoreKind = 'jewellery' | 'electronics' | 'fashion' | 'sports' | 'phones' | 'department' | 'grocery' | 'cafe' | 'sneakers';

export interface StoreDef {
  name: string;
  /** fictional brand painted on the fascia (defaults to the name) */
  brand?: string;
  kind: StoreKind;
  color: number;
  /** centre of the shopfront on the facade line */
  front: Vec2;
  /** outward unit normal of the facade (one of the four axis directions) */
  normal: Vec2;
  width: number;
}

export interface EntryDef {
  id: string;
  name: string;
  x: number;
  z: number;
  spawn: boolean;
  extract: boolean;
  /** marked spawn such as underground stairs */
  marker?: 'stairs' | 'street';
}

export interface SocketDef { id: string; x: number; z: number; size: 'small' | 'large'; rot: 0 | 90 }

export type PropType = 'tree' | 'palm' | 'lamp' | 'planter' | 'bench' | 'bollard' | 'car' | 'umbrella' | 'kiosk' | 'phonebox' | 'column' | 'shelter' | 'delivery_van' | 'fence' | 'cafe_table' | 'police_van' | 'barricade_fire';

export interface PropDef { type: PropType; x: number; z: number; rot?: number; collide?: boolean; r?: number; burnable?: boolean }

export interface ArcadeDef { rect: Rect; height: number; columns: Circle[] }

export interface SupplyDef { route: Vec2[]; loadIndex: number }

export interface Spot { x: number; z: number; facing: number }

/** a painted facade from the concept art laid over a building front (x0..x1 along the face, y0..y1 height, at depth z) */
export interface FacadeDecal { texture: string; x0: number; x1: number; y0: number; y1: number; z: number }

/** a whole building model (city landmark) standing with its front on a street face; `store` makes it the look of that
 *  store while it is untouched (the 3D shop module with its states takes over in front of the ground floor otherwise) */
export interface LandmarkDef { slot: string; x: number; z: number; /** facing direction in degrees: 0 = +z */ rot: number; width: number; store?: number; inset?: number }

export interface MapDef {
  id: string;
  city: string;
  country: string;
  district: string;
  refImage: string;
  damageImage: string;
  bounds: Rect;
  ground: 'cobble' | 'brick' | 'stone' | 'asphalt' | 'plaza';
  buildings: BuildingDef[];
  /** thin solid walls, quays, railings (h = visual height, default 2.6 m) */
  walls: (Rect & { h?: number })[];
  water: Rect[];
  /** walkable decks over water */
  bridges: Rect[];
  arcades: ArcadeDef[];
  fountain?: Circle;
  /** raised planted islands (impassable) */
  islands: Rect[];
  props: PropDef[];
  stores: StoreDef[];
  /** decorative shopfronts (no gameplay stock) shown for atmosphere */
  decorShops?: StoreDef[];
  /** ambient life (no gameplay effect): café guests at terrace tables, a decorative police line, points where passers-by stop */
  ambient?: { patrons: Spot[]; police: Spot[]; browse: Vec2[] };
  facadeDecals?: FacadeDecal[];
  landmarks?: LandmarkDef[];
  entries: EntryDef[];
  sockets: SocketDef[];
  van: { x: number; z: number; rot: number };
  defenderSpawn: Vec2;
  /** reduced detection under covered areas */
  lowSight: Rect[];
  /** marked loading lane (Sao Paulo) */
  loadingLane?: Rect;
  supply?: SupplyDef;
  camera: { x: number; z: number; dist: number };
  /** shown on the selector; must be true only when the district has been validated */
  playable: boolean;
  notes: string;
}

export function rectContains(r: Rect, x: number, z: number): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

export function storeDoor(s: StoreDef, out = 1.1): Vec2 {
  return { x: s.front.x + s.normal.x * out, z: s.front.z + s.normal.z * out };
}
