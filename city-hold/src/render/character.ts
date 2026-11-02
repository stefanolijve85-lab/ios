import * as THREE from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import type { UnitKind } from '../config/balance';
import { THROW_RELEASE, animate, buildHumanoid, type AnyKind, contactShadow, outfitFor, CASUAL_LEGS, CASUAL_TOPS, SKIN_TONES, type Humanoid, type Pose } from './humans';
import { iconTexture } from './textures';
import { getModel, slotStatus } from './assets';
import { buildIncendiary } from './thrown';

/** What the match view needs from any character visual (procedural or loaded from a GLB file). */
export interface CharacterVisual {
  root: THREE.Object3D;
  icon: THREE.Sprite;
  source: 'glb' | 'procedural';
  /** world position of a held object's flame tip, if one is in hand */
  heldWick?(out: THREE.Vector3): boolean;
  /** action: 0..1 progress of a one-shot action (throw) */
  update(pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number, action?: number): void;
}

const JOINTS = ['torso', 'head', 'legL', 'legR', 'kneeL', 'kneeR', 'armL', 'armR', 'elbowL', 'elbowR'];

/** Animation clips every character GLB should provide (names are the contract with final assets). */
export const CLIP_NAMES = ['idle', 'walk', 'run', 'carry_idle', 'carry_walk', 'breach', 'collect', 'held', 'restrained', 'escorted', 'restrain', 'escort', 'brace', 'extinguish', 'throw', 'guide', 'flee'] as const;
export type ClipName = (typeof CLIP_NAMES)[number];

const CLIP_SPEC: Record<ClipName, { pose: Pose; moving: boolean; speed: number; carrying: boolean; period: number }> = {
  idle: { pose: 'idle', moving: false, speed: 0, carrying: false, period: Math.PI * 2 },
  walk: { pose: 'walk', moving: true, speed: 3, carrying: false, period: (Math.PI * 2) / 7.5 },
  run: { pose: 'walk', moving: true, speed: 4.2, carrying: false, period: (Math.PI * 2) / (9.5 * 1.3) },
  carry_idle: { pose: 'idle', moving: false, speed: 0, carrying: true, period: Math.PI * 2 },
  carry_walk: { pose: 'walk', moving: true, speed: 2.4, carrying: true, period: (Math.PI * 2) / (7.5 * 0.8) },
  breach: { pose: 'breach', moving: false, speed: 0, carrying: false, period: (Math.PI * 2) / 6 },
  collect: { pose: 'collect', moving: false, speed: 0, carrying: false, period: (Math.PI * 2) / 3.6 },
  held: { pose: 'held', moving: false, speed: 0, carrying: false, period: 2 },
  restrained: { pose: 'restrained', moving: false, speed: 0, carrying: false, period: 1 },
  escorted: { pose: 'escorted', moving: true, speed: 1.8, carrying: false, period: (Math.PI * 2) / (7.5 * 0.6) },
  restrain: { pose: 'restrain', moving: false, speed: 0, carrying: false, period: 1 },
  escort: { pose: 'escort', moving: true, speed: 1.8, carrying: false, period: (Math.PI * 2) / (7.5 * 0.6) },
  brace: { pose: 'brace', moving: false, speed: 0, carrying: false, period: 1 },
  extinguish: { pose: 'extinguish', moving: false, speed: 0, carrying: false, period: 1 },
  throw: { pose: 'throw', moving: false, speed: 0, carrying: false, period: 1.15 },
  guide: { pose: 'guide', moving: false, speed: 0, carrying: false, period: Math.PI * 2 },
  flee: { pose: 'flee', moving: true, speed: 3.4, carrying: false, period: (Math.PI * 2) / (9.5 * 1.13) },
};

/** Bake the procedural poses (rebuilt from action sheets 37-42) into looping keyframe clips on the named joints. */
export function bakeClips(h: Humanoid): THREE.AnimationClip[] {
  const clips: THREE.AnimationClip[] = [];
  const joints = JOINTS.map((n) => h.root.getObjectByName(n)!);
  const body = h.body;
  for (const name of CLIP_NAMES) {
    const sp = CLIP_SPEC[name];
    for (const j of joints) j.rotation.set(0, 0, 0);
    h.phase = 0; h.recoil = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 90; i++) animate(h, sp.pose, sp.moving, sp.speed, sp.carrying, dt); // settle the smoothing
    // continue until the phase wraps so the loop starts at a cycle boundary
    const frames = 24; const times: number[] = []; const rot: number[][] = joints.map(() => []); const bob: number[] = [];
    const step = sp.period / frames;
    const q = new THREE.Quaternion();
    for (let f = 0; f <= frames; f++) {
      times.push(f * step);
      if (name === 'throw') { h.actionT = f / frames; animate(h, 'throw', false, 0, false, 0); }
      joints.forEach((j, k) => { q.setFromEuler(j.rotation); rot[k].push(q.x, q.y, q.z, q.w); });
      bob.push(body.position.x, body.position.y, body.position.z);
      if (name !== 'throw') { const sub = 6; for (let s = 0; s < sub; s++) animate(h, sp.pose, sp.moving, sp.speed, sp.carrying, step / sub); }
    }
    // close the loop exactly (the throw clip starts and ends in the idle stance already)
    joints.forEach((_, k) => { const a = rot[k]; a.splice(a.length - 4, 4, a[0], a[1], a[2], a[3]); });
    bob.splice(bob.length - 3, 3, bob[0], bob[1], bob[2]);
    const tracks: THREE.KeyframeTrack[] = joints.map((j, k) => new THREE.QuaternionKeyframeTrack(`${j.name}.quaternion`, times, rot[k]));
    tracks.push(new THREE.VectorKeyframeTrack('body.position', times, bob));
    clips.push(new THREE.AnimationClip(name, sp.period, tracks));
  }
  for (const j of joints) j.rotation.set(0, 0, 0);
  body.position.set(0, 0, 0);
  return clips;
}

/** Slot name for a unit: streetwear outfits have their own slots, other looters use the class slot. */
export function characterSlot(kind: AnyKind, variant: number): string {
  const o = outfitFor(kind, variant);
  return o ? `char.looter.${o.ref}` : `char.${kind}`;
}

function rng(seed: number) { let s = seed % 2147483647 || 1; return () => { s = (s * 48271) % 2147483647; return s / 2147483647; }; }

function makeIcon(kind: AnyKind): THREE.Sprite {
  const isDef = kind === 'security' || kind === 'shield' || kind === 'firefighter';
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(kind, isDef ? '#36e0ff' : '#ff9a2e'), depthTest: false, transparent: true }));
  icon.scale.set(0.42, 0.42, 1); icon.position.y = 2.15; icon.renderOrder = 10;
  icon.visible = !(kind === 'civilian' || kind === 'shopkeeper' || kind === 'helper');
  return icon;
}

class GltfCharacter implements CharacterVisual {
  source = 'glb' as const;
  root = new THREE.Group();
  icon: THREE.Sprite;
  private mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  private carry: THREE.Object3D | null;
  private held: HeldObject;
  heldWick(out: THREE.Vector3) { return this.held.wickWorld(out); }
  constructor(kind: AnyKind, variant: number, scene: THREE.Object3D, clips: THREE.AnimationClip[]) {
    const model = skeletonClone(scene);
    const r = rng(variant + 91);
    // per-unit recolouring of named materials: skin tone always varies; casual clothing varies
    const skin = SKIN_TONES[Math.floor(r() * SKIN_TONES.length)];
    const top = CASUAL_TOPS[Math.floor(r() * CASUAL_TOPS.length)], legs = CASUAL_LEGS[Math.floor(r() * CASUAL_LEGS.length)];
    model.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh) return;
      m.castShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const out = mats.map((mm) => {
        const n = mm.name;
        if (model.getObjectByName('Hips') && (mm as THREE.MeshStandardMaterial).map) {
          // auto-rigged photo-textured model: a little self-light keeps it readable on the night street
          const c = (mm as THREE.MeshStandardMaterial).clone(); c.emissive = new THREE.Color(0xffffff); c.emissiveMap = c.map; c.emissiveIntensity = 0.22; c.roughness = 0.8; c.metalness = 0; return c;
        }
        if (n === 'skin' || n === 'top' || n === 'legs') { const c = (mm as THREE.MeshStandardMaterial).clone(); c.color.setHex(n === 'skin' ? skin : n === 'top' ? top : legs); return c; }
        return mm;
      });
      m.material = Array.isArray(m.material) ? out : out[0];
    });
    model.scale.setScalar(0.95 + r() * 0.08);
    this.root.add(model);
    this.carry = model.getObjectByName('carry') ?? null;
    if (!this.carry && model.getObjectByName('Hips')) {
      // auto-rigged models have no carry node: a cardboard box held at chest height shows the loot
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0xa77d4e, roughness: 0.95 }));
      box.position.set(0, 1.08, 0.32); box.castShadow = true; box.name = 'carry'; this.root.add(box); this.carry = box;
    }
    this.held = new HeldObject(model.getObjectByName('hand_socket') ?? model.getObjectByName('RightHand') ?? undefined);
    if (this.carry) this.carry.visible = false;
    this.mixer = new THREE.AnimationMixer(model);
    for (const c of clips) this.actions.set(c.name, this.mixer.clipAction(c));
    this.root.add(contactShadow());
    this.icon = makeIcon(kind); this.root.add(this.icon);
    this.mixer.setTime(r() * 3);
  }
  private play(name: string, timeScale: number) {
    const a = this.actions.get(name) ?? this.actions.get(name.startsWith('carry') ? name.replace('carry_', '') : 'idle') ?? this.actions.get('idle');
    if (!a) return;
    a.timeScale = timeScale;
    if (a === this.current) return;
    a.reset().play();
    if (this.current) a.crossFadeFrom(this.current, 0.2, false);
    this.current = a;
  }
  update(pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number, action = 0) {
    if (this.carry) this.carry.visible = carrying && pose !== 'throw';
    this.held.update(pose === 'throw' && action < THROW_RELEASE);
    if (pose === 'throw') {
      const a = this.actions.get('throw');
      if (a) { this.play('throw', 1); a.paused = true; a.time = action * a.getClip().duration; this.mixer.update(0); return; }
    }
    let clip: string = pose;
    if (pose === 'flee') clip = carrying ? 'carry_walk' : 'flee';
    else if (pose === 'walk' || pose === 'idle') clip = moving ? (speed > 3.3 ? 'run' : carrying ? 'carry_walk' : 'walk') : carrying ? 'carry_idle' : 'idle';
    const ts = clip === 'walk' ? speed / 3 : clip === 'run' ? speed / 4.2 : clip === 'carry_walk' ? speed / 2.4 : 1;
    this.play(clip, Math.max(0.4, ts));
    this.mixer.update(dt);
  }
}

/** the thrown object while it is still in the hand: a separate object parented to the hand socket until release */
class HeldObject {
  private obj: THREE.Group | null = null;
  constructor(private socket: THREE.Object3D | undefined) {}
  update(show: boolean) {
    if (!this.socket) return;
    if (show && !this.obj) { this.obj = buildIncendiary(); this.obj.rotation.x = Math.PI; this.obj.position.y = -0.04; this.socket.add(this.obj); }
    if (this.obj) this.obj.visible = show;
  }
  /** world position of the cloth tip, for the small flame while held */
  wickWorld(out: THREE.Vector3): boolean { if (!this.obj || !this.obj.visible) return false; this.obj.getObjectByName('wick')!.getWorldPosition(out); return true; }
}
export type { HeldObject };

class ProcCharacter implements CharacterVisual {
  source = 'procedural' as const;
  root: THREE.Object3D; icon: THREE.Sprite;
  heldWick(out: THREE.Vector3) { return this.held.wickWorld(out); }
  private held: HeldObject;
  constructor(private h: Humanoid) { this.root = h.root; this.icon = h.icon; this.held = new HeldObject(h.root.getObjectByName('hand_socket')); }
  update(pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number, action = 0) {
    this.h.actionT = action;
    animate(this.h, pose, moving, speed, carrying, dt);
    this.held.update(pose === 'throw' && action < THROW_RELEASE);
  }
}

/** Use the GLB in the unit's slot when it is loaded, otherwise fall back to the procedural figure. */
export function createCharacter(kind: AnyKind, variant: number): CharacterVisual {
  // a final model for the unit class wins over a temporary outfit placeholder; civilians alternate between the final street figures
  const own = characterSlot(kind, variant);
  const civ = kind === 'civilian' ? ['char.civilian', 'char.carrier', 'char.heavy'].filter((sl) => slotStatus(sl) === 'final') : [];
  const slot = civ.length ? civ[variant % civ.length] : slotStatus(own) === 'final' ? own : slotStatus(`char.${kind}`) === 'final' ? `char.${kind}` : own;
  const m = getModel(slot) ?? getModel(`char.${kind}`);
  if (m) return new GltfCharacter(kind, variant, m.scene, m.animations);
  return new ProcCharacter(buildHumanoid(kind, variant));
}
