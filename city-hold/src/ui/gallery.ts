import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { cloneModel, getManifest, loadAssets, loadCityAssets, slotStatus } from '../render/assets';
import { createCharacterFromSlot, type CharacterVisual } from '../render/character';
import { STREETWEAR, type AnyKind } from '../render/humans';
import { buildBarricade, buildBistroSet, buildBusShelter, buildCameraMast, buildCrowdBarrier, buildDeliveryVan, buildExtinguisher, buildOctagonFountain, buildPoliceVan, buildStreetBench, buildStreetLamp, buildTreePlanter } from '../render/streetProps';
import { buildCar, buildVan } from '../render/world';
import { ShopModule } from '../render/shopModule';
import type { StoreDef } from '../maps/types';
import type { Settings } from '../save';

// Collectie: every figure, object, building and shop in the game, large and turnable, with its animations or
// states, and the player's choice of which figures play which role (appearance only; stats never change).

type Tab = 'figures' | 'objects' | 'buildings' | 'shops';
interface Item { id: string; tab: Tab; name: string; source: string; make: () => Promise<THREE.Object3D | null>; slot?: string; kind?: AnyKind; city?: string; shop?: StoreDef['kind'] }

export const ROLES: [AnyKind, string, string][] = [
  ['security', 'Beveiliging', 'Security'], ['shield', 'Schildteam', 'Shield team'], ['firefighter', 'Brandweer', 'Firefighter'],
  ['runner', 'Renner', 'Runner'], ['carrier', 'Drager', 'Carrier'], ['heavy', 'Zware drager', 'Heavy carrier'], ['vandal', 'Vandaal', 'Vandal'], ['thrower', 'Werper', 'Thrower'],
  ['civilian', 'Voetgangers', 'Civilians'], ['shopkeeper', 'Winkelier', 'Shopkeeper'], ['helper', 'Helper', 'Helper'],
];

const FIGURE_NAMES: Record<string, string> = {
  'char.security': 'Beveiliger', 'char.shield': 'Agent (vrouw)', 'char.firefighter': 'Brandweerman', 'char.runner': 'Capuchon',
  'char.carrier': 'Olijfgroene jas met rugzak', 'char.heavy': 'Pufferjas met rode capuchon', 'char.civilian': 'Blauwe jas', 'char.vandal': 'Vandaal',
  'char.thrower': 'Werper', 'char.shopkeeper': 'Winkelier', 'char.helper': 'Helper met hesje',
};
const OUTFIT_NAMES: Record<string, string> = {
  '01_tracksuit_arms_spread': 'Trainingspak', '02_puffer_large_box': 'Puffer met grote doos', '03_runner_backpack': 'Renner met rugzak', '04_vest_shopping_bags': 'Bodywarmer met tassen',
  '05_hoodie_backpack_walking': 'Hoodie met rugzak', '06_puffer_electronics_box': 'Puffer met elektronica', '07_navy_runner': 'Marineblauwe renner', '08_padded_vest_bags': 'Gewatteerd vest met tassen',
  '09_large_backpack': 'Grote rugzak', '10_windbreaker_small_box': 'Windjack met kleine doos', masked_1: 'Gemaskerd 1', masked_2: 'Gemaskerd 2', masked_3: 'Gemaskerd 3',
  thrower_1: 'Werper 1', thrower_2: 'Werper 2', thrower_3: 'Werper 3',
};
const OBJECT_NAMES: Record<string, string> = {
  'prop.lamp': 'Lantaarn', 'prop.tree': 'Boom in bak', 'prop.planter': 'Plantenbak', 'prop.bench': 'Bank', 'prop.bollard': 'Paaltje', 'prop.umbrella': 'Parasol',
  'prop.car': 'Auto', 'prop.car_burned': 'Uitgebrande auto', 'prop.van': 'Inzetbus', 'prop.barrier': 'Dranghek', 'prop.concrete': 'Betonblok', 'prop.camera_mast': 'Cameramast',
  'prop.shelter': 'Bushokje', 'prop.delivery_van': 'Bestelbus', 'prop.fountain': 'Fontein (Parijs)', 'prop.bike_rack': 'Fietsenrek (Amsterdam)', 'prop.bollard_ams': 'Amsterdammertje',
  'prop.shelter_london': 'Bushokje (Londen)', 'prop.tram_stop': 'Tramhalte (Milaan)', 'prop.wheelie_bin': 'Container (Berlijn)',
};
const BUILDING_NAMES: Record<string, string> = {
  'building.blad': 'BLAD — trapgevel', 'building.kade': 'KADE — hoekcafé', 'building.noord': 'NOORD — beschadigd', 'building.alder': 'ALDER — buurtwinkel',
  'building.lantern': 'THE LANTERN — hoekpub', 'building.circuit': 'CIRCUIT — beschadigd', 'building.vetro': 'VETRO — arcadepand', 'building.kante': 'KANTE — binnenplaatspand',
  'building.ponto': 'PONTO — hoekgebouw',
};
const CITY_NL: Record<string, string> = { amsterdam: 'Amsterdam', london: 'Londen', milan: 'Milaan', berlin: 'Berlijn', saopaulo: 'São Paulo', paris: 'Parijs' };

function kindOfSlot(slot: string): AnyKind {
  const k = slot.split('.');
  if (k[1] === 'alt') return k[2] as AnyKind;
  if (k[1] === 'looter') return (STREETWEAR.find((o) => o.ref === k[2])?.kinds[0] ?? 'carrier') as AnyKind;
  return k[1] as AnyKind;
}
function figureName(slot: string): string {
  const k = slot.split('.');
  if (k[1] === 'alt') return 'Eenvoudig: ' + (FIGURE_NAMES['char.' + k[2]] ?? k[2]).toLowerCase();
  if (k[1] === 'looter') return OUTFIT_NAMES[k[2]] ?? k[2];
  return FIGURE_NAMES[slot] ?? slot;
}

function items(): Item[] {
  const man = getManifest(); const out: Item[] = [];
  const src = (slot: string) => { const e = man?.slots[slot]; if (!e) return 'In code gebouwd'; if (e.file.startsWith('placeholder/') && slot.startsWith('char.alt.')) return 'Eerder procedureel figuur'; return e.status === 'final' ? (/Higgsfield/.test(e.note ?? '') ? 'Higgsfield-model' : 'Definitief model') : 'Tijdelijk model (uit code)'; };
  for (const slot of Object.keys(man?.slots ?? {})) {
    if (slot.startsWith('char.')) out.push({ id: slot, tab: 'figures', name: figureName(slot), source: src(slot), slot, kind: kindOfSlot(slot), city: man!.slots[slot].city, make: async () => null });
    else if (slot.startsWith('prop.')) out.push({ id: slot, tab: 'objects', name: OBJECT_NAMES[slot] ?? slot, source: src(slot) + (man!.slots[slot].city ? ` · ${CITY_NL[man!.slots[slot].city!]}` : ''), slot, city: man!.slots[slot].city, make: async () => cloneModel(slot) });
    else if (slot.startsWith('building.')) out.push({ id: slot, tab: 'buildings', name: BUILDING_NAMES[slot] ?? slot, source: `${src(slot)} · ${CITY_NL[man!.slots[slot].city ?? ''] ?? ''}`, slot, city: man!.slots[slot].city, make: async () => cloneModel(slot) });
  }
  const proc = (id: string, name: string, f: () => THREE.Object3D) => out.push({ id, tab: 'objects', name, source: 'In code gebouwd', make: async () => f() });
  const wrap = (f: (g: THREE.Group) => unknown) => () => { const g = new THREE.Group(); f(g); return g; };
  proc('p.lamp', 'Dubbele lantaarn (Parijs)', wrap((g) => buildStreetLamp(g)));
  proc('p.bench', 'Parkbank', wrap((g) => buildStreetBench(g)));
  proc('p.tree', 'Herfstboom in Versailles-bak', wrap((g) => buildTreePlanter(g, 3)));
  proc('p.shelter', 'Bushokje (Parijs)', wrap((g) => buildBusShelter(g)));
  proc('p.barrier', 'Dranghek', () => buildCrowdBarrier(2.5));
  proc('p.mast', 'Cameramast', () => buildCameraMast());
  proc('p.delivery', 'Bestelbus', () => buildDeliveryVan());
  proc('p.police', 'Politiebus', () => buildPoliceVan().group);
  proc('p.van', 'Inzetbus', () => buildVan().g);
  proc('p.car', 'Auto', () => buildCar(0x2a3a5a, false));
  proc('p.carb', 'Uitgebrande auto', () => buildCar(0, true));
  proc('p.bistro', 'Terrastafel met stoelen', wrap((g) => buildBistroSet(g, 3, 2)));
  proc('p.barricade', 'Barricade (decorbrand)', () => buildBarricade(2));
  proc('p.ext', 'Brandblusser', () => buildExtinguisher());
  proc('p.fountain', 'Fontein (achthoekig, procedureel)', wrap((g) => buildOctagonFountain({ x: 0, z: 0, r: 5 }, g, true, 'octagon')));
  const shops: [StoreDef['kind'], string][] = [['jewellery', 'Juwelier LUMIERE'], ['electronics', 'Elektronica VOLT'], ['fashion', 'Mode ATELIER'], ['grocery', 'Kruidenier MARCHE'], ['cafe', 'Café RIVE'], ['sneakers', 'Sneakers COURT']];
  for (const [kind, name] of shops) out.push({ id: 'shop.' + kind, tab: 'shops', name, source: 'In code gebouwd · vier toestanden', shop: kind, make: async () => null });
  return out;
}

// thumbnails survive between visits
const thumbs = new Map<string, string>();

export interface GalleryHost { settings: Settings; save: () => void; lang: 'nl' | 'en' }

export async function mountGallery(el: HTMLElement, host: GalleryHost): Promise<() => void> {
  el.innerHTML = `<div class="gal">
    <div class="gal-view"><canvas class="gal-canvas"></canvas>
      <div class="gal-info"><h2 data-g="name"></h2><p data-g="meta"></p></div>
      <div class="gal-bottom"><div class="gal-tools" data-g="tools"></div>
      <p class="gal-help">Slepen = draaien · scrollen/knijpen = zoomen</p></div>
    </div>
    <div class="gal-side">
      <div class="gal-roles" data-g="roles"></div>
      <div class="gal-tabs" role="tablist">
        <button data-tab="figures" class="on">Personen</button><button data-tab="objects">Objecten</button><button data-tab="buildings">Gebouwen</button><button data-tab="shops">Winkels</button>
      </div>
      <div class="gal-grid" data-g="grid"></div>
    </div></div>`;
  const $ = (k: string) => el.querySelector<HTMLElement>(`[data-g="${k}"]`)!;
  await loadAssets('models/');
  await loadCityAssets('collection', 'models/');
  const all = items();
  let tab: Tab = 'figures'; let current: Item | null = null; let disposed = false;

  // ---- big viewer
  const canvas = el.querySelector<HTMLCanvasElement>('.gal-canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x141a22);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2a1a, 1.4));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.2); sun.position.set(3, 6, 4); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x232a33, roughness: 0.9 })); scene.add(floor);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 500);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  let shown: THREE.Object3D | null = null; let figure: CharacterVisual | null = null; let clip = 'idle'; let shop: ShopModule | null = null;
  const resize = () => { const r = canvas.parentElement!.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement!); resize();

  /** bounds of the visible meshes only (hidden carry boxes and helper nodes do not count) */
  const vbox = (o: THREE.Object3D) => { o.updateMatrixWorld(true); const b = new THREE.Box3(); o.traverseVisible((m) => { const mm = m as THREE.Mesh; if (mm.isMesh && !(m as THREE.Sprite).isSprite) b.expandByObject(mm, true); }); return b.isEmpty() ? new THREE.Box3().setFromObject(o) : b; };
  const fit = (o: THREE.Object3D) => {
    const b = vbox(o); const s = b.getSize(new THREE.Vector3()); const c = b.getCenter(new THREE.Vector3());
    const r = Math.max(s.x, s.y, s.z) || 1; floor.scale.setScalar(Math.max(s.x, s.z) * 0.9 + 0.5); floor.position.y = b.min.y - 0.001;
    controls.target.copy(c); camera.position.set(c.x + r * 1.1, c.y + r * 0.5, c.z + r * 2.3); camera.near = r / 100; camera.far = r * 50; camera.updateProjectionMatrix();
    controls.minDistance = r * 0.3; controls.maxDistance = r * 6; return { s, r };
  };
  const tris = (o: THREE.Object3D) => { let n = 0; o.traverse((m) => { const g = (m as THREE.Mesh).geometry; if (g) n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1)); }); return Math.round(n); };

  async function makeObject(it: Item): Promise<{ obj: THREE.Object3D; fig?: CharacterVisual; shop?: ShopModule } | null> {
    if (it.city && it.city !== 'collection') await loadCityAssets(it.city, 'models/');
    if (it.tab === 'figures' && it.slot) { const f = createCharacterFromSlot(it.slot, it.kind!, 7); if (!f) return null; f.icon.visible = false; return { obj: f.root, fig: f }; }
    if (it.tab === 'shops' && it.shop) {
      const def: StoreDef = { name: it.name, kind: it.shop, color: 0x333333, front: { x: 0, z: 0 }, normal: { x: 0, z: 1 }, width: 8 } as StoreDef;
      const sm = new ShopModule(def, 0, { quality: 'desktop', seed: 4, withLight: true }); sm.update(1, 1, 1, false, 0); return { obj: sm.group, shop: sm };
    }
    const o = await it.make(); return o ? { obj: o } : null;
  }

  async function show(it: Item) {
    current = it;
    if (shown) { scene.remove(shown); shown = null; } figure = null; shop = null;
    $('name').textContent = it.name; $('meta').textContent = 'Laden…'; $('tools').innerHTML = ''; $('roles').innerHTML = '';
    const r = await makeObject(it); if (disposed || current !== it) return;
    if (!r) { $('meta').textContent = 'Niet beschikbaar'; return; }
    shown = r.obj; figure = r.fig ?? null; shop = r.shop ?? null; scene.add(shown);
    shown.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh && !mm.geometry.attributes.normal) mm.geometry.computeVertexNormals(); });
    if (figure) figure.previewClip?.('idle', 0);
    const { s } = fit(shown);
    const scaledInGame = it.tab === 'buildings' || !!it.city || it.slot === 'prop.fountain'; // image-to-3D models are scaled to fit their spot in the city
    const dims = it.tab === 'figures' ? `${s.y.toFixed(2)} m lang` : scaledInGame ? 'schaal past zich aan in de stad' : `${s.x.toFixed(1)} × ${s.z.toFixed(1)} × ${s.y.toFixed(1)} m`;
    $('meta').textContent = `${it.source} · ${dims} · ${tris(shown).toLocaleString('nl-NL')} driehoeken`;
    // tools: animations for figures, states for shops
    if (figure?.clipNames) {
      const names = figure.clipNames().filter((n) => !/\|/.test(n));
      const nl: Record<string, string> = { idle: 'Stilstaan', walk: 'Lopen', run: 'Rennen', carry_walk: 'Dragen', carry_idle: 'Dragen (stil)', collect: 'Oppakken', throw: 'Gooien', brace: 'Blokkeren', restrain: 'Duwen', breach: 'Knielen/inbreken', flee: 'Vluchten', guide: 'Wijzen', extinguish: 'Blussen', escort: 'Wegleiden', escorted: 'Weggeleid', held: 'Vastgehouden', restrained: 'Geboeid' };
      const order = ['idle', 'walk', 'run', 'carry_idle', 'carry_walk', 'collect', 'throw', 'brace', 'restrain', 'escort', 'breach', 'flee', 'extinguish', 'guide', 'held', 'escorted'];
      const list = order.filter((n) => names.includes(n));
      $('tools').innerHTML = list.map((n) => `<button data-clip="${n}" class="${n === 'idle' ? 'on' : ''}">${nl[n] ?? n}</button>`).join('');
      clip = 'idle';
      $('tools').querySelectorAll<HTMLElement>('[data-clip]').forEach((b) => b.addEventListener('click', () => { clip = b.dataset.clip!; $('tools').querySelectorAll('.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }));
      renderRoles(it);
    } else if (shop) {
      const st: [string, string, () => void][] = [
        ['Intact', 'intact', () => shop!.update(1, 1, 1, false, 0)], ['Dichtgetimmerd', 'boarded', () => shop!.update(1, 1, 1, false, 1)],
        ['Beschadigd', 'damaged', () => shop!.update(0.4, 0.9, 1, false, 0)], ['Geplunderd', 'looted', () => shop!.update(0.1, 0.05, 1, true, 0)],
        ['Rolluik', 'shutter', () => shop!.update(1, 1, 3, false, 0)],
      ];
      $('tools').innerHTML = st.map(([l, k], i) => `<button data-st="${k}" class="${i === 0 ? 'on' : ''}">${l}</button>`).join('');
      $('tools').querySelectorAll<HTMLElement>('[data-st]').forEach((b, i) => b.addEventListener('click', () => { st[i][2](); $('tools').querySelectorAll('.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }));
    }
  }

  function renderRoles(it: Item) {
    const f = host.settings.figures ?? {};
    $('roles').innerHTML = `<b>Gebruik in het spel als</b><div>${ROLES.map(([k, nl]) => `<button data-role="${k}" class="${(f[k] ?? []).includes(it.slot!) ? 'on' : ''}" aria-pressed="${(f[k] ?? []).includes(it.slot!)}">${nl}</button>`).join('')}</div>
      <small>Alleen het uiterlijk verandert, nooit de eigenschappen. Kies je meerdere figuren voor één rol, dan wisselen ze af. Niets gekozen = standaard.</small>`;
    $('roles').querySelectorAll<HTMLElement>('[data-role]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.role!; const figs = { ...(host.settings.figures ?? {}) }; const list = new Set(figs[k] ?? []);
      if (list.has(it.slot!)) list.delete(it.slot!); else list.add(it.slot!);
      figs[k] = [...list]; if (!figs[k].length) delete figs[k];
      host.settings.figures = figs; host.save(); renderRoles(it); renderGrid();
    }));
  }

  // ---- list with thumbnails (rendered once, kept for later visits)
  const thumbR = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true }); thumbR.setSize(160, 160, false); thumbR.outputColorSpace = THREE.SRGBColorSpace; thumbR.toneMapping = THREE.ACESFilmicToneMapping;
  const tScene = new THREE.Scene(); tScene.environment = scene.environment; tScene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2a1a, 1.6)); const tSun = new THREE.DirectionalLight(0xffffff, 2); tSun.position.set(3, 6, 4); tScene.add(tSun);
  const tCam = new THREE.PerspectiveCamera(30, 1, 0.01, 500);
  let queue: Item[] = [];
  async function thumbNext() {
    if (disposed) return; const it = queue.shift(); if (!it) return;
    if (!thumbs.has(it.id)) {
      const r = await makeObject(it).catch(() => null);
      if (r && !disposed) {
        if (r.fig) r.fig.previewClip?.('idle', 0);
        tScene.add(r.obj); const b = vbox(r.obj); const s = b.getSize(new THREE.Vector3()); const c = b.getCenter(new THREE.Vector3()); const rr = Math.max(s.x, s.y, s.z) || 1;
        tCam.position.set(c.x + rr * 0.55, c.y + rr * 0.25, c.z + rr * 1.15); tCam.near = rr / 100; tCam.far = rr * 20; tCam.lookAt(c); tCam.updateProjectionMatrix();
        thumbR.render(tScene, tCam); thumbs.set(it.id, thumbR.domElement.toDataURL('image/png')); tScene.remove(r.obj);
        const img = el.querySelector<HTMLImageElement>(`[data-item="${CSS.escape(it.id)}"] img`); if (img) img.src = thumbs.get(it.id)!;
      }
    }
    setTimeout(thumbNext, 0);
  }
  function renderGrid() {
    const f = host.settings.figures ?? {};
    const used = (slot?: string) => slot ? ROLES.filter(([k]) => (f[k] ?? []).includes(slot)).map(([, nl]) => nl) : [];
    const list = all.filter((i) => i.tab === tab);
    $('grid').innerHTML = list.map((i) => { const u = used(i.slot); return `<button class="gal-item ${current?.id === i.id ? 'on' : ''}" data-item="${i.id}"><img alt="" src="${thumbs.get(i.id) ?? ''}"><span>${i.name}</span>${u.length ? `<em>${u.join(', ')}</em>` : ''}</button>`; }).join('');
    $('grid').querySelectorAll<HTMLElement>('[data-item]').forEach((b) => b.addEventListener('click', () => { const it = all.find((x) => x.id === b.dataset.item)!; void show(it); $('grid').querySelectorAll('.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }));
    queue = list.filter((i) => !thumbs.has(i.id)); void thumbNext();
  }
  el.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab as Tab; el.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b)); renderGrid();
    const first = all.find((i) => i.tab === tab); if (first) void show(first);
  }));
  renderGrid(); void show(all.find((i) => i.tab === 'figures')!);

  // ---- loop
  let last = performance.now(); let raf = 0;
  const loop = (t: number) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; controls.update(); if (figure) figure.previewClip?.(clip, dt); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  void slotStatus;
  return () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); thumbR.dispose(); pm.dispose(); };
}
