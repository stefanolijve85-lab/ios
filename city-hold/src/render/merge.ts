import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge every static mesh under `root` into one mesh per material (fewer draw calls, same look). */
export function mergeStatic(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; shadow: boolean }>();
  const remove: THREE.Object3D[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    let skip = false; for (let q: THREE.Object3D | null = o; q && q !== root; q = q.parent) if (q.userData.noMerge) { skip = true; break; }
    if (skip) return;
    if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh || Array.isArray(m.material) || (m as unknown as THREE.SkinnedMesh).isSkinnedMesh) return;
    let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const e = byMat.get(m.material) ?? { geos: [], shadow: false };
    e.geos.push(g); e.shadow ||= m.castShadow; byMat.set(m.material, e);
    remove.push(m);
  });
  for (const o of remove) o.parent?.remove(o);
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  for (const [mat, { geos, shadow }] of byMat) {
    const merged = mergeGeometries(geos, false); if (!merged) continue;
    merged.applyMatrix4(inv);
    const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = shadow; mesh.receiveShadow = true; root.add(mesh);
    geos.forEach((g) => g.dispose());
  }
}

