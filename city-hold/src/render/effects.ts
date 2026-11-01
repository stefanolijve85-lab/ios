import * as THREE from 'three';
import { flameTexture, smokeTexture } from './textures';
import { mat } from './humans';

// Particle effects built from the effects pack (assets/effects_characters, effect_presets.json).
// The five PNGs are static alpha sprites; motion comes from pooled particles that grow, rise/drift, rotate and
// fade with their own seeds. Each effect type is one draw call. A shared budget caps the decorative particles
// (64 mobile / 160 desktop, from the presets). Effects never change gameplay: radius, damage and timing stay in
// the simulation. depthTest on, depthWrite off; fire is additive, smoke/explosion/tear gas use normal alpha.

export type FxKind = 'fire' | 'smoke' | 'sparks' | 'explosion' | 'tear_gas' | 'spray' | 'flare';

interface Preset { life: [number, number]; scale: [number, number]; opacity: number; rise: [number, number]; drift: number; rate: [number, number]; blend: 'add' | 'normal'; spin: number }
// effect_presets.json starting values (rise in m/s, scale start/end in m, spawn per s mobile/desktop)
const PRESETS: Record<FxKind, Preset> = {
  // fire: normal alpha reads as flames on both light and dark ground; additive washed into round blobs (compared in #fxroom)
  fire: { life: [0.5, 1.1], scale: [0.8, 1.9], opacity: 0.85, rise: [0.4, 1.0], drift: 0.15, rate: [4, 8], blend: 'normal', spin: 0.15 },
  smoke: { life: [3, 5], scale: [0.8, 2.8], opacity: 0.3, rise: [0.3, 0.6], drift: 0.2, rate: [2, 4], blend: 'normal', spin: 0.25 },
  sparks: { life: [0.2, 0.6], scale: [0.2, 0.5], opacity: 0.8, rise: [0.5, 1.5], drift: 1.4, rate: [2, 4], blend: 'add', spin: 2 },
  explosion: { life: [0.6, 1.1], scale: [0.25, 2.0], opacity: 0.9, rise: [0.2, 0.5], drift: 0.2, rate: [1, 2], blend: 'normal', spin: 0.4 },
  tear_gas: { life: [3, 6], scale: [0.7, 3.2], opacity: 0.3, rise: [0.02, 0.1], drift: 0.25, rate: [2, 4], blend: 'normal', spin: 0.15 },
  spray: { life: [0.5, 0.8], scale: [0.25, 0.9], opacity: 0.55, rise: [0.1, 0.3], drift: 0.4, rate: [10, 16], blend: 'normal', spin: 0.5 },
  flare: { life: [0.3, 0.5], scale: [0.2, 0.4], opacity: 0.9, rise: [0.5, 1.0], drift: 1.6, rate: [8, 14], blend: 'add', spin: 1 },
};
export const PARTICLE_CAP = { mobile: 64, desktop: 160 };

interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; s0: number; s1: number; rot: number; vr: number; op: number }

const loader = new THREE.TextureLoader();
const loaded = new Map<string, Promise<THREE.Texture>>();
/** sprite from public/fx (made by tools/prepare_fx.py). The uniform starts with the procedural texture and is
 *  switched to the loaded sprite; textures are never mutated after upload (keeps three.js' bookkeeping intact). */
function bindSprite(uniform: { value: THREE.Texture }, name: string | null) {
  if (!name) return;
  let pr = loaded.get(name);
  if (!pr) { pr = loader.loadAsync(`fx/${name}.png`).then((t) => { t.colorSpace = THREE.SRGBColorSpace; return t; }); loaded.set(name, pr); }
  pr.then((t) => { uniform.value = t; }).catch(() => { /* keep procedural fallback */ });
}

class Field {
  readonly points: THREE.Points;
  parts: P[] = [];
  private pos: Float32Array; private size: Float32Array; private alpha: Float32Array; private rot: Float32Array;
  constructor(readonly kind: FxKind, readonly cap: number, tex: THREE.Texture, tint: number, sprite: string | null = null) {
    this.pos = new Float32Array(cap * 3); this.size = new Float32Array(cap); this.alpha = new Float32Array(cap); this.rot = new Float32Array(cap);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('palpha', new THREE.BufferAttribute(this.alpha, 1));
    g.setAttribute('prot', new THREE.BufferAttribute(this.rot, 1));
    const add = PRESETS[kind].blend === 'add';
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, tint: { value: new THREE.Color(tint) }, scale: { value: 400 } },
      vertexShader: `attribute float psize; attribute float palpha; attribute float prot; varying float va; varying float vr; uniform float scale;
        void main(){ va = palpha; vr = prot; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 tint; varying float va; varying float vr;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float cs = cos(vr), sn = sin(vr);
          vec2 uv = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y) + 0.5;
          if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;
          vec4 t = texture2D(map, vec2(uv.x, 1.0 - uv.y));
          float a = t.a * va; if (a < 0.004) discard;
          ${add ? 'gl_FragColor = vec4(t.rgb * tint * a, a);' : 'gl_FragColor = vec4(t.rgb * tint, a);'}
        }`,
      transparent: true, depthTest: true, depthWrite: false,
      blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false;
    this.points.renderOrder = add ? 6 : 5;
    bindSprite(m.uniforms.map as { value: THREE.Texture }, sprite);
  }
  // pixels per metre at distance 1 for the ~36-40° camera: h / (2 tan(fov/2))
  setScale(h: number) { (this.points.material as THREE.ShaderMaterial).uniforms.scale.value = h * 1.45; }
  update(dt: number) {
    const k = this.kind;
    const buoy = k === 'fire' ? 0.3 : k === 'sparks' || k === 'flare' || k === 'spray' ? -3.5 : 0.02;
    for (const p of this.parts) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy += buoy * dt; p.rot += p.vr * dt;
      if (k === 'smoke' || k === 'tear_gas') { p.vx *= 1 - dt * 0.15; p.vz *= 1 - dt * 0.15; }
      if (p.y < 0.03 && p.vy < 0) { p.y = 0.03; p.vy *= -0.2; p.vx *= 0.5; p.vz *= 0.5; }
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
    const n = Math.min(this.parts.length, this.cap);
    for (let i = 0; i < n; i++) {
      const p = this.parts[i]; const t = p.life / p.max;
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
      this.size[i] = p.s0 + (p.s1 - p.s0) * (1 - (1 - t) * (1 - t));
      this.alpha[i] = p.op * Math.min(1, t / 0.15) * Math.pow(1 - t, k === 'smoke' || k === 'tear_gas' ? 1.2 : 0.8);
      this.rot[i] = p.rot;
    }
    const g = this.points.geometry;
    for (const a of ['position', 'psize', 'palpha', 'prot']) (g.attributes[a] as THREE.BufferAttribute).needsUpdate = true;
    g.setDrawRange(0, n);
    this.points.visible = n > 0;
  }
}

export interface FallingBox { mesh: THREE.Mesh; vy: number; vx: number; vz: number; t: number; rest: boolean }

let seedState = 12345;
const rnd = () => { seedState = (seedState * 16807) % 2147483647; return seedState / 2147483647; };
const range = (a: [number, number]) => a[0] + rnd() * (a[1] - a[0]);

/** looping emitter with a stable id (one per fire / hose); when its source stops being refreshed it ends */
interface Emitter { id: string; kind: FxKind; x: number; y: number; z: number; spread: number; strength: number; acc: number; seen: boolean; tail: number; dir?: [number, number, number]; scale: number }

export class Effects {
  readonly group = new THREE.Group();
  private fields: Record<FxKind, Field>;
  private emitters = new Map<string, Emitter>();
  boxes: FallingBox[] = [];
  private fireLights: THREE.PointLight[] = [];
  private boxGeo = new THREE.BoxGeometry(0.44, 0.3, 0.32);
  readonly cap: number;
  private oneShots = new Set<string>();

  constructor(scene: THREE.Scene, public reduced: boolean) {
    this.cap = reduced ? PARTICLE_CAP.mobile : PARTICLE_CAP.desktop;
    const c = this.cap;
    const share: Record<FxKind, number> = { fire: 0.22, smoke: 0.24, sparks: 0.12, explosion: 0.05, tear_gas: 0.1, spray: 0.17, flare: 0.1 };
    const n = (k: FxKind, min: number) => Math.max(min, Math.floor(c * share[k]));
    this.fields = {
      fire: new Field('fire', n('fire', 6), flameTexture(), 0xffffff, 'fire'),
      smoke: new Field('smoke', n('smoke', 6), smokeTexture(), 0xa8a8b0, 'smoke'),
      sparks: new Field('sparks', n('sparks', 4), flameTexture(), 0xffffff, 'sparks'),
      explosion: new Field('explosion', n('explosion', 2), flameTexture(), 0xffffff, 'explosion'),
      tear_gas: new Field('tear_gas', n('tear_gas', 4), smokeTexture(), 0xf2f0ea, 'tear_gas'),
      spray: new Field('spray', n('spray', 4), smokeTexture(), 0xeaf6ff, 'tear_gas'),
      flare: new Field('flare', n('flare', 4), flameTexture(), 0x9feaff),
    };
    for (const k of ['tear_gas', 'smoke', 'explosion', 'spray', 'fire', 'sparks', 'flare'] as FxKind[]) this.group.add(this.fields[k].points);
    scene.add(this.group);
    if (!reduced) for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xff7a2a, 0, 14, 1.6); this.fireLights.push(l); this.group.add(l); }
  }

  /** live decorative particles across all effect types */
  get count() { let k = 0; for (const f of Object.values(this.fields)) k += f.parts.length; return k; }
  activeEmitters() { return this.emitters.size; }

  setViewport(h: number) { for (const f of Object.values(this.fields)) f.setScale(h); }

  private spawn(kind: FxKind, x: number, y: number, z: number, spread: number, o: Partial<{ vx: number; vz: number; vy: number; scaleMul: number }> = {}) {
    const f = this.fields[kind];
    if (f.parts.length >= f.cap || this.count >= this.cap) return;
    const pr = PRESETS[kind]; const a = rnd() * Math.PI * 2; const sm = o.scaleMul ?? 1;
    f.parts.push({
      x: x + (rnd() - 0.5) * spread, y, z: z + (rnd() - 0.5) * spread * 0.7,
      vx: o.vx ?? Math.cos(a) * pr.drift * rnd(), vy: o.vy ?? range(pr.rise), vz: o.vz ?? Math.sin(a) * pr.drift * rnd(),
      life: 0, max: range(pr.life), s0: pr.scale[0] * sm, s1: pr.scale[1] * sm, rot: rnd() * Math.PI * 2, vr: (rnd() - 0.5) * pr.spin * 2, op: pr.opacity,
    });
  }

  /** keep a looping emitter alive this frame (call every frame while its source exists) */
  emit(id: string, kind: FxKind, x: number, y: number, z: number, spread = 1, strength = 1, scale = 1) {
    let e = this.emitters.get(id);
    if (!e) { e = { id, kind, x, y, z, spread, strength, acc: 0, seen: true, tail: 0, scale }; this.emitters.set(id, e); }
    e.x = x; e.y = y; e.z = z; e.strength = strength; e.seen = true; e.tail = 0; e.scale = scale;
  }

  /** fire = flames + dark smoke column; smoke drifts up and away from street level so routes stay readable */
  burn(id: string, x: number, z: number, strength: number) {
    this.emit(`fire:${id}`, 'fire', x, 0.25, z, 1.2, strength);
    this.emit(`smoke:${id}`, 'smoke', x, 2.0, z, 0.8, strength);
  }

  /** one-shot visual event, deduplicated by event id (never re-triggered by later updates) */
  event(eventId: string, kind: 'sparks' | 'explosion' | 'glass' | 'intercept', x: number, z: number) {
    if (this.oneShots.has(eventId)) return;
    this.oneShots.add(eventId); if (this.oneShots.size > 400) this.oneShots.clear();
    const mob = this.reduced;
    if (kind === 'explosion') { // visual only: a short flash with separate sparks and smoke, no damage
      for (let i = 0; i < (mob ? 1 : 2); i++) this.spawn('explosion', x, 1.0, z, 0.6, { vy: 0.3 });
      for (let i = 0; i < (mob ? 2 : 4); i++) this.spawn('sparks', x, 0.9, z, 0.6, { vx: (rnd() - 0.5) * 4, vy: 1.5 + rnd() * 2, vz: (rnd() - 0.5) * 4 });
      for (let i = 0; i < (mob ? 1 : 3); i++) this.spawn('smoke', x, 1.6, z, 1.2, { scaleMul: 1.2 });
    } else if (kind === 'sparks') {
      for (let i = 0; i < (mob ? 2 : 4); i++) this.spawn('sparks', x, 1.0, z, 0.4, { vx: (rnd() - 0.5) * 3, vy: 1 + rnd() * 1.5, vz: (rnd() - 0.5) * 3 });
    } else if (kind === 'glass') {
      for (let i = 0; i < (mob ? 4 : 10); i++) this.spawn('flare', x + (rnd() - 0.5) * 3, 1.2 + rnd(), z - 0.4, 0.2, { vx: (rnd() - 0.5) * 1.5, vy: 0.5 + rnd(), vz: 0.5 + rnd() * 1.2, scaleMul: 0.6 });
    } else {
      for (let i = 0; i < (mob ? 4 : 10); i++) { const a = rnd() * Math.PI * 2; this.spawn('flare', x, 1.1, z, 0.1, { vx: Math.cos(a) * 1.6, vy: 0.6 + rnd(), vz: Math.sin(a) * 1.6 }); }
    }
  }

  /** compatibility helpers */
  glassBurst(x: number, z: number) { this.event(`glass:${x.toFixed(1)}:${z.toFixed(1)}`, 'glass', x, z); }
  private burstN = 0;
  burst(x: number, z: number, _c: 'cyan' | 'orange') { this.event(`burst:${this.burstN++}`, 'intercept', x, z); }

  /** hose / extinguisher jet from the nozzle towards the target (emitter per firefighter) */
  sprayAt(x: number, z: number, tx: number, tz: number, _dt: number, id = 'default') {
    const dx = tx - x, dz = tz - z; const d = Math.hypot(dx, dz) || 1;
    this.emit(`spray:${id}`, 'spray', x + (dx / d) * 0.45, 1.1, z + (dz / d) * 0.45, 0.1, 1);
    const sp = Math.min(4.5, d * 1.4);
    this.emitters.get(`spray:${id}`)!.dir = [(dx / d) * sp, 0.6, (dz / d) * sp];
  }

  setFireLights(fires: { x: number; z: number }[], time: number) {
    this.fireLights.forEach((l, i) => {
      const f = fires[i];
      if (!f) { l.intensity = 0; return; }
      l.position.set(f.x, 1.4, f.z); l.intensity = 22 + Math.sin(time * 23 + i) * 5 + Math.sin(time * 7.3) * 3;
    });
  }

  dropBox(x: number, z: number) {
    const m = new THREE.Mesh(this.boxGeo, mat(0xa77d4e, 0.95)); m.position.set(x, 1.1, z); m.castShadow = true;
    this.group.add(m);
    this.boxes.push({ mesh: m, vy: 1.2, vx: (rnd() - 0.5) * 1.5, vz: (rnd() - 0.5) * 1.5, t: 0, rest: false });
  }

  /** dt is the game's scaled delta (0 while paused); gaps after a tab switch are clamped */
  update(dt: number) {
    dt = Math.min(Math.max(dt, 0), 0.1);
    if (dt === 0) return; // paused: everything holds still
    for (const e of [...this.emitters.values()]) {
      if (!e.seen) {
        // source gone (extinguished / removed): stop now; a fire leaves a short smoke tail, then the emitter is removed
        if (e.kind === 'fire' && e.scale >= 1) {
          if (e.tail === 0) e.tail = 2.5;
          e.tail -= dt;
          if (rnd() < dt * (this.reduced ? 1.5 : 3)) this.spawn('smoke', e.x, 0.6, e.z, 0.8, { scaleMul: 0.7 });
          if (e.tail > 0) continue;
        }
        this.emitters.delete(e.id); continue;
      }
      e.seen = false;
      const pr = PRESETS[e.kind]; const rate = (this.reduced ? pr.rate[0] : pr.rate[1]) * Math.max(0.2, e.strength);
      e.acc += rate * dt;
      while (e.acc >= 1) {
        e.acc -= 1;
        if (e.kind === 'spray' && e.dir) this.spawn('spray', e.x, e.y, e.z, 0.1, { vx: e.dir[0] + (rnd() - 0.5) * 0.6, vy: e.dir[1] + rnd() * 0.4, vz: e.dir[2] + (rnd() - 0.5) * 0.6 });
        else if (e.kind === 'smoke') this.spawn('smoke', e.x, e.y, e.z, e.spread, { vx: 0.25 + rnd() * 0.3, vz: -0.15 - rnd() * 0.25, scaleMul: e.scale });
        else if (e.kind === 'fire') this.spawn('fire', e.x, e.y, e.z, e.spread, { vx: (rnd() - 0.5) * 0.2, vz: (rnd() - 0.5) * 0.2, scaleMul: e.scale, vy: e.scale < 1 ? 0.3 : undefined });
        else this.spawn(e.kind, e.x, e.y, e.z, e.spread);
      }
    }
    for (const f of Object.values(this.fields)) f.update(dt);
    for (const b of this.boxes) {
      b.t += dt;
      if (!b.rest) {
        b.vy -= 9.8 * dt; b.mesh.position.x += b.vx * dt; b.mesh.position.z += b.vz * dt; b.mesh.position.y += b.vy * dt;
        b.mesh.rotation.x += b.vx * dt * 3; b.mesh.rotation.z += b.vz * dt * 3;
        if (b.mesh.position.y <= 0.15) { b.mesh.position.y = 0.15; if (Math.abs(b.vy) > 1.5) { b.vy = -b.vy * 0.35; b.vx *= 0.5; b.vz *= 0.5; } else { b.rest = true; b.mesh.rotation.x = 0; b.mesh.rotation.z = 0; } }
      }
    }
    for (const b of this.boxes) if (b.t > 6) this.group.remove(b.mesh);
    this.boxes = this.boxes.filter((b) => b.t <= 6);
  }

  dispose() {
    this.emitters.clear(); this.oneShots.clear();
    // GPU resources go with the renderer (disposing these materials separately broke a restart in three.js' program cache)
    for (const f of Object.values(this.fields)) f.parts = [];
    this.group.parent?.remove(this.group);
  }
}
