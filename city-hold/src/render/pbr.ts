import * as THREE from 'three';

// Tileable PBR sets from tools/make_pbr.py (public/textures/<name>_albedo|normal|rough.jpg).
// Textures load asynchronously into their own Texture objects (never swapped after upload).
const loader = new THREE.TextureLoader();
const base = new Map<string, THREE.Texture>();
const pending: Promise<void>[] = [];
/** resolves when every PBR image requested so far has loaded (tools/export) */
export function pbrReady(): Promise<unknown> { return Promise.all(pending); }
function load(file: string, srgb: boolean): THREE.Texture {
  let t = base.get(file);
  if (!t) { let done!: () => void; pending.push(new Promise<void>((r) => (done = r))); t = loader.load(`textures/${file}.jpg`, () => done(), undefined, () => done()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; base.set(file, t); }
  return t;
}
export interface PbrSet { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }
/** a PBR set with its own repeat (clones share the uploaded image) */
export function pbr(name: 'limestone' | 'setts' | 'slate', repeatX: number, repeatY: number): PbrSet {
  const mk = (suffix: string, srgb: boolean) => { const t = load(`${name}_${suffix}`, srgb).clone(); t.repeat.set(repeatX, repeatY); t.needsUpdate = true; return t; };
  return { map: mk('albedo', true), normalMap: mk('normal', false), roughnessMap: mk('rough', false) };
}
