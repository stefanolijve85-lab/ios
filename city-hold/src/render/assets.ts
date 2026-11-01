import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// Model slots. The game asks for a slot; public/models/manifest.json says which GLB fills it and whether it is a
// temporary placeholder or a final asset. Dropping in a final GLB with the same slot changes nothing in the code.

export type SlotGroup = 'character' | 'prop' | 'shop';
export interface SlotDef { slot: string; group: SlotGroup; label: string; spec: string; /** built in code until a final GLB is supplied */ optional?: boolean }
export interface ManifestEntry { file: string; status: 'placeholder' | 'final'; note?: string }
export interface Manifest { version: 1; units: 'metres'; up: 'Y'; forward: '+Z'; slots: Record<string, ManifestEntry> }

const CHAR_SPEC = 'Rigged GLB, ~1.75 m, origin at feet, faces +Z. Clips: idle, walk, run, carry_idle, carry_walk, breach, collect, held, restrained, escorted, restrain, escort, brace, extinguish, throw, guide, flee. Node "carry" holds the carried goods (shown only when loaded). Materials named "skin" (and "top"/"legs" for casual looters) are recoloured per unit.';

export const SLOTS: SlotDef[] = [
  { slot: 'char.security', group: 'character', label: 'Security officer (images 10, 11)', spec: CHAR_SPEC },
  { slot: 'char.shield', group: 'character', label: 'Shield officer (image 12)', spec: CHAR_SPEC + ' Node "shield" = transparent riot shield.' },
  { slot: 'char.firefighter', group: 'character', label: 'Firefighter (image 29)', spec: CHAR_SPEC + ' Extinguisher in right hand.' },
  { slot: 'char.runner', group: 'character', label: 'Runner, casual (image 26)', spec: CHAR_SPEC },
  { slot: 'char.carrier', group: 'character', label: 'Carrier, casual (images 13, 14, 27)', spec: CHAR_SPEC },
  { slot: 'char.heavy', group: 'character', label: 'Heavy carrier (image 28)', spec: CHAR_SPEC },
  { slot: 'char.vandal', group: 'character', label: 'Vandal, casual', spec: CHAR_SPEC },
  { slot: 'char.civilian', group: 'character', label: 'Civilian, neutral (effects pack evacuating_civilian)', spec: CHAR_SPEC + ' Plus clips guide, flee.' },
  { slot: 'char.shopkeeper', group: 'character', label: 'Shopkeeper with apron (effects pack shopkeeper)', spec: CHAR_SPEC + ' Plus clips guide, flee. Node "carry" = small box.' },
  { slot: 'char.helper', group: 'character', label: 'Helper in hi-vis vest (effects pack helper)', spec: CHAR_SPEC + ' Plus clips guide (pointing the way), flee.' },
  { slot: 'char.thrower', group: 'character', label: 'Thrower, casual (throw-pose packs)', spec: CHAR_SPEC + ' Clip "throw" (wind-up, release at 39 %, follow-through, back to idle). Node "hand_socket" in the right hand holds the thrown object until release.' },
  ...['masked_1', 'masked_2', 'masked_3', 'thrower_1', 'thrower_2', 'thrower_3'].map((r) => ({ slot: `char.looter.${r}`, group: 'character' as const, label: `Thrower ${r.replace(/_/g, ' ')} (throw-pose packs)`, spec: CHAR_SPEC + ' Plus clip "throw" and node "hand_socket".' })),
  ...['01_tracksuit_arms_spread', '02_puffer_large_box', '03_runner_backpack', '04_vest_shopping_bags', '05_hoodie_backpack_walking', '06_puffer_electronics_box', '07_navy_runner', '08_padded_vest_bags', '09_large_backpack', '10_windbreaker_small_box'].map((r) => ({ slot: `char.looter.${r}`, group: 'character' as const, label: `Streetwear looter ${r.replace(/_/g, ' ')}`, spec: CHAR_SPEC })),
  ...([['electronics', 'VOLT'], ['fashion', 'ATELIER'], ['jewelry', 'LUMIERE'], ['grocery', 'MARCHE'], ['cafe', 'CAFE RIVE'], ['sneakers', 'COURT']] as const).map(([id, sign]) => ({
    slot: `shop.${id}`, group: 'shop' as const, optional: true, label: `Paris shop ${sign} (assets/paris_realism)`,
    spec: '8 m wide, 4.4 m high, interior 4 m deep, pivot at door floor centre, facade +Z. Named groups: shell, interior, fixtures, stock, glass_intact, glass_broken, boards, shutter_intact, shutter_bent, debris, damage_decals. Sockets: entrance, pickup_01..06, sign, light_left, light_right. Children of "stock" are hidden in order as stock falls.',
  })),
  { slot: 'prop.lamp', group: 'prop', label: 'Paris cast-iron street lamp', spec: 'Static GLB, ~4.9 m tall, origin at base. Lantern material named "glow" (made to bloom in game).' },
  { slot: 'prop.tree', group: 'prop', label: 'Street tree with planter base', spec: 'Static GLB, ~4.5 m, origin at base, footprint ≤ 1.8 m.' },
  { slot: 'prop.planter', group: 'prop', label: 'Planter box with shrub', spec: 'Static GLB, 1.4 × 1.4 m footprint.' },
  { slot: 'prop.bench', group: 'prop', label: 'Bench', spec: 'Static GLB, ~1.8 m long.' },
  { slot: 'prop.bollard', group: 'prop', label: 'Bollard', spec: 'Static GLB, ~0.9 m.' },
  { slot: 'prop.umbrella', group: 'prop', label: 'Café umbrella with table', spec: 'Static GLB, ~3 m diameter.' },
  { slot: 'prop.car', group: 'prop', label: 'Parked car (image 18)', spec: 'Static GLB, 1.8 × 4.3 m, long axis on Z.' },
  { slot: 'prop.car_burned', group: 'prop', label: 'Burned car (image 19)', spec: 'Same footprint as prop.car.' },
  { slot: 'prop.van', group: 'prop', label: 'Support van (image 17)', spec: 'Static GLB, 2.1 × 5.6 m, long axis on Z. Light-bar meshes named "beacon" flash in game.' },
  { slot: 'prop.barrier', group: 'prop', label: 'Crowd barrier (image 15)', spec: 'Static GLB, 2.6 m long on X.' },
  { slot: 'prop.concrete', group: 'prop', label: 'Concrete barrier row (image 31)', spec: 'Static GLB, 4.6 m long on X.' },
  { slot: 'prop.camera_mast', group: 'prop', label: 'Camera mast (image 16, street-props camera_mast)', spec: 'GLB ~5.5 m, trailer base 1.8 x 1.8 m. Nodes cam_pivot_1..3 are turned slowly by the game; detection range comes from the rules.' },
  { slot: 'prop.shelter', group: 'prop', label: 'Bus shelter (street-props bus_shelter)', spec: 'GLB 4 x 2.6 x 1.6 m, open front +Z. Glass separate; material "ad_panel" swappable. Collision: rear and sides only.' },
  { slot: 'prop.delivery_van', group: 'prop', label: 'Delivery van, unbranded (street-props delivery_van)', spec: 'GLB 2 x 2.5 x 5.2 m, long axis Z, front +Z. Nodes wheel_fl/fr/rl/rr and mirror_left/right separate.' },
  { slot: 'prop.fountain', group: 'prop', optional: true, label: 'Fountain (round basin with sculpture group, concept 01-03)', spec: 'GLB of the basin, pedestal, bowls and sculptures; any size: it is scaled to fit inside the planter ring and set on the ground. The benches and planters around it stay procedural.' },
];

const loaded = new Map<string, { scene: THREE.Object3D; animations: THREE.AnimationClip[] }>();
let manifest: Manifest | null = null;

export function getManifest() { return manifest; }
export function slotStatus(slot: string): 'final' | 'placeholder' | 'procedural' {
  const e = manifest?.slots[slot];
  if (!e || !loaded.has(slot)) return 'procedural';
  return e.status;
}

/** Returns the loaded model for a slot (shared; use cloneModel to place copies). */
export function getModel(slot: string) { return loaded.get(slot) ?? null; }

export function cloneModel(slot: string): THREE.Object3D | null {
  const m = loaded.get(slot);
  if (!m) return null;
  const c = skeletonClone(m.scene);
  c.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
  return c;
}

/** Bright materials are exported clamped to 1; restore the HDR intensity that drives bloom. */
function restoreGlow(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh; if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mm of mats) if (mm.name === 'glow' && (mm as THREE.MeshBasicMaterial).color) (mm as THREE.MeshBasicMaterial).color.multiplyScalar(5);
  });
}

/** Load every model listed in the manifest. Missing manifest or files just leave the procedural fallbacks. */
export async function loadAssets(base = 'models/', onProgress?: (done: number, total: number) => void): Promise<void> {
  if (manifest) return;
  try {
    const res = await fetch(base + 'manifest.json', { cache: 'no-cache' });
    if (!res.ok) { manifest = { version: 1, units: 'metres', up: 'Y', forward: '+Z', slots: {} }; return; }
    manifest = (await res.json()) as Manifest;
  } catch { manifest = { version: 1, units: 'metres', up: 'Y', forward: '+Z', slots: {} }; return; }
  const loader = new GLTFLoader();
  const entries = Object.entries(manifest.slots);
  let done = 0;
  await Promise.all(entries.map(async ([slot, e]) => {
    try {
      const g = await loader.loadAsync(base + e.file);
      restoreGlow(g.scene);
      loaded.set(slot, { scene: g.scene, animations: g.animations });
    } catch (err) { console.warn('model failed', slot, err); }
    onProgress?.(++done, entries.length);
  }));
}

/** register a model for a slot at runtime (tools, tests, mods) */
export function registerModel(slot: string, scene: THREE.Object3D, animations: THREE.AnimationClip[] = []) { loaded.set(slot, { scene, animations }); }

/** for tests / tools */
export function _resetAssets() { loaded.clear(); manifest = null; }
