import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShopModule, SHOP_TYPES, MODULE, type Quality, type ShopId } from './render/shopModule';
import { groundNormal, groundTexture } from './render/textures';
import { skyTexture } from './render/world';
import { Post } from './render/post';
import type { StoreDef, StoreKind } from './maps/types';
import { loadAssets } from './render/assets';
import { buildHaussmann } from './render/haussmann';
import type { MapDef } from './maps/types';
import { PARIS } from './maps/paris';

// Developer showroom (open with  #showroom ): the six Paris shops side by side under identical light, with
// adjustable damage, stock, boards, breach, shutter level and quality. Not reachable from the player UI.

const KIND: Record<ShopId, StoreKind> = { electronics: 'electronics', fashion: 'fashion', jewelry: 'jewellery', grocery: 'grocery', cafe: 'cafe', sneakers: 'sneakers' };
const PITCH = 10;

export async function showroom(app: HTMLElement) {
  await loadAssets('models/');
  app.innerHTML = `<div class="showroom"><canvas></canvas>
    <div class="sr-panel">
      <b>SHOWROOM — Paris shops</b>
      <label>Damage <input type="range" min="0" max="1" step="0.01" value="0" data-k="damage"><span></span></label>
      <label>Stock <input type="range" min="0" max="1" step="0.01" value="1" data-k="stock"><span></span></label>
      <label>Boards <input type="range" min="0" max="1" step="0.01" value="0" data-k="boards"><span></span></label>
      <label><input type="checkbox" data-k="breach"> Breached</label>
      <label>Shutter level <select data-k="level"><option>1</option><option>2</option><option>3</option></select></label>
      <label>Quality <select data-k="quality"><option value="desktop">desktop</option><option value="mobile">mobile</option></select></label>
      <div class="sr-row"><button data-p="intact">Intact</button><button data-p="boarded">Boarded</button><button data-p="damaged">Damaged</button><button data-p="looted">Looted</button><button data-p="emptyIntact">Empty intact</button><button data-p="fullDamaged">Full + damaged</button></div>
      <div class="sr-row"><button data-c="near">Near</button><button data-c="mid">Mid</button><button data-c="far">Far</button><button data-c="game">Game camera</button></div>
      <pre data-k="stats"></pre>
    </div></div>`;
  const canvas = app.querySelector('canvas')!;
  const panel = app.querySelector('.sr-panel')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene(); scene.background = skyTexture(); scene.fog = new THREE.Fog(0x1a2440, 60, 160);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.25;
  scene.add(new THREE.HemisphereLight(0x6f84c0, 0x5a3a20, 0.75));
  const moon = new THREE.DirectionalLight(0xa9bcff, 0.7); moon.position.set(-20, 40, 30); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30 }); scene.add(moon);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 300);
  const controls = new OrbitControls(camera, canvas); controls.target.set(0, 2, 0);
  // street: wet setts, pavement and a continuous limestone building the shops are set into
  const gt = groundTexture('cobble').clone(); gt.repeat.set(30, 12); gt.needsUpdate = true;
  const gn = groundNormal('cobble').clone(); gn.repeat.copy(gt.repeat); gn.needsUpdate = true;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: gt, normalMap: gn, roughness: 0.3, metalness: 0.2 }));
  ground.position.set(0, 0, 10); ground.receiveShadow = true; scene.add(ground);
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(70, 3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: groundTexture('stone'), color: 0x8a8378, roughness: 0.35 }));
  pave.position.set(0, 0.012, 1.5); scene.add(pave);
  const n = 6; const span = (n - 1) * PITCH;
  // the same Haussmann facade kit as the game, with the six shop openings cut into its ground floor
  const defs: StoreDef[] = (Object.keys(SHOP_TYPES) as ShopId[]).map((id, i) => ({ name: id, kind: KIND[id], color: 0, front: { x: -span / 2 + i * PITCH, z: 0 }, normal: { x: 0, z: 1 }, width: MODULE.width }));
  const block = { rect: { x0: -span / 2 - 7, z0: -14, x1: span / 2 + 7, z1: 0 }, height: 16, style: 'haussmann' as const };
  const fakeMap: MapDef = { ...PARIS, id: 'showroom', bounds: { x0: -40, z0: -2, x1: 40, z1: 30 }, buildings: [block], stores: defs, decorShops: [] };
  const kit = new THREE.Group(); scene.add(kit);
  buildHaussmann(block, fakeMap, kit, { stores: defs, mobile: false, index: 3 });
  let shops: ShopModule[] = [];
  const build = (quality: Quality) => {
    for (const s of shops) scene.remove(s.group);
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'mobile' ? 1.5 : 2));
    shops = defs.map((def, i) => {
      const m = new ShopModule(def, i, { quality, seed: 101 + i, withLight: quality === 'desktop' && i < 3 });
      scene.add(m.group); return m;
    });
    apply();
  };
  const val = (k: string) => (panel.querySelector(`[data-k="${k}"]`) as HTMLInputElement);
  const apply = () => {
    const damage = Number(val('damage').value), stock = Number(val('stock').value), boards = Number(val('boards').value);
    const breach = val('breach').checked, level = Number(val('level').value);
    for (const s of shops) s.update(1 - damage, stock, level, breach, boards);
    panel.querySelectorAll('label span').forEach((sp, i) => (sp.textContent = [damage, stock, boards][i].toFixed(2)));
  };
  panel.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', () => { if ((el as HTMLElement).dataset.k === 'quality') build(val('quality').value as Quality); else apply(); }));
  const presets: Record<string, [number, number, number, boolean]> = { intact: [0, 1, 0, false], boarded: [0, 1, 1, false], damaged: [0.7, 0.85, 0, true], looted: [0.8, 0.05, 0, true], emptyIntact: [0, 0, 0, false], fullDamaged: [0.9, 1, 0, true] };
  panel.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((b) => b.addEventListener('click', () => {
    const [d, st, bo, br] = presets[b.dataset.p!]; val('damage').value = String(d); val('stock').value = String(st); val('boards').value = String(bo); val('breach').checked = br; apply();
  }));
  const cams: Record<string, [number, number, number, number, number, number]> = { near: [0, 1.9, 7, 0, 1.8, -1], mid: [0, 4, 22, 0, 2, 0], far: [0, 12, 55, 0, 2, 0], game: [0, 42, 30, 0, 0, -2] };
  const setCam = (k: string) => { const c = cams[k]; camera.position.set(c[0], c[1], c[2]); controls.target.set(c[3], c[4], c[5]); controls.update(); };
  panel.querySelectorAll<HTMLButtonElement>('[data-c]').forEach((b) => b.addEventListener('click', () => setCam(b.dataset.c!)));
  setCam('mid');
  const post = new Post(renderer, scene, camera);
  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); post.setSize(w, h, renderer.getPixelRatio()); };
  addEventListener('resize', resize); resize();
  build('desktop');
  const stats = panel.querySelector('[data-k="stats"]')!;
  let acc = 0, frames = 0, last = performance.now();
  const loop = (t: number) => {
    const dt = t - last; last = t; acc += dt; frames++;
    for (const s of shops) s.setLod(camera.position.distanceTo(s.group.position));
    if (val('quality').value === 'desktop') post.render(t / 1000); else renderer.render(scene, camera);
    if (acc > 500) {
      const info = renderer.info.render;
      stats.textContent = `frame ${(acc / frames).toFixed(1)} ms   calls ${info.calls}   tris ${info.triangles}\n` +
        shops.map((s) => `${s.type.sign.padEnd(9)} ${s.referenceState.padEnd(8)} ${s.triangles()} tris (${s.source})`).join('\n');
      acc = 0; frames = 0;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  /** look straight at shop i from a pedestrian / close viewpoint */
  const focus = (i: number, dist = 6.5, height = 1.8) => { const x = -span / 2 + i * PITCH; camera.position.set(x, height, dist); controls.target.set(x, 1.7, -1); controls.update(); };
  (window as unknown as { __showroom: unknown }).__showroom = { get shops() { return shops; }, apply, setCam, focus, renderer, build };
}
