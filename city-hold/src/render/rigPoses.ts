import * as THREE from 'three';

/**
 * Authored clips for auto-rigged (Mixamo-style "Hips/Spine/LeftArm…") characters that only ship a handful of motion clips.
 * Each clip takes a base motion the figure already has (idle, walk or run) for legs, hips and torso, and replaces the
 * arm chain with a pose aimed in the character's own frame (forward / left / up), so it works for any bone orientation
 * the rigger produced. No paid generation needed; the result loops cleanly because it inherits the base clip's length.
 */

type V3 = [number, number, number]; // (forward, left, up), left side; mirrored for the right arm
interface ArmPose { upper: V3; fore: V3 }
interface PoseSpec {
  base: string[]; // first available base clip
  left?: (ph: number) => ArmPose; // ph = 0..1 over one cycle
  right?: (ph: number) => ArmPose;
  period?: number; // seconds per cycle (rounded to fit the base clip)
  spineYaw?: (ph: number) => number; // radians around up
  spinePitch?: number; // radians, positive bends forward
  headPitch?: number;
}

const both = (p: (ph: number) => ArmPose) => ({ left: p, right: p });
const TAU = Math.PI * 2;

export const POSED_CLIPS: Record<string, PoseSpec> = {
  // hands held behind the back, head down
  restrained: { base: ['idle'], ...both(() => ({ upper: [-0.4, 0.15, -1], fore: [-0.35, -0.9, 0.2] })), spinePitch: 0.12, headPitch: 0.35 },
  held: { base: ['idle'], ...both(() => ({ upper: [-0.4, 0.15, -1], fore: [-0.35, -0.9, 0.2] })), spinePitch: 0.12, headPitch: 0.35 },
  escorted: { base: ['walk', 'run'], ...both(() => ({ upper: [-0.4, 0.15, -1], fore: [-0.35, -0.9, 0.2] })), spinePitch: 0.15, headPitch: 0.3 },
  // the escorting guard keeps one hand on the shoulder in front
  escort: { base: ['walk', 'run'], right: () => ({ upper: [0.75, 0.05, -0.6], fore: [1, -0.25, 0.2] }) },
  // both hands on the hose, sweeping the base of the fire
  extinguish: {
    base: ['idle'], period: 2.4, spinePitch: 0.1,
    ...both(() => ({ upper: [0.8, 0.12, -0.55], fore: [1, -0.3, -0.05] })),
    spineYaw: (ph) => Math.sin(ph * TAU) * 0.22,
  },
  // running away with the arms shielding the head
  flee: { base: ['run', 'walk'], ...both(() => ({ upper: [0.45, 0.6, 0.55], fore: [0.25, -0.85, 0.45] })), spinePitch: 0.15, headPitch: 0.2 },
  // shopkeeper / helper waves people along
  guide: {
    base: ['idle'], period: 1.2,
    right: (ph) => ({ upper: [0.25, 0.85, 0.4], fore: [0.3, 0.2 + Math.sin(ph * TAU) * 0.55, 1] }),
  },
  // shield officer: shield arm up in front, baton raised over the shoulder and chopped down (played as a one-shot, ph = progress)
  strike: {
    base: ['idle'], period: 99, spinePitch: 0.12,
    left: () => ({ upper: [0.9, 0.15, 0.1], fore: [0.3, -0.9, 0.35] }),
    right: (ph) => {
      const up: ArmPose = { upper: [0.25, -0.35, 1], fore: [-0.4, -0.2, 1] }, hit: ArmPose = { upper: [1, -0.1, -0.15], fore: [0.9, 0.1, -0.6] }, rest: ArmPose = { upper: [0.2, -0.2, -1], fore: [0.8, 0, -0.5] };
      const mix = (a: ArmPose, b: ArmPose, k: number): ArmPose => { const e = k * k * (3 - 2 * k); const m = (x: V3, y: V3) => x.map((v, i) => v + (y[i] - v) * e) as V3; return { upper: m(a.upper, b.upper), fore: m(a.fore, b.fore) }; };
      return ph < 0.35 ? mix(rest, up, ph / 0.35) : ph < 0.55 ? mix(up, hit, (ph - 0.35) / 0.2) : mix(hit, rest, (ph - 0.55) / 0.45);
    },
    spineYaw: (ph) => (ph < 0.35 ? 0.3 * (ph / 0.35) : ph < 0.55 ? 0.3 - 0.6 * ((ph - 0.35) / 0.2) : -0.3 * (1 - (ph - 0.55) / 0.45)),
  },
  // standing still with a box in both arms
  carry_idle: { base: ['idle'], ...both(() => ({ upper: [0.35, 0.25, -0.9], fore: [0.95, -0.45, 0.25] })) },
};

const vF = new THREE.Vector3(), vL = new THREE.Vector3(), vU = new THREE.Vector3(0, 1, 0);

/** Add every clip in POSED_CLIPS the model lacks. Returns the names added. */
export function addPosedClips(scene: THREE.Object3D, animations: THREE.AnimationClip[], only?: Set<string>): string[] {
  const bone = (n: string) => scene.getObjectByName(n) as THREE.Bone | undefined;
  const need = ['Hips', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand'];
  if (!need.every((n) => bone(n))) return [];
  scene.updateMatrixWorld(true);
  const wp = (n: string) => bone(n)!.getWorldPosition(new THREE.Vector3());
  // character frame: up is +Y, left from the shoulders, forward from the feet (or the left-cross-up product)
  vL.copy(wp('LeftArm')).sub(wp('RightArm')).setY(0).normalize();
  const toe = bone('LeftToeBase'), foot = bone('LeftFoot');
  if (toe && foot) vF.copy(wp('LeftToeBase')).sub(wp('LeftFoot')).setY(0).normalize(); else vF.set(0, 0, 0);
  const cross = new THREE.Vector3().crossVectors(vL, vU); // with right-handed axes, left × up = forward
  if (vF.lengthSq() < 0.5 || vF.dot(cross) < 0.3) vF.copy(cross);
  const world = (v: V3, side: 1 | -1) => new THREE.Vector3().addScaledVector(vF, v[0]).addScaledVector(vL, v[1] * side).addScaledVector(vU, v[2]).normalize();

  const curWorldQ = (b: THREE.Object3D) => b.getWorldQuaternion(new THREE.Quaternion());
  /** local quaternion that points bone `b` (whose child is `c`) along world dir `d`, given the parent's world rotation */
  const aim = (b: THREE.Bone, c: THREE.Object3D, parentW: THREE.Quaternion, d: THREE.Vector3) => {
    const w = parentW.clone().multiply(b.quaternion); // the bone's world rotation with its current local rotation
    const cur = c.position.clone().normalize().applyQuaternion(w);
    const nw = new THREE.Quaternion().setFromUnitVectors(cur, d).multiply(w);
    return { local: parentW.clone().invert().multiply(nw), world: nw };
  };
  const armQuats = (side: 1 | -1, p: ArmPose) => {
    const pre = side === 1 ? 'Left' : 'Right';
    const up = bone(pre + 'Arm')!, fo = bone(pre + 'ForeArm')!, ha = bone(pre + 'Hand')!;
    const a = aim(up, fo, curWorldQ(up.parent!), world(p.upper, side));
    const b = aim(fo, ha, a.world, world(p.fore, side));
    return [[up.name, a.local], [fo.name, b.local]] as const;
  };
  /** extra rotation around a world axis, expressed as the bone's new local rotation */
  const turn = (b: THREE.Object3D, q: THREE.Quaternion) => {
    const pw = curWorldQ(b.parent!); const w = pw.clone().multiply(b.quaternion);
    return pw.invert().multiply(q.clone().multiply(w));
  };
  // remember the rest pose: the base clip is sampled on the real bones and must not leave them moved
  const rest: [THREE.Object3D, THREE.Vector3, THREE.Quaternion, THREE.Vector3][] = [];
  scene.traverse((o) => rest.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]));
  const restore = () => { for (const [o, p, q, sc] of rest) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(sc); } scene.updateMatrixWorld(true); };

  const added: string[] = [];
  const have = new Set(animations.map((c) => c.name));
  for (const [name, spec] of Object.entries(POSED_CLIPS)) {
    if (have.has(name) || (only && !only.has(name))) continue;
    const base = spec.base.map((n) => animations.find((c) => c.name === n)).find(Boolean);
    if (!base) continue;
    const dur = base.duration > 0.05 ? base.duration : 2;
    const period = spec.period ?? dur;
    const cycles = Math.max(1, Math.round(dur / period));
    const keys = spec.period || spec.spineYaw ? 24 : 1;
    const times = keys === 1 ? [0] : Array.from({ length: keys + 1 }, (_, i) => (i / keys) * dur);
    const tracks = new Map<string, number[]>();
    const push = (n: string, q: THREE.Quaternion) => { const a = tracks.get(n) ?? []; a.push(q.x, q.y, q.z, q.w); tracks.set(n, a); };
    const spine = bone('Spine01') ?? bone('Spine');
    const head = bone('Head');
    const pitchAxis = vL.clone(); // rotating around +left tips the top forward with right-handed axes
    const mixer = new THREE.AnimationMixer(scene);
    const act = mixer.clipAction(base); act.play();
    for (const t of times) {
      const ph = ((t / dur) * cycles) % 1;
      restore(); mixer.setTime(Math.min(t, dur - 1e-4)); scene.updateMatrixWorld(true);
      // torso first (arms are aimed in world space, so they follow the turned torso automatically)
      if (spine && (spec.spineYaw || spec.spinePitch)) {
        const q = new THREE.Quaternion().setFromAxisAngle(vU, spec.spineYaw ? spec.spineYaw(ph) : 0)
          .multiply(new THREE.Quaternion().setFromAxisAngle(pitchAxis, spec.spinePitch ?? 0));
        const l = turn(spine, q); push(spine.name, l); spine.quaternion.copy(l); scene.updateMatrixWorld(true);
      }
      if (head && spec.headPitch) { const l = turn(head, new THREE.Quaternion().setFromAxisAngle(pitchAxis, spec.headPitch)); push(head.name, l); }
      if (spec.left) for (const [n, q] of armQuats(1, spec.left(ph))) push(n, q);
      if (spec.right) for (const [n, q] of armQuats(-1, spec.right(ph))) push(n, q);
    }
    act.stop(); mixer.uncacheRoot(scene); restore();
    const replaced = new Set([...tracks.keys()].map((n) => n + '.quaternion'));
    const out: THREE.KeyframeTrack[] = base.tracks.filter((tr) => !replaced.has(tr.name)).map((tr) => tr.clone());
    const kt = keys === 1 ? [0] : times;
    for (const [n, v] of tracks) out.push(new THREE.QuaternionKeyframeTrack(n + '.quaternion', kt, v));
    const clip = new THREE.AnimationClip(name, dur, out);
    animations.push(clip); have.add(name); added.push(name);
  }
  return added;
}
