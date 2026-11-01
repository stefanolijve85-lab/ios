import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Effects } from './render/effects';
import { skyTexture } from './render/world';
import { buildHumanoid, animate } from './render/humans';
import { buildExtinguisher } from './render/streetProps';
import { createCharacter } from './render/character';
import { loadAssets } from './render/assets';

// Developer effect showroom (open  #fxroom ): each effect on a light and a dark pad, in front of and behind a
// wall, plus bursts, a stress test, pause and quality switch. Not linked from the player UI.

export async function fxroom(app: HTMLElement) {
  await loadAssets('models/');
  app.innerHTML = `<div class="showroom"><canvas></canvas><div class="sr-panel">
    <b>EFFECTS SHOWROOM</b>
    <div class="sr-row"><button data-a="explosion">Explosion</button><button data-a="sparks">Sparks</button><button data-a="glass">Glass</button><button data-a="intercept">Intercept</button></div>
    <div class="sr-row"><button data-a="stress">Stress test (all at once)</button><button data-a="out">Extinguish fires</button><button data-a="pause">Pause</button></div>
    <label>Quality <select data-k="q"><option value="desktop">desktop (cap 160)</option><option value="mobile">mobile (cap 64)</option></select></label>
    <pre data-k="stats"></pre></div></div>`;
  const canvas = app.querySelector('canvas')!; const panel = app.querySelector('.sr-panel')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.background = skyTexture();
  scene.add(new THREE.HemisphereLight(0x8fa0d0, 0x403020, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(5, 10, 8); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200); camera.position.set(0, 13, 15);
  const controls = new OrbitControls(camera, canvas); controls.target.set(-2, 0.5, 0);
  // light and dark pads per effect, a wall half-way so effects can be seen in front of / behind geometry
  const kinds = ['fire', 'smoke', 'tear_gas', 'sparks', 'explosion'] as const;
  kinds.forEach((_, i) => {
    for (const [dz, col] of [[-3, 0xe8e4dc], [3, 0x1a1c22]] as const) {
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }));
      pad.position.set(-10 + i * 5, 0.01, dz); scene.add(pad);
    }
  });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 0.4), new THREE.MeshStandardMaterial({ color: 0xcfc2a6, roughness: 0.85 })); wall.position.set(0, 0.8, 0.6); scene.add(wall);
  // firefighter with hose aiming at a fire, and the extinguisher prop
  const ff = buildHumanoid('firefighter', 3); ff.root.position.set(-13, 0, -3); ff.root.rotation.y = Math.PI / 2; scene.add(ff.root);
  // thrower demo: the in-game character (GLB slot or procedural) loops the throw on a 2.4 s cycle
  const throwers = [0, 5, 9].map((v, i) => { const c = createCharacter('thrower', v * 5 + 1); c.root.position.set(-6 + i * 3, 0, 9); c.root.rotation.y = Math.PI; scene.add(c.root); return c; });
  (window as unknown as { __throwers: unknown }).__throwers = throwers;
  const ext = buildExtinguisher(); ext.position.set(-13.8, 0, -2.2); scene.add(ext);
  let fx = new Effects(scene, false);
  let paused = false, fires = true, t = 0;
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); fx.setViewport(innerHeight); };
  addEventListener('resize', resize); resize();
  let n = 0;
  panel.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.a!;
    if (a === 'pause') { paused = !paused; b.textContent = paused ? 'Resume' : 'Pause'; return; }
    if (a === 'out') { fires = !fires; b.textContent = fires ? 'Extinguish fires' : 'Relight fires'; return; }
    if (a === 'stress') { for (let i = 0; i < 12; i++) { fx.event(`s${n++}`, 'explosion', -12 + i * 2.2, 3); fx.event(`s${n++}`, 'sparks', -12 + i * 2.2, -3); } return; }
    for (const dz of [-3, 3]) fx.event(`${a}${n++}`, a as 'explosion', a === 'explosion' ? 10 : a === 'sparks' ? 5 : 0, dz);
  }));
  (panel.querySelector('[data-k="q"]') as HTMLSelectElement).addEventListener('change', (e) => { fx.dispose(); fx = new Effects(scene, (e.target as HTMLSelectElement).value === 'mobile'); fx.setViewport(innerHeight); });
  const stats = panel.querySelector('[data-k="stats"]')!;
  let last = performance.now(), acc = 0, frames = 0;
  const loop = (now: number) => {
    const dt = paused ? 0 : Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    if (!paused) {
      for (const dz of [-3, 3]) {
        if (fires) fx.burn(`f${dz}`, -10, dz, 1);
        fx.emit(`smk${dz}`, 'smoke', -5, 0.3, dz, 0.6);
        fx.emit(`gas${dz}`, 'tear_gas', 0, 0.2, dz, 1.2);
      }
      if (fires) fx.sprayAt(-12.6, -3, -10, -3, dt, 'hose');
      animate(ff, 'extinguish', false, 0, false, dt);
      const cyc = (t % 2.4) / 1.15; for (const c of throwers) c.update(cyc <= 1 ? 'throw' : 'idle', false, 0, false, dt, Math.min(1, cyc));
    }
    fx.update(dt);
    renderer.render(scene, camera);
    acc += now - (loop as unknown as { p?: number }).p! || 0; frames++;
    if (frames % 20 === 0) stats.textContent = `particles ${fx.count} / cap ${fx.cap}\nemitters ${fx.activeEmitters()}\ndraw calls ${renderer.info.render.calls}${paused ? '\nPAUSED' : ''}`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  (window as unknown as { __fxroom: unknown }).__fxroom = { get fx() { return fx; }, setPaused: (p: boolean) => (paused = p), setFires: (f: boolean) => (fires = f), look: (px: number, py: number, pz: number, tx: number, ty: number, tz: number) => { camera.position.set(px, py, pz); controls.target.set(tx, ty, tz); controls.update(); } };
  void acc;
}
