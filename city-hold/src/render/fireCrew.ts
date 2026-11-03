// The fire crew as in the Rio concept: a red fire engine parked at the edge of the square with its beacons going,
// a hose laid out over the street behind the firefighter as he walks to the fire, a second crew member backing him up on
// the line, and a water jet arcing from the nozzle into the blaze with steam rising where it hits.
// Pure scenery around the firefighter unit: nothing here touches the simulation (no obstacles, no timing).
import * as THREE from 'three';
import type { Game, Unit } from '../sim/game';
import type { MapDef } from '../maps/types';
import { createCharacter, type CharacterVisual } from './character';
import type { Effects } from './effects';
import { radialTexture } from './textures';

const RED = 0xa8121a;

function slatTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#9aa0a6'); g.addColorStop(0.5, '#d6dade'); g.addColorStop(1, '#8d9399');
  x.fillStyle = g; x.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 128; y += 6) { x.fillStyle = 'rgba(40,44,50,0.55)'; x.fillRect(0, y, 64, 1.4); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(0, y + 1.6, 64, 0.8); }
  x.fillStyle = '#3a3e44'; x.fillRect(26, 112, 12, 5); // handle bar at the bottom
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/** red-and-yellow reflective chevron band along the sides */
function chevronTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d')!;
  x.fillStyle = '#f2c81c'; x.fillRect(0, 0, 256, 32);
  x.fillStyle = '#c3141c'; for (let i = -2; i < 18; i++) { x.beginPath(); x.moveTo(i * 16, 32); x.lineTo(i * 16 + 8, 32); x.lineTo(i * 16 + 24, 0); x.lineTo(i * 16 + 16, 0); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
}

/** fire engine, 8.4 m long and 2.5 m wide, nose to +z. outlet = the pump connection the hose runs from (left side, local +x) */
export function buildFireEngine(): { g: THREE.Group; beacons: THREE.Mesh[]; outlet: THREE.Object3D } {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: RED, roughness: 0.32, metalness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.8 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.18, metalness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0d1720, roughness: 0.05, metalness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, cast = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; g.add(o); return o; };
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  // chassis and body
  add(box(2.3, 0.35, 8.2), dark, 0, 0.62, 0);
  add(box(2.5, 2.05, 5.9), paint, 0, 1.85, -1.15); // equipment body
  add(box(2.5, 1.95, 2.2), paint, 0, 1.8, 3.0); // crew cab
  add(box(2.42, 0.08, 2.1), white, 0, 2.8, 3.0); // white cab roof
  add(box(2.4, 0.9, 0.06), glass, 0, 2.2, 4.11); // windscreen
  for (const s of [-1, 1]) {
    add(box(0.06, 0.75, 1.5), glass, s * 1.26, 2.25, 3.05); // cab side windows
    add(box(0.05, 0.03, 2.0), chrome, s * 1.27, 1.73, 3.0); // door trim
  }
  // roller doors on both sides of the body, a chevron band underneath, chrome running board
  const slats = slatTexture(); const doorMat = new THREE.MeshStandardMaterial({ map: slats, roughness: 0.35, metalness: 0.6 });
  const chev = new THREE.MeshStandardMaterial({ map: chevronTexture(), roughness: 0.4, emissive: 0x3a2a00, emissiveIntensity: 0.6 });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) add(box(0.04, 1.4, 1.7), doorMat, s * 1.265, 2.05, -3.2 + i * 1.95, false);
    add(box(0.04, 0.22, 8.2), chev, s * 1.265, 0.95, -0.05, false);
    add(box(0.25, 0.05, 5.6), chrome, s * 1.3, 0.78, -1.2, false);
  }
  add(box(2.5, 0.22, 0.12), chev, 0, 0.95, -4.12, false); // rear band
  // front: grille, bumper, headlights
  add(box(1.6, 0.7, 0.05), chrome, 0, 1.25, 4.11, false);
  add(box(2.5, 0.25, 0.25), chrome, 0, 0.72, 4.15);
  const head = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
  for (const s of [-1, 1]) add(box(0.36, 0.2, 0.04), head, s * 0.95, 1.12, 4.14, false);
  // ladder on the roof
  for (const s of [-1, 1]) add(box(0.06, 0.1, 7.2), chrome, s * 0.42, 3.02, -0.7);
  for (let i = 0; i < 14; i++) add(new THREE.CylinderGeometry(0.02, 0.02, 0.84, 5).rotateZ(Math.PI / 2), chrome, 0, 3.02, -4.1 + i * 0.5, false);
  add(box(0.9, 0.18, 0.4), dark, 0, 2.95, -4.0); // ladder rest
  // hose reel at the rear corner and the pump panel with its outlet
  const reel = add(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 18).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8c1a16, roughness: 0.7 }), 0.95, 1.55, -3.75);
  reel.scale.set(1, 1, 1);
  add(box(0.05, 0.7, 0.9), chrome, 1.27, 1.25, 1.35, false); // pump panel
  const outlet = new THREE.Object3D(); outlet.position.set(1.35, 1.05, 1.35); g.add(outlet);
  add(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9 }), 1.33, 1.05, 1.35, false);
  // wheels: front axle, tandem rear axles
  const tyre = new THREE.CylinderGeometry(0.52, 0.52, 0.38, 20).rotateZ(Math.PI / 2); const hub = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12).rotateZ(Math.PI / 2);
  for (const z of [2.85, -1.9, -3.1]) for (const s of [-1, 1]) { add(tyre, dark, s * 1.08, 0.52, z); add(hub, chrome, s * 1.09, 0.52, z, false); }
  // light bar on the cab and corner beacons at the rear
  const beacons: THREE.Mesh[] = [];
  add(box(1.9, 0.08, 0.3), dark, 0, 2.88, 3.4, false);
  for (const [x, y, z, c] of [[-0.6, 2.98, 3.4, 0xff2020], [-0.2, 2.98, 3.4, 0x2a5cff], [0.2, 2.98, 3.4, 0xff2020], [0.6, 2.98, 3.4, 0x2a5cff], [-1.15, 2.95, -4.05, 0xff2020], [1.15, 2.95, -4.05, 0x2a5cff]] as const) {
    const b = add(box(0.34, 0.14, 0.24), new THREE.MeshBasicMaterial({ color: c }), x, y, z, false); b.userData.base = c; beacons.push(b);
  }
  // glow halos for the beacons (visible on the facades and street at night)
  for (const [i, b] of beacons.entries()) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(i % 2 ? 'rgba(80,120,255,0.9)' : 'rgba(255,60,50,0.9)', 'rgba(0,0,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.set(2.2, 2.2, 1); b.add(s); b.userData.halo = s;
  }
  return { g, beacons, outlet };
}

/** a water jet: a tube along a ballistic arc with a scrolling, broken-up stream shader */
function jetMaterial(core: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uOn: { value: 0 } },
    // the stream is thin at the nozzle and fans out towards the fire (vertices pushed out along the tube normal)
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; vec3 p = position + normal * (${core ? '0.05' : '0.16'}) * (uv.x * 1.8 - 0.55);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uOn; varying vec2 vUv;
      void main(){
        float u = vUv.x; float a = vUv.y * 6.2832;
        float edge = pow(abs(sin(a * 0.5)), 0.6);
        float flow = u * 22.0 - uTime * 16.0;
        float streak = 0.62 + 0.38 * sin(a * 5.0 + u * 9.0 + sin(flow * 0.35) * 1.5);   // strands running along the jet
        float pulse = 0.82 + 0.18 * sin(flow);
        float ends = smoothstep(0.0, 0.05, u) * (1.0 - smoothstep(${core ? '0.8' : '0.55'}, 1.0, u)) * ${core ? '1.0' : 'smoothstep(0.25, 0.8, u)'};
        float alpha = ${core ? '0.8' : '0.3'} * streak * pulse * mix(0.55, 1.0, edge) * ends * step(u, uOn);
        gl_FragColor = vec4(mix(vec3(0.66, 0.8, 0.93), vec3(0.97, 0.99, 1.0), edge * streak), alpha);
      }`,
  });
}

interface Crew {
  crumbs: THREE.Vector3[];
  hose: THREE.Mesh; nozzle: THREE.Group;
  jet: THREE.Mesh; mist: THREE.Mesh; jetKey: string; jetOn: number;
  mate: CharacterVisual; matePos: THREE.Vector3; mateOut: boolean;
  rebuildT: number;
}

export class FireCrew {
  private engine: { g: THREE.Group; beacons: THREE.Mesh[]; outlet: THREE.Object3D } | null = null;
  private crews = new Map<number, Crew>();
  private hoseMat = new THREE.MeshStandardMaterial({ color: 0x9a1c18, roughness: 0.62 });
  /** branch pipe as in the reference pictures: silver coupling, black barrel, red bale handle and a red tip ring (+z forward) */
  private buildNozzle(): THREE.Group {
    const g = new THREE.Group();
    const black = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.45, metalness: 0.3 });
    const red = new THREE.MeshStandardMaterial({ color: 0xb3161a, roughness: 0.4, metalness: 0.2 });
    const silver = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.25, metalness: 0.9 });
    const cyl = (r0: number, r1: number, len: number, z: number, m: THREE.Material) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 12).rotateX(Math.PI / 2), m); o.position.z = z; g.add(o); };
    cyl(0.055, 0.055, 0.1, -0.24, silver); // coupling on the hose end
    cyl(0.042, 0.046, 0.34, -0.03, black); // barrel
    cyl(0.07, 0.062, 0.1, 0.18, red); // tip ring
    cyl(0.05, 0.05, 0.04, 0.245, black); // nozzle face
    const bale = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 6, 12, Math.PI), red); bale.rotation.y = Math.PI / 2; bale.position.set(0, 0.04, -0.06); g.add(bale);
    g.scale.setScalar(1.25); g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
    return g;
  }
  private tmp = new THREE.Vector3(); private tmp2 = new THREE.Vector3();
  constructor(private scene: THREE.Scene, private map: MapDef, private fx: Effects) {}

  private parking() {
    if (this.map.fireEngine) return this.map.fireEngine;
    // default: behind the police van, in its lane
    const v = this.map.van; const r = (v.rot * Math.PI) / 180;
    return { x: v.x - Math.sin(r) * 7.6, z: v.z - Math.cos(r) * 7.6, rot: v.rot };
  }
  private outletWorld(out: THREE.Vector3) { this.engine!.g.updateMatrixWorld(); return this.engine!.outlet.getWorldPosition(out); }

  update(g: Game, humans: Map<number, CharacterVisual>, dt: number, time: number) {
    const ffs = g.units.filter((u) => u.kind === 'firefighter' && u.side === 'def');
    if (ffs.length && !this.engine) {
      this.engine = buildFireEngine(); const p = this.parking();
      this.engine.g.position.set(p.x, 0, p.z); this.engine.g.rotation.y = (p.rot * Math.PI) / 180; this.scene.add(this.engine.g);
    }
    if (this.engine) {
      this.engine.g.visible = ffs.length > 0;
      // beacons: alternating double flashes, the halo follows
      this.engine.beacons.forEach((b, i) => {
        const ph = (time * 2.4 + (i % 2) * 0.5) % 1; const on = ph < 0.12 || (ph > 0.2 && ph < 0.32);
        (b.material as THREE.MeshBasicMaterial).color.setHex(on ? b.userData.base : 0x220808);
        (b.userData.halo as THREE.Sprite).visible = on;
      });
    }
    const seen = new Set<number>();
    for (const u of ffs) {
      const h = humans.get(u.id); if (!h || !this.engine) continue;
      seen.add(u.id);
      this.step(u, h, g, dt, time);
    }
    for (const [id, c] of this.crews) if (!seen.has(id)) { this.scene.remove(c.hose, c.nozzle, c.jet, c.mist, c.mate.root); this.crews.delete(id); }
  }

  private crew(u: Unit): Crew {
    let c = this.crews.get(u.id);
    if (!c) {
      const hose = new THREE.Mesh(new THREE.BufferGeometry(), this.hoseMat); hose.castShadow = true; hose.visible = false;
      const nozzle = this.buildNozzle(); nozzle.visible = false;
      const jet = new THREE.Mesh(new THREE.BufferGeometry(), jetMaterial(true)); jet.visible = false; jet.frustumCulled = false;
      const mist = new THREE.Mesh(new THREE.BufferGeometry(), jetMaterial(false)); mist.visible = false; mist.frustumCulled = false;
      const mate = createCharacter('firefighter', u.id * 7 + 3); mate.icon.visible = false; mate.root.visible = false;
      this.scene.add(hose, nozzle, jet, mist, mate.root);
      c = { crumbs: [], hose, nozzle, jet, mist, jetKey: '', jetOn: 0, mate, matePos: new THREE.Vector3(), mateOut: false, rebuildT: 0 };
      this.crews.set(u.id, c);
    }
    return c;
  }

  private step(u: Unit, h: CharacterVisual, g: Game, dt: number, time: number) {
    const c = this.crew(u);
    const pos = h.root.position; const yaw = h.root.rotation.y;
    const fwd = this.tmp.set(Math.sin(yaw), 0, Math.cos(yaw));
    const fire = u.state === 'extinguish' ? g.fires.find((f) => f.id === u.fireId && !f.out) : undefined;
    const home = u.home ?? { x: pos.x, z: pos.z };
    const away = Math.hypot(pos.x - home.x, pos.z - home.z) > 1.6;
    const out = !!fire || (c.crumbs.length > 0 && away);
    const outlet = this.outletWorld(new THREE.Vector3());
    // lay the line behind him: a breadcrumb every 0.7 m; walking back over it reels it in
    if (out) {
      if (!c.crumbs.length) c.crumbs.push(new THREE.Vector3(outlet.x, 0.05, outlet.z));
      const last = c.crumbs[c.crumbs.length - 1];
      const d = Math.hypot(pos.x - last.x, pos.z - last.z);
      if (c.crumbs.length > 1) { const prev = c.crumbs[c.crumbs.length - 2]; if (Math.hypot(pos.x - prev.x, pos.z - prev.z) < 0.5) c.crumbs.pop(); }
      if (d > 0.7) c.crumbs.push(new THREE.Vector3(pos.x, 0.05, pos.z));
    } else c.crumbs = [];
    const spraying = !!fire && !u.moving && Math.hypot(fire.x - pos.x, fire.z - pos.z) < 7;
    // nozzle in his hands: forward at chest height while spraying, at the hip while walking
    const right = this.tmp2.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const hand = new THREE.Vector3(pos.x, 0, pos.z).addScaledVector(fwd, spraying ? 0.55 : 0.28).addScaledVector(right, spraying ? 0 : -0.18);
    hand.y = spraying ? 1.18 : 0.95;
    c.nozzle.visible = out; c.hose.visible = out && c.crumbs.length > 0;
    if (out) {
      c.nozzle.position.copy(hand).addScaledVector(fwd, 0.12);
      c.nozzle.rotation.set(spraying ? -0.12 : 0.5, yaw, 0, 'YXZ');
      c.rebuildT -= dt;
      if (c.rebuildT <= 0) {
        c.rebuildT = 0.08;
        // outlet -> down to the street -> the laid line (gently snaking) -> up to the back of the nozzle
        const pts: THREE.Vector3[] = [outlet.clone(), new THREE.Vector3(outlet.x, 0.06, outlet.z).addScaledVector(new THREE.Vector3(outlet.x - this.engine!.g.position.x, 0, outlet.z - this.engine!.g.position.z).normalize(), 0.5)];
        c.crumbs.forEach((p, i) => { if (i === 0) return; const w = Math.sin(i * 1.7) * 0.18; pts.push(new THREE.Vector3(p.x + w * fwd.z, 0.05, p.z - w * fwd.x)); });
        const behind = hand.clone().addScaledVector(fwd, -0.5); behind.y = 0.05;
        const lastP = pts[pts.length - 1];
        if (Math.hypot(behind.x - lastP.x, behind.z - lastP.z) > 0.3) pts.push(behind);
        pts.push(hand.clone().addScaledVector(fwd, -0.2));
        const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        c.hose.geometry.dispose(); c.hose.geometry = new THREE.TubeGeometry(curve, Math.min(400, pts.length * 6), 0.045, 6, false);
      }
    }
    // the second man on the line: walks up behind him and braces the hose 1.5 m back while he sprays
    if (out) {
      if (!c.mateOut) { c.matePos.set(outlet.x, 0, outlet.z); c.mateOut = true; c.mate.root.visible = true; c.mate.root.position.copy(c.matePos); }
      const tgt = new THREE.Vector3(pos.x, 0, pos.z).addScaledVector(fwd, -1.5).addScaledVector(right, 0.45);
      const prev = c.mate.root.position.clone();
      const d = tgt.distanceTo(prev);
      const sp = Math.min(d, (d > 6 ? Math.max(7, d) : d > 3 ? 3.4 : 1.8) * dt); // jogs to catch up, settles in close
      if (d > 0.25) c.mate.root.position.addScaledVector(tgt.sub(prev).normalize(), sp);
      const moved = c.mate.root.position.distanceTo(prev) / Math.max(dt, 1e-3);
      const moving = moved > 0.3;
      const look = moving ? Math.atan2(c.mate.root.position.x - prev.x, c.mate.root.position.z - prev.z) : yaw;
      let df = look - c.mate.root.rotation.y; while (df > Math.PI) df -= Math.PI * 2; while (df < -Math.PI) df += Math.PI * 2;
      c.mate.root.rotation.y += df * Math.min(1, dt * 6);
      c.mate.update(moving ? 'walk' : spraying ? 'extinguish' : 'idle', moving, moved, false, dt);
    } else if (c.mateOut) { c.mateOut = false; c.mate.root.visible = false; }
    // the water jet
    c.jetOn = Math.max(0, Math.min(1, c.jetOn + (spraying ? dt * 2.5 : -dt * 4)));
    c.jet.visible = c.mist.visible = c.jetOn > 0;
    if (c.jetOn > 0 && fire) {
      const from = c.nozzle.position.clone().addScaledVector(fwd, 0.34);
      const to = new THREE.Vector3(fire.x, fire.store >= 0 ? 1.05 : 0.8, fire.z);
      const key = `${from.x.toFixed(1)},${from.z.toFixed(1)},${to.x.toFixed(1)},${to.z.toFixed(1)}`;
      if (key !== c.jetKey) {
        c.jetKey = key;
        const dist = from.distanceTo(to); const arc = 0.12 + dist * 0.07;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 16; i++) { const t = i / 16; const p = from.clone().lerp(to, t); p.y += Math.sin(t * Math.PI) * arc * (1 - t * 0.35); pts.push(p); }
        const curve = new THREE.CatmullRomCurve3(pts);
        c.jet.geometry.dispose(); c.jet.geometry = new THREE.TubeGeometry(curve, 48, 0.03, 8, false);
        c.mist.geometry.dispose(); c.mist.geometry = new THREE.TubeGeometry(curve, 48, 0.06, 8, false);
      }
      for (const m of [c.jet, c.mist]) { const mat = m.material as THREE.ShaderMaterial; mat.uniforms.uTime.value = time + u.id; mat.uniforms.uOn.value = c.jetOn; }
      if (c.jetOn > 0.8) {
        // spray bursting where it hits and steam boiling off the blaze (more steam as the fire dies)
        this.fx.emit(`jetsplash:${u.id}`, 'spray', to.x, to.y, to.z, 0.5, 1, 0.9);
        this.fx.emit(`steam:${u.id}`, 'tear_gas', to.x, to.y + 0.6, to.z, 0.8, 0.35 + fire.progress * 0.65, 1.4);
      }
    }
  }
}
