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
  update(pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number, action?: number, /** show the firebomb in the hand during a throw */ held?: boolean): void;
  /** gallery playback (rigged GLB figures) */
  clipNames?(): string[];
  previewClip?(name: string, dt: number): void;
}

const JOINTS = ['torso', 'head', 'legL', 'legR', 'kneeL', 'kneeR', 'armL', 'armR', 'elbowL', 'elbowR'];

/** Animation clips every character GLB should provide (names are the contract with final assets). */
export const CLIP_NAMES = ['idle', 'walk', 'run', 'carry_idle', 'carry_walk', 'breach', 'collect', 'held', 'restrained', 'escorted', 'restrain', 'escort', 'brace', 'extinguish', 'throw', 'guide', 'flee', 'strike'] as const;
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
  strike: { pose: 'strike', moving: false, speed: 0, carrying: false, period: 0.6 },
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
      if (name === 'throw' || name === 'strike') { h.actionT = f / frames; animate(h, name, false, 0, false, 0); }
      joints.forEach((j, k) => { q.setFromEuler(j.rotation); rot[k].push(q.x, q.y, q.z, q.w); });
      bob.push(body.position.x, body.position.y, body.position.z);
      if (name !== 'throw' && name !== 'strike') { const sub = 6; for (let s = 0; s < sub; s++) animate(h, sp.pose, sp.moving, sp.speed, sp.carrying, step / sub); }
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
  private bar: THREE.Object3D | null = null;
  private held: HeldObject;
  /** this figure's own rhythm: standing clips a little faster or slower than its neighbours' */
  private tempo = 1;
  /** standing personality: head and upper body settle differently per figure, and the gaze wanders on its own clock */
  private quirk: { head?: THREE.Object3D; spine?: THREE.Object3D; saved: THREE.Quaternion[]; tilt: number; lean: number; twist: number; freq: number; off: number; w: number; t: number } = { saved: [], tilt: 0, lean: 0, twist: 0, freq: 0.2, off: 0, w: 0, t: 0 };
  heldWick(out: THREE.Vector3) { return this.held.wickWorld(out); }
  constructor(kind: AnyKind, variant: number, scene: THREE.Object3D, clips: THREE.AnimationClip[]) {
    const model = skeletonClone(scene);
    const r = rng(variant + 91);
    this.tempo = 0.86 + rng(variant * 31 + 5)() * 0.28;
    { const q = rng(variant * 53 + 11); const qk = this.quirk; qk.tilt = (q() - 0.5) * 0.22; qk.lean = (q() - 0.5) * 0.12; qk.twist = (q() - 0.5) * 0.3; qk.freq = 0.12 + q() * 0.22; qk.off = q() * 20; }
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
          const c = (mm as THREE.MeshStandardMaterial).clone(); c.emissive = new THREE.Color(0xffffff); c.emissiveMap = c.map; c.emissiveIntensity = 0.22; c.roughness = 0.8; c.metalness = 0;
          if (kind === 'firefighter' && fireKit && c.map) { const t = kitTexture(c.map, fireKit); if (t) { c.map = t; c.emissiveMap = t; } } // the city's own kit
          // passers-by share three models: each gets its own colour cast and brightness so the crowd does not look cloned
          if (kind === 'civilian' || kind === 'helper') {
            // passers-by share a few models: each gets a clearly different colour cast (jacket colours of a Paris evening)
            const pal = [0x9a3a32, 0x3a5a8a, 0xb8954a, 0x4a6a4a, 0x7a5a8a, 0xa8a49a, 0x2a3a5a, 0x8a6a4a];
            const r2 = rng(variant * 7919 + 13); const base = new THREE.Color(pal[Math.floor(r2() * pal.length)]);
            c.color.setRGB(0.55, 0.55, 0.55).lerp(base, 0.55).multiplyScalar(1.15 + r2() * 0.3);
          }
          else if (kind === 'runner' || kind === 'carrier' || kind === 'heavy' || kind === 'vandal' || kind === 'thrower') {
            // rioters: dark street clothes, each with its own cast (navy, olive, grey, maroon, black) and brightness
            const pal = [0x3a4660, 0x4a5236, 0x5a5a5e, 0x5a2e2e, 0x2a2a2e, 0x6a5a40];
            const r2 = rng(variant * 4271 + 7); const base = new THREE.Color(pal[Math.floor(r2() * pal.length)]);
            c.color.setRGB(0.7, 0.7, 0.7).lerp(base, 0.4).multiplyScalar(1.05 + r2() * 0.3);
          }
          else if (kind === 'security' || kind === 'shield' || kind === 'firefighter') { const r2 = rng(variant * 6151 + 3); c.color.setScalar(0.8 + r2() * 0.32); } // same uniform, washed and worn differently
          else if (kind === 'shopkeeper') { const r2 = rng(variant * 7919 + 13); c.color.setScalar(0.72 + r2() * 0.3); } // same uniform, a different build and shade per guard
          return c;
        }
        if (n === 'skin' || n === 'top' || n === 'legs') { const c = (mm as THREE.MeshStandardMaterial).clone(); c.color.setHex(n === 'skin' ? skin : n === 'top' ? top : legs); return c; }
        return mm;
      });
      m.material = Array.isArray(m.material) ? out : out[0];
    });
    model.scale.setScalar(0.95 + r() * 0.08);
    { model.scale.x *= 0.92 + r() * 0.18; model.scale.y *= 0.94 + r() * 0.12; model.scale.z = model.scale.x; } // tall, short, slim, broad
    this.root.add(model);
    this.carry = model.getObjectByName('carry') ?? null;
    if (!this.carry && model.getObjectByName('Hips')) {
      // auto-rigged models have no carry node: a cardboard box held at chest height shows the loot
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0xa77d4e, roughness: 0.95 }));
      box.position.set(0, 1.08, 0.32); box.castShadow = true; box.name = 'carry'; this.root.add(box); this.carry = box;
    }
    this.held = new HeldObject(kind === 'security' || kind === 'shield' ? undefined : model.getObjectByName('hand_socket') ?? model.getObjectByName('RightHand') ?? undefined); // officers throw gas, not a firebomb
    const rh = model.getObjectByName('RightHand');
    if (rh && kind !== 'shield' && kind !== 'security' && kind !== 'firefighter' && kind !== 'civilian') {
      // crowbar, only in the hand while breaking something
      rh.updateWorldMatrix(true, false); const ws = new THREE.Vector3(); rh.getWorldScale(ws); const rs = new THREE.Vector3(); model.getWorldScale(rs);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.75, 6), new THREE.MeshStandardMaterial({ color: 0x8a1f1a, roughness: 0.45, metalness: 0.6 }));
      bar.scale.setScalar(rs.x / ws.x); bar.position.set(0, (0.2 / ws.x) * rs.x, 0); bar.visible = false; rh.add(bar); this.bar = bar;
    }
    if (this.carry) this.carry.visible = false;
    if (kind === 'shield' && model.getObjectByName('Hips')) {
      // riot shield (London shield officer reference): clear polycarbonate with a dark rim, carried on the left forearm
      const arm = model.getObjectByName('LeftForeArm');
      if (arm) {
        const sh = new THREE.Group(); sh.name = 'shield';
        const pane = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.0, 0.02), new THREE.MeshStandardMaterial({ color: 0xcfe0ec, transparent: true, opacity: 0.45, roughness: 0.15, metalness: 0.2, depthWrite: false }));
        const rim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.04, 0.012), new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.6 }));
        rim.position.z = -0.008; rim.scale.set(1, 1, 1); sh.add(rim, pane); rim.visible = true;
        (rim.material as THREE.MeshStandardMaterial).wireframe = false;
        // the arm bone's scale is in the rig's units: undo it so the shield is 0.6 x 1.0 m
        arm.updateWorldMatrix(true, false); const ws = new THREE.Vector3(); arm.getWorldScale(ws); const rs = new THREE.Vector3(); model.getWorldScale(rs);
        sh.scale.setScalar(rs.x / ws.x); sh.position.set(0, 0, 0); arm.add(sh);
        // in bone space the forearm points along +Y: offset the shield in front of the forearm
        sh.position.set(0.12 / (rs.x / ws.x) * (rs.x / ws.x), 0.05, 0.12).multiplyScalar(ws.x > 0 ? 1 / ws.x : 1);
        sh.rotation.set(0, Math.PI / 2, 0);
      }
      // baton in the right hand (struck with when sent into the crowd)
      const hand = model.getObjectByName('RightHand');
      if (hand) {
        hand.updateWorldMatrix(true, false); const ws = new THREE.Vector3(); hand.getWorldScale(ws); const rs = new THREE.Vector3(); model.getWorldScale(rs);
        const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.55, 8), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 }));
        bat.name = 'baton'; bat.scale.setScalar(rs.x / ws.x); bat.position.set(0, (0.12 / ws.x) * rs.x, 0); bat.castShadow = true; hand.add(bat);
      }
    }
    this.mixer = new THREE.AnimationMixer(model);
    for (const c of clips) this.actions.set(c.name, this.mixer.clipAction(c));
    this.root.add(contactShadow());
    this.icon = makeIcon(kind); this.root.add(this.icon);
    this.mixer.setTime(r() * 3);
    this.quirk.head = model.getObjectByName('Head') ?? undefined; this.quirk.spine = model.getObjectByName('Spine01') ?? model.getObjectByName('Spine1') ?? model.getObjectByName('Spine') ?? undefined;
  }
  private qv = new THREE.Quaternion(); private qe = new THREE.Euler();
  /** undo last frame's offsets so they never pile up on a bone the clip does not drive */
  private unquirk() { const qk = this.quirk; [qk.head, qk.spine].forEach((b, i) => { if (b && qk.saved[i]) b.quaternion.copy(qk.saved[i]); }); qk.saved = []; }
  private applyQuirk(standing: boolean, dt: number) {
    const qk = this.quirk; qk.t += dt;
    qk.w += ((standing ? 1 : 0) - qk.w) * Math.min(1, dt * 2.5);
    if (qk.w < 0.01) return;
    const t = qk.t * qk.freq + qk.off;
    // the gaze drifts, pauses and drifts back (two slow waves, so neighbours never turn their heads together)
    const look = (Math.sin(t) * 0.7 + Math.sin(t * 2.3 + 1.3) * 0.3) * 0.45 + qk.twist;
    const bones: [THREE.Object3D | undefined, number, number, number][] = [
      [qk.head, qk.tilt * 0.6 + Math.sin(t * 0.7) * 0.05, look, qk.tilt],
      [qk.spine, 0, look * 0.25, qk.lean]];
    bones.forEach(([b, x, y, z], i) => {
      if (!b) return; qk.saved[i] = b.quaternion.clone();
      b.quaternion.multiply(this.qv.setFromEuler(this.qe.set(x * qk.w, y * qk.w, z * qk.w)));
    });
  }
  /** gallery: names of the clips this figure can play, and direct playback */
  clipNames(): string[] { return [...this.actions.keys()]; }
  previewClip(name: string, dt: number) { this.play(name, 1); this.mixer.update(dt); if (this.carry) this.carry.visible = name.startsWith('carry'); }
  private play(name: string, timeScale: number) {
    const a = this.actions.get(name) ?? this.actions.get(name.startsWith('carry') ? name.replace('carry_', '') : 'idle') ?? this.actions.get('idle');
    if (!a) return;
    const oneShot = name === 'throw' || name === 'strike' || name === 'pickup';
    // standing and working loops run at the figure's own tempo; walk/run stay matched to the feet (only a hint of it)
    const loco = name === 'walk' || name === 'run' || name === 'carry_walk' || name === 'flee' || name === 'escort' || name === 'escorted';
    a.timeScale = oneShot ? timeScale : timeScale * (loco ? 1 + (this.tempo - 1) * 0.25 : this.tempo);
    if (a === this.current) return;
    a.reset().play();
    // start a loop somewhere in its cycle: figures that start walking or waiting together never move in lockstep
    if (!oneShot) a.time = Math.random() * a.getClip().duration;
    if (this.current) a.crossFadeFrom(this.current, name === 'throw' || name === 'strike' || name === 'pickup' ? 0.12 : 0.3, false); // one-shot moves blend in fast
    this.current = a;
  }
  update(pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number, action = 0, held = true) {
    if (this.carry) this.carry.visible = carrying && pose !== 'throw';
    this.held.update(held && pose === 'throw' && action < THROW_RELEASE);
    if (pose === 'throw' || pose === 'strike' || pose === 'pickup') {
      const a = this.actions.get(pose);
      // the clip is scrubbed by the action's progress, but the mixer clock still runs so the crossfade into it completes (it stayed invisible)
      if (a) { this.unquirk(); this.quirk.w = 0; this.play(pose, 1); a.paused = true; this.mixer.update(Math.max(dt, 1 / 60)); a.time = action * a.getClip().duration; this.mixer.update(0); return; }
    }
    let clip: string = pose;
    this.unquirk();
    if ((pose === 'breach' || pose === 'barrier') && this.actions.has('smash')) clip = 'smash'; // crowbar blows on the shutter / barrier
    if (this.bar) this.bar.visible = clip === 'smash';
    if (pose === 'flee') clip = carrying ? 'carry_walk' : 'flee';
    // auto-rigged clips: casual walk ~0.75 m/s, carry walk ~0.35 m/s, run ~2.4 m/s at speed 1 (measured from the foot travel).
    // Above ~1.9 m/s a walk would need more than 2.5x playback: switch to the run cycle so the feet keep up with the body.
    else if (pose === 'walk' || pose === 'idle') clip = moving ? (speed > 1.9 ? 'run' : carrying && speed < 0.9 ? 'carry_walk' : 'walk') : carrying ? 'carry_idle' : 'idle';
    const natural: Record<string, number> = { walk: 0.75, run: 2.4, carry_walk: 0.35, flee: 2.4, escort: 0.75, escorted: 0.75 };
    const ts = natural[clip] ? speed / natural[clip] : 1;
    this.play(clip, Math.min(2.6, Math.max(0.5, ts)));
    this.mixer.update(dt);
    this.applyQuirk(clip === 'idle' || clip === 'carry_idle' || clip === 'brace' || clip === 'guide', dt);
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
  constructor(private h: Humanoid) { this.root = h.root; this.icon = h.icon; this.held = new HeldObject(h.kind === 'security' || h.kind === 'shield' ? undefined : h.root.getObjectByName('hand_socket')); }
  update(pose: Pose, moving: boolean, speed: number, carrying: boolean, dt: number, action = 0, held = true) {
    this.h.actionT = action;
    animate(this.h, pose, moving, speed, carrying, dt);
    this.held.update(held && pose === 'throw' && action < THROW_RELEASE);
  }
}

/** Use the GLB in the unit's slot when it is loaded, otherwise fall back to the procedural figure. */
/** player's figure choice per role (Collectie screen): slot lists; empty or missing = the default look */
let figureChoice: Record<string, string[]> = {};
/** each city's fire service kit, after the reference pictures (ui/firefighters/<city>.webp): suit colour (null keeps the
 *  dark kit of the model) and helmet colour (null keeps the yellow helmet). Applied by recolouring the model's texture. */
const FIRE_KITS: Record<string, { suit: [number, number, number] | null; helmet: [number, number, number] | null }> = {
  saopaulo: { suit: [0.66, 0.5, 0.3], helmet: [0.8, 0.09, 0.07] }, // tan, red helmet
  milan: { suit: null, helmet: [0.8, 0.09, 0.07] }, // black, red helmet
  london: { suit: [0.64, 0.51, 0.34], helmet: null }, // tan, yellow helmet
  berlin: { suit: [0.12, 0.14, 0.22], helmet: [0.93, 0.92, 0.74] }, // navy, pale helmet
  paris: { suit: [0.12, 0.14, 0.24], helmet: [0.78, 0.8, 0.84] }, // navy, chrome helmet
  amsterdam: { suit: [0.64, 0.51, 0.34], helmet: [0.9, 0.93, 0.58] }, // tan, lime-white helmet
};
let fireKit = '';
export function setFireKit(city: string) { fireKit = city; }
const kitCache = new Map<string, THREE.Texture>();
function kitTexture(src: THREE.Texture, city: string): THREE.Texture | null {
  const kit = FIRE_KITS[city]; const img = src.image as CanvasImageSource & { width: number; height: number } | undefined;
  if (!kit || !img || !img.width) return null;
  const key = city + ':' + src.uuid; const hit = kitCache.get(key); if (hit) return hit;
  const S = Math.min(1024, img.width); const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const cx = cv.getContext('2d', { willReadFrequently: true }); if (!cx) return null;
  cx.drawImage(img, 0, 0, S, S); const d = cx.getImageData(0, 0, S, S); const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx, sat = mx > 0 ? (mx - mn) / mx : 0;
    let h = 0; if (mx > mn) { h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; }
    let out: [number, number, number] | null = null;
    if (kit.helmet && sat > 0.45 && v > 0.4 && h >= 34 && h < 51) { const k = v / 0.92; out = [kit.helmet[0] * k, kit.helmet[1] * k, kit.helmet[2] * k]; } // the helmet's warm yellow (the lime stripes sit at 52-64)
    else if (kit.suit && sat < 0.32 && v < 0.52) {
      const k = v / 0.27; const w = Math.min(1, Math.max(0, (v - 0.07) / 0.07)); // the black boots and gloves stay black
      out = [r + (kit.suit[0] * k - r) * w, g + (kit.suit[1] * k - g) * w, b + (kit.suit[2] * k - b) * w];
    }
    if (out) { px[i] = Math.min(255, out[0] * 255); px[i + 1] = Math.min(255, out[1] * 255); px[i + 2] = Math.min(255, out[2] * 255); }
  }
  cx.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.flipY = src.flipY; t.colorSpace = src.colorSpace; t.wrapS = src.wrapS; t.wrapT = src.wrapT; t.anisotropy = src.anisotropy;
  kitCache.set(key, t); return t;
}
export function setFigureChoices(c: Record<string, string[]> | undefined) { figureChoice = c ?? {}; }

/** a figure from a specific model slot (gallery, and roles with a chosen look); appearance only, never stats */
export function createCharacterFromSlot(slot: string, kind: AnyKind, variant = 1): CharacterVisual | null {
  const m = getModel(slot); return m ? new GltfCharacter(kind, variant, m.scene, m.animations) : null;
}

export function createCharacter(kind: AnyKind, variant: number): CharacterVisual {
  const chosen = (figureChoice[kind] ?? []).filter((sl) => getModel(sl));
  if (chosen.length) { const c = createCharacterFromSlot(chosen[variant % chosen.length], kind, variant); if (c) return c; }
  // a final model for the unit class wins over a temporary outfit placeholder; civilians alternate between the final street figures
  const own = characterSlot(kind, variant);
  const civ = kind === 'civilian' ? ['char.civilian', 'char.carrier', 'char.heavy'].filter((sl) => slotStatus(sl) === 'final') : [];
  // roles without their own finished model borrow a realistic rigged figure that fits (never the blocky placeholder)
  const STAND_IN: Partial<Record<AnyKind, string[]>> = {
    vandal: ['char.looter.01_tracksuit_arms_spread', 'char.runner', 'char.looter.07_navy_runner'],
    thrower: ['char.runner', 'char.looter.07_navy_runner', 'char.looter.01_tracksuit_arms_spread'],
    shopkeeper: ['char.security'], helper: ['char.civilian', 'char.carrier'], // each shop has its own door security
  };
  // a looting group mixes every finished rioter model of the same build, so a group is never a row of clones
  const MIX: Partial<Record<AnyKind, string[]>> = {
    carrier: ['char.carrier', 'char.looter.07_navy_runner', 'char.looter.01_tracksuit_arms_spread', 'char.runner'],
    runner: ['char.runner', 'char.looter.07_navy_runner', 'char.looter.01_tracksuit_arms_spread'],
    heavy: ['char.heavy', 'char.carrier', 'char.looter.07_navy_runner'],
  };
  const mix = (MIX[kind] ?? []).filter((sl) => slotStatus(sl) === 'final');
  if (mix.length > 1 && !(figureChoice[kind] ?? []).length) { const m2 = getModel(mix[variant % mix.length]); if (m2) return new GltfCharacter(kind, variant, m2.scene, m2.animations); }
  const pool = (STAND_IN[kind] ?? []).filter((sl) => slotStatus(sl) === 'final');
  const slot = civ.length ? civ[variant % civ.length] : slotStatus(own) === 'final' ? own : slotStatus(`char.${kind}`) === 'final' ? `char.${kind}` : pool.length ? pool[variant % pool.length] : own;
  const m = getModel(slot) ?? getModel(`char.${kind}`);
  if (m) return new GltfCharacter(kind, variant, m.scene, m.animations);
  return new ProcCharacter(buildHumanoid(kind, variant));
}
