import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Auto-rig for the procedural characters: turns the jointed figure (a tree of Groups with rigid meshes) into a
// skeleton of Bones plus one SkinnedMesh per material. Each vertex is weighted 1.0 to the joint it belonged to,
// so existing animation clips (tracks "<joint>.quaternion" / "body.position") drive the bones unchanged.
// Parts that the game toggles or swaps (carry, bags, shield, hand_socket, held objects) stay rigid children of
// their bone. The result exports to glTF as a real skinned character.

const RIGID = new Set(['carry', 'bags', 'shield', 'hand_socket']);
const JOINT_NAMES = new Set(['body', 'hips', 'torso', 'head', 'legL', 'legR', 'kneeL', 'kneeR', 'armL', 'armR', 'elbowL', 'elbowR']);

export function rigCharacter(root: THREE.Object3D): THREE.Group {
  root.updateMatrixWorld(true);
  const out = new THREE.Group(); out.name = root.name || 'character';
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  // 1. bones mirroring the joint groups
  const bones: THREE.Bone[] = []; const boneOf = new Map<THREE.Object3D, THREE.Bone>();
  const makeBone = (g: THREE.Object3D, parent: THREE.Object3D) => {
    const b = new THREE.Bone(); b.name = g.name; b.position.copy(g.position); b.quaternion.copy(g.quaternion); b.scale.copy(g.scale);
    parent.add(b); bones.push(b); boneOf.set(g, b);
    for (const c of g.children) if (JOINT_NAMES.has(c.name)) makeBone(c, b);
  };
  const body = root.getObjectByName('body')!;
  makeBone(body, out);
  // 2. collect meshes per material, weighted to their owning joint; rigid sub-trees are re-parented to bones
  const ownerJoint = (o: THREE.Object3D): THREE.Object3D => { let p = o.parent; while (p && !JOINT_NAMES.has(p.name)) p = p.parent; return p ?? body; };
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const rigid: { obj: THREE.Object3D; joint: THREE.Object3D }[] = [];
  const visit = (o: THREE.Object3D) => {
    for (const c of [...o.children]) {
      if (RIGID.has(c.name)) { rigid.push({ obj: c, joint: ownerJoint(c) }); continue; }
      const m = c as THREE.Mesh;
      if (m.isMesh && !(c as unknown as THREE.Sprite).isSprite && !Array.isArray(m.material)) {
        const joint = ownerJoint(m); const bi = bones.indexOf(boneOf.get(joint)!);
        let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(rootInv, m.matrixWorld)); // bind pose in character space
        const n = g.attributes.position.count;
        g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, i) => (i % 4 === 0 ? bi : 0)), 4));
        g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, i) => (i % 4 === 0 ? 1 : 0)), 4));
        const list = byMat.get(m.material) ?? []; list.push(g); byMat.set(m.material, list);
      }
      visit(c);
    }
  };
  visit(root);
  // 3. skeleton in bind pose and one skinned mesh per material
  out.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false); if (!merged) continue;
    const g = mergeVertices(merged, 1e-5); // indexed: much smaller files
    const sm = new THREE.SkinnedMesh(g, mat); sm.name = 'skin_' + (mat.name || bones.length); sm.castShadow = true; sm.receiveShadow = true;
    out.add(sm); sm.bind(skeleton, new THREE.Matrix4());
    geos.forEach((x) => x.dispose());
  }
  // 4. rigid attachments keep their pose relative to their joint
  for (const { obj, joint } of rigid) {
    const bone = boneOf.get(joint)!;
    const local = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().copy(joint.matrixWorld).invert(), obj.matrixWorld);
    obj.removeFromParent(); local.decompose(obj.position, obj.quaternion, obj.scale); bone.add(obj);
  }
  return out;
}
