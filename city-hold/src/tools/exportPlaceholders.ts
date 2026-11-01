import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildHumanoid, STREETWEAR } from '../render/humans';
import { bakeClips } from '../render/character';
import { buildBarrierModel, buildCar, buildMastModel, buildProp, buildVan } from '../render/world';
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
    ['char.runner', 'runner', null], ['char.carrier', 'carrier', null], ['char.heavy', 'heavy', null], ['char.vandal', 'vandal', null],
    ...STREETWEAR.map((o) => [`char.looter.${o.ref}`, o.kinds[0], o] as [string, UnitKind, (typeof STREETWEAR)[number]]),
  ];
  for (const [slot, kind, outfit] of chars) {
    const h = buildHumanoid(kind, 7, { outfit, exportMode: true });
    const clips = bakeClips(h);
    h.carry.visible = true; // visibility is driven by the game; export the carried goods visible
    files[slot] = await glb(h.root, clips);
  }
  const props: PropType[] = ['lamp', 'tree', 'planter', 'bench', 'bollard', 'umbrella'];
  for (const t of props) files[`prop.${t}`] = await glb(single((g) => buildProp({ type: t, x: 0, z: 0 }, g, 1, new Map(), [])));
  files['prop.car'] = await glb(buildCar(0x5a5f66, false));
  files['prop.car_burned'] = await glb(buildCar(0, true));
  files['prop.van'] = await glb(buildVan().g);
  files['prop.barrier'] = await glb(buildBarrierModel('small'));
  files['prop.concrete'] = await glb(buildBarrierModel('large'));
  files['prop.camera_mast'] = await glb(buildMastModel());
  return files;
}

(window as unknown as { __exportPlaceholders: () => Promise<Record<string, string>> }).__exportPlaceholders = run;
document.getElementById('status')!.textContent = 'ready';
