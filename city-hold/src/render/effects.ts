import * as THREE from 'three';
import { flameTexture, smokeTexture } from './textures';
import { mat } from './humans';

// Local, independent effects: fire, smoke, extinguisher spray, falling boxes, interception bursts.

interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number }

export class ParticleField {
  readonly points: THREE.Points;
  private parts: Particle[] = [];
  private pos: Float32Array; private size: Float32Array; private alpha: Float32Array;
  constructor(private cap: number, tex: THREE.Texture, additive: boolean, color = 0xffffff) {
    this.pos = new Float32Array(cap * 3); this.size = new Float32Array(cap); this.alpha = new Float32Array(cap);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('palpha', new THREE.BufferAttribute(this.alpha, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, color: { value: new THREE.Color(color) }, scale: { value: 400 } },
      vertexShader: `attribute float psize; attribute float palpha; varying float va; uniform float scale;
        void main(){ va = palpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 color; varying float va;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(t.rgb*color, t.a*va); if (gl_FragColor.a < 0.01) discard; }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; this.points.renderOrder = 5;
  }
  setScale(h: number) { (this.points.material as THREE.ShaderMaterial).uniforms.scale.value = h * 0.9; }
  emit(p: Particle) { if (this.parts.length < this.cap) this.parts.push(p); }
  update(dt: number, buoyancy = 0) {
    const ps = this.parts;
    for (const p of ps) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy += buoyancy * dt; }
    this.parts = ps.filter((p) => p.life < p.max);
    const n = this.parts.length;
    for (let i = 0; i < this.cap; i++) {
      if (i < n) {
        const p = this.parts[i]; const t = p.life / p.max;
        this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
        this.size[i] = p.size * (0.6 + t * 0.9); this.alpha[i] = Math.sin(Math.PI * Math.min(1, t * 1.2)) * 0.95;
      } else this.alpha[i] = 0;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true; (g.attributes.psize as THREE.BufferAttribute).needsUpdate = true; (g.attributes.palpha as THREE.BufferAttribute).needsUpdate = true;
    g.setDrawRange(0, Math.max(n, 1));
  }
}

export interface FallingBox { mesh: THREE.Mesh; vy: number; vx: number; vz: number; t: number; rest: boolean }

export class Effects {
  readonly group = new THREE.Group();
  fire: ParticleField; smoke: ParticleField; spray: ParticleField; spark: ParticleField;
  boxes: FallingBox[] = [];
  private fireLights: THREE.PointLight[] = [];
  private boxGeo = new THREE.BoxGeometry(0.44, 0.3, 0.32);
  constructor(scene: THREE.Scene, public reduced: boolean) {
    const cap = reduced ? 120 : 600;
    this.fire = new ParticleField(cap, flameTexture(), true, 0xffffff);
    this.smoke = new ParticleField(cap, smokeTexture(), false, 0x9a9aa4);
    this.spray = new ParticleField(200, smokeTexture(), false, 0xf4f8ff);
    this.spark = new ParticleField(150, flameTexture(), true, 0x66e6ff);
    this.group.add(this.smoke.points, this.fire.points, this.spray.points, this.spark.points);
    scene.add(this.group);
    if (!reduced) for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xff7a2a, 0, 14, 1.6); this.fireLights.push(l); this.group.add(l); }
  }

  setViewport(h: number) { for (const f of [this.fire, this.smoke, this.spray, this.spark]) f.setScale(h); }

  burn(x: number, z: number, dt: number, strength: number) {
    const rate = (this.reduced ? 12 : 45) * strength;
    let n = rate * dt; while (n > 0) {
      if (Math.random() < n) this.fire.emit({ x: x + (Math.random() - 0.5) * 1.4, y: 0.2 + Math.random() * 0.4, z: z + (Math.random() - 0.5) * 1.0, vx: (Math.random() - 0.5) * 0.3, vy: 1.2 + Math.random() * 1.2, vz: (Math.random() - 0.5) * 0.3, life: 0, max: 0.6 + Math.random() * 0.5, size: 0.9 + Math.random() * 0.8 });
      n -= 1;
    }
    // smoke rises above but drifts away from the street level so routes stay readable
    let m = rate * 0.35 * dt; while (m > 0) {
      if (Math.random() < m) this.smoke.emit({ x: x + (Math.random() - 0.5), y: 1.8 + Math.random(), z, vx: 0.3 + Math.random() * 0.3, vy: 1.3 + Math.random() * 0.6, vz: -0.2 - Math.random() * 0.3, life: 0, max: 3 + Math.random() * 2, size: 2.0 + Math.random() * 1.5 });
      m -= 1;
    }
  }

  setFireLights(fires: { x: number; z: number }[], time: number) {
    this.fireLights.forEach((l, i) => {
      const f = fires[i];
      if (!f) { l.intensity = 0; return; }
      l.position.set(f.x, 1.4, f.z); l.intensity = 24 + Math.sin(time * 23 + i) * 6 + Math.sin(time * 7.3) * 4;
    });
  }

  sprayAt(x: number, z: number, tx: number, tz: number, dt: number) {
    if (Math.random() < dt * 30) {
      const dx = tx - x, dz = tz - z; const d = Math.hypot(dx, dz) || 1;
      this.spray.emit({ x: x + dx / d * 0.5, y: 1.0, z: z + dz / d * 0.5, vx: dx / d * 3 + (Math.random() - 0.5), vy: 0.2, vz: dz / d * 3 + (Math.random() - 0.5), life: 0, max: 0.8, size: 0.7 });
    }
  }

  burst(x: number, z: number, color: 'cyan' | 'orange') {
    const f = color === 'cyan' ? this.spark : this.fire;
    for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2; f.emit({ x, y: 1.1, z, vx: Math.cos(a) * 1.6, vy: 0.6 + Math.random(), vz: Math.sin(a) * 1.6, life: 0, max: 0.5, size: 0.35 }); }
  }

  dropBox(x: number, z: number) {
    const m = new THREE.Mesh(this.boxGeo, mat(0xa77d4e, 0.95)); m.position.set(x, 1.1, z); m.castShadow = true;
    this.group.add(m);
    this.boxes.push({ mesh: m, vy: 1.2, vx: (Math.random() - 0.5) * 1.5, vz: (Math.random() - 0.5) * 1.5, t: 0, rest: false });
  }

  update(dt: number) {
    this.fire.update(dt, 0.5); this.smoke.update(dt, 0.1); this.spray.update(dt, -2); this.spark.update(dt, -3);
    for (const b of this.boxes) {
      b.t += dt;
      if (!b.rest) {
        b.vy -= 9.8 * dt; b.mesh.position.x += b.vx * dt; b.mesh.position.z += b.vz * dt; b.mesh.position.y += b.vy * dt;
        b.mesh.rotation.x += b.vx * dt * 3; b.mesh.rotation.z += b.vz * dt * 3;
        if (b.mesh.position.y <= 0.15) { b.mesh.position.y = 0.15; if (Math.abs(b.vy) > 1.5) { b.vy = -b.vy * 0.35; b.vx *= 0.5; b.vz *= 0.5; } else { b.rest = true; b.mesh.rotation.x = 0; b.mesh.rotation.z = 0; } }
      }
    }
    for (const b of this.boxes) if (b.t > 6) { this.group.remove(b.mesh); }
    this.boxes = this.boxes.filter((b) => b.t <= 6);
  }

  dispose() { this.group.parent?.remove(this.group); }
}
