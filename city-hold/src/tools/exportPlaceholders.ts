import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildHumanoid, STREETWEAR } from '../render/humans';
import { bakeClips } from '../render/character';
import { rigCharacter } from '../render/rig';
import { buildBarrierModel, buildCar, buildMastModel, buildProp, buildVan } from '../render/world';
import { buildBusShelter, buildDeliveryVan } from '../render/streetProps';
import type { UnitKind } from '../config/balance';
import type { PropType } from '../maps/types';

// Dev-only page: turns the procedural placeholders into real GLB files that fill the model slots.
// The game then loads these exactly like it will load the final assets.

function toB64(buf: ArrayBuffer): string {
  let s = ''; const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

async function glb(obj: THREE.Object3D, animations: THREE.AnimationClip[] = []): Promise<string> {
  obj.traverse((o) => {
    const m = o as THREE.Mesh; if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mm of mats) if (mm.name === 'glow') (mm as THREE.MeshBasicMaterial).color.multiplyScalar(1 / 5);
  });
  obj.updateMatrixWorld(true);
  const out = await new GLTFExporter().parseAsync(obj, { binary: true, animations, onlyVisible: false });
  return toB64(out as ArrayBuffer);
}

function single(fn: (g: THREE.Group) => void): THREE.Group {
  const holder = new THREE.Group(); fn(holder);
  const g = holder.children[0] as THREE.Group; holder.remove(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
  return g;
}

async function run(): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const chars: [string, UnitKind, (typeof STREETWEAR)[number] | null][] = [
    ['char.security', 'security', null], ['char.shield', 'shield', null], ['char.firefighter', 'firefighter', null],
    ['char.runner', 'runner', null], ['char.carrier', 'carrier', null], ['char.heavy', 'heavy', null], ['char.vandal', 'vandal', null], ['char.thrower', 'thrower', null],
    ...STREETWEAR.map((o) => [`char.looter.${o.ref}`, o.kinds[0], o] as [string, UnitKind, (typeof STREETWEAR)[number]]),
  ];
  for (const [slot, kind, outfit] of chars) {
    const h = buildHumanoid(kind, 7, { outfit, exportMode: true });
    const clips = bakeClips(h);
    h.carry.visible = true; // visibility is driven by the game; export the carried goods visible
    // auto-rigged: skeleton + skinned meshes, clips drive the bones
    files[slot] = await glb(rigCharacter(h.root), clips);
  }
  const props: PropType[] = ['lamp', 'tree', 'planter', 'bench', 'bollard', 'umbrella'];
  for (const t of props) files[`prop.${t}`] = await glb(single((g) => buildProp({ type: t, x: 0, z: 0 }, g, 1, new Map(), [])));
  files['prop.car'] = await glb(buildCar(0x5a5f66, false));
  files['prop.car_burned'] = await glb(buildCar(0, true));
  files['prop.van'] = await glb(buildVan().g);
  files['prop.barrier'] = await glb(buildBarrierModel('small'));
  files['prop.concrete'] = await glb(buildBarrierModel('large'));
  files['prop.camera_mast'] = await glb(buildMastModel());
  { const g = new THREE.Group(); buildBusShelter(g); files['prop.shelter'] = await glb(g); }
  files['prop.delivery_van'] = await glb(buildDeliveryVan());
  return files;
}

(window as unknown as { __exportPlaceholders: () => Promise<Record<string, string>> }).__exportPlaceholders = run;

/** round-trip check: procedural shop -> GLB -> registered slot -> ShopModule driven by game state */
(window as unknown as { __shopGlbCheck: () => Promise<unknown> }).__shopGlbCheck = async () => {
  const { ShopModule } = await import('../render/shopModule');
  const { registerModel } = await import('../render/assets');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const def = { name: 'x', kind: 'electronics' as const, color: 0, front: { x: 0, z: 0 }, normal: { x: 0, z: 1 }, width: 8 };
  const proc = new ShopModule(def, 0, { quality: 'desktop', seed: 1, withLight: false });
  proc.update(0.1, 1, 3, true, 1); // export with every part populated (instanced parts must not have count 0)
  const out = await new GLTFExporter().parseAsync(proc.group, { binary: true, onlyVisible: false }) as ArrayBuffer;
  const gltf = await new GLTFLoader().parseAsync(out, '');
  registerModel('shop.electronics', gltf.scene);
  const m = new ShopModule(def, 0, { quality: 'desktop', seed: 1, withLight: false });
  const res: Record<string, unknown> = { source: m.source, bytes: out.byteLength, groups: Object.fromEntries(Object.entries(m.groups).map(([k, g]) => [k, g.children.length])) };
  m.update(1, 1, 1, false, 0); res.intact = { glass: m.groups.glass_intact.visible, broken: m.groups.glass_broken.visible, boards: m.groups.boards.visible };
  m.update(0.2, 1, 1, true, 0); res.damagedFull = { glass: m.groups.glass_intact.visible, broken: m.groups.glass_broken.visible, bent: m.groups.shutter_bent.visible, stock: m.groups.stock.visible };
  m.update(1, 0, 1, false, 1); res.boardedEmpty = { boards: m.groups.boards.visible, stock: m.groups.stock.visible, state: m.referenceState };
  return res;
};
document.getElementById('status')!.textContent = 'ready';
