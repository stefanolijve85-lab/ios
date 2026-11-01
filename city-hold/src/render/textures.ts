import * as THREE from 'three';
import type { BuildingStyle, StoreKind } from '../maps/types';

// All textures are generated procedurally on canvas so the game needs no external downloads.

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function tex(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}

let seed = 7;
function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

const cache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture) { let t = cache.get(key); if (!t) { t = make(); cache.set(key, t); } return t; }

/** normal map for the street: each sett is a rounded bump so lamp light glints on individual stones */
export function groundNormal(kind: 'cobble' | 'brick' | 'stone' | 'asphalt' | 'plaza'): THREE.Texture {
  return cached('gnormal-' + kind, () => {
    const src = (groundTexture(kind).image as HTMLCanvasElement);
    const N = 512; const g = src.getContext('2d')!; const d = g.getImageData(0, 0, N, N).data;
    const hgt = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) hgt[i] = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 765;
    // soften so stones read as domes rather than plateaus
    const b = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let a = 0; for (let k = -2; k <= 2; k++) for (let l = -2; l <= 2; l++) a += hgt[((y + k + N) % N) * N + ((x + l + N) % N)]; b[y * N + x] = a / 25; }
    const [c, o] = canvas(N, N); const img = o.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (b[y * N + ((x + 1) % N)] - b[y * N + ((x - 1 + N) % N)]) * 6;
      const dy = (b[((y + 1) % N) * N + x] - b[((y - 1 + N) % N) * N + x]) * 6;
      const len = Math.hypot(dx, dy, 1); const i = (y * N + x) * 4;
      img.data[i] = (-dx / len * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / len * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    o.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  });
}

export function groundTexture(kind: 'cobble' | 'brick' | 'stone' | 'asphalt' | 'plaza'): THREE.Texture {
  return cached('ground-' + kind, () => {
    const [c, g] = canvas(512, 512);
    if (kind === 'asphalt') {
      g.fillStyle = '#4a4d52'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) { const v = 60 + rnd() * 35; g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; g.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
      return tex(c);
    }
    const base = kind === 'brick' ? [120, 72, 58] : kind === 'stone' || kind === 'plaza' ? [150, 140, 125] : [112, 102, 94];
    g.fillStyle = kind === 'brick' ? '#3a2620' : '#25262b'; g.fillRect(0, 0, 512, 512);
    if (kind === 'cobble') {
      // granite setts in slightly irregular rows: rounded rectangles with tonal variation
      g.fillStyle = '#1e1f24'; g.fillRect(0, 0, 512, 512);
      const sw = 26, sh = 22;
      for (let y = 0; y < 512; y += sh) {
        const ox = (Math.round(y / sh) % 2) * sw * 0.5 + (rnd() - 0.5) * 4;
        for (let x = -sw; x < 512 + sw; x += sw) {
          const w = sw - 3 - rnd() * 3, h = sh - 3 - rnd() * 2;
          const v = rnd() * 34 - 17; const bl = rnd() * 10 - 2;
          const cx = x + ox + (rnd() - 0.5) * 2, cy = y + (rnd() - 0.5) * 2;
          g.fillStyle = `rgb(${base[0] + v},${base[1] + v - 2},${base[2] + v + bl})`;
          g.beginPath(); (g as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(cx + 1.5, cy + 1.5, w, h, 6); g.fill();
          g.fillStyle = 'rgba(255,235,200,0.07)'; g.beginPath(); g.ellipse(cx + w * 0.45, cy + h * 0.35, w * 0.3, h * 0.2, 0, 0, Math.PI * 2); g.fill();
        }
      }
    } else if (kind === 'brick') {
      const bw = 64, bh = 24;
      for (let y = 0; y < 512; y += bh) for (let x = -bw; x < 512; x += bw) {
        const ox = (y / bh) % 2 ? bw / 2 : 0; const v = rnd() * 30 - 15;
        g.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v})`;
        // herringbone-ish rows
        g.fillRect(x + ox + 2, y + 2, bw - 4, bh - 4);
      }
    } else {
      const s = kind === 'plaza' ? 128 : 64;
      for (let y = 0; y < 512; y += s) for (let x = 0; x < 512; x += s) {
        const v = rnd() * 24 - 12;
        g.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v})`; g.fillRect(x + 2, y + 2, s - 4, s - 4);
      }
      if (kind === 'plaza') { g.strokeStyle = 'rgba(230,220,200,0.35)'; g.lineWidth = 6; g.strokeRect(40, 40, 432, 432); }
    }
    return tex(c);
  });
}

interface FacadeStyle { wall: string; wall2: string; window: string; frame: string; floors: number; cols: number; balcony: boolean; shutters?: string }
const FACADES: Record<BuildingStyle, FacadeStyle> = {
  haussmann: { wall: '#d2c0a0', wall2: '#bba886', window: '#1d2330', frame: '#e6d9bd', floors: 6, cols: 3, balcony: true },
  canal: { wall: '#7a3d2c', wall2: '#5e2f24', window: '#1f2630', frame: '#efe8da', floors: 5, cols: 2, balcony: false },
  brick: { wall: '#8a4a36', wall2: '#713a2a', window: '#202631', frame: '#f1ece2', floors: 5, cols: 3, balcony: false },
  italian: { wall: '#d6ae6c', wall2: '#c39656', window: '#2a2a2a', frame: '#efe1c0', floors: 5, cols: 3, balcony: true, shutters: '#3f5a3a' },
  berlin: { wall: '#c9c4ba', wall2: '#b3ada2', window: '#262b33', frame: '#e8e4dc', floors: 6, cols: 3, balcony: true },
  modern: { wall: '#9a9ea3', wall2: '#7c8187', window: '#2f3c48', frame: '#c9cdd1', floors: 5, cols: 4, balcony: false },
};

/** one facade tile = `cols` window bays wide (2 m per bay), `floors` storeys high (3.2 m per storey).
 *  Returns the colour map and a matching emissive map (lit windows) so windows glow at blue hour. */
const facadePairs = new Map<string, { map: THREE.Texture; emi: THREE.Texture }>();
function makeFacade(style: BuildingStyle, variant: number) {
  const key = `${style}-${variant}`;
  const hit = facadePairs.get(key); if (hit) return hit;
  const f = FACADES[style];
  const W = 512, H = 1024; const [c, g] = canvas(W, H); const [ce, ge] = canvas(W, H);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
  seed = 1000 + variant * 77 + style.length * 13;
  const fh = H / f.floors, bw = W / f.cols;
  const brick = style === 'brick' || style === 'canal';
  // wall
  g.fillStyle = f.wall; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) { const v = rnd(); g.fillStyle = v < 0.5 ? `rgba(0,0,0,${rnd() * 0.06})` : `rgba(255,240,210,${rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 4, 1 + rnd() * 3); }
  if (brick) {
    for (let y = 0; y < H; y += 9) for (let x = ((y / 9) % 2) * 9; x < W; x += 18) { const v = rnd() * 26 - 13; g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 200 : 0},${v > 0 ? 170 : 0},${Math.abs(v) / 120})`; g.fillRect(x, y, 17, 8); }
    g.fillStyle = 'rgba(30,15,10,0.22)'; for (let y = 0; y < H; y += 9) g.fillRect(0, y + 8, W, 1);
  } else if (style !== 'modern') {
    // dressed stone courses with staggered joints
    const ch = fh / 5;
    for (let y = 0; y < H; y += ch) { g.fillStyle = 'rgba(60,45,30,0.16)'; g.fillRect(0, y, W, 1.5); const off = (Math.round(y / ch) % 2) * 40; for (let x = off; x < W; x += 80) g.fillRect(x, y, 1.2, ch); }
  }
  // soot / weathering streaks
  for (let i = 0; i < 26; i++) { const x = rnd() * W; const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(40,35,30,0.08)'); grd.addColorStop(1, 'rgba(40,35,30,0)'); g.fillStyle = grd; g.fillRect(x, 0, 3 + rnd() * 10, H); }
  for (let fl = 0; fl < f.floors; fl++) {
    const y0 = fl * fh;
    const ground = fl === f.floors - 1;
    const noble = fl === 1; // 2nd floor: tallest windows, pediments, continuous balcony
    if (style === 'modern') {
      g.fillStyle = '#6e7378'; g.fillRect(0, y0 + fh - 18, W, 18);
      const grd = g.createLinearGradient(0, y0, 0, y0 + fh - 18); grd.addColorStop(0, '#3c4c5a'); grd.addColorStop(1, '#22303c');
      g.fillStyle = grd; g.fillRect(0, y0 + 6, W, fh - 26);
      for (let b = 0; b < f.cols * 2; b++) {
        const x = b * (W / (f.cols * 2)); g.fillStyle = '#9aa0a6'; g.fillRect(x, y0 + 6, 4, fh - 26);
        if (rnd() < 0.5) { const wx = x + 6, ww = W / (f.cols * 2) - 10; ge.fillStyle = `rgba(${200 + rnd() * 55},${210 + rnd() * 40},${220},${0.5 + rnd() * 0.4})`; ge.fillRect(wx, y0 + 10, ww, fh - 34); g.fillStyle = 'rgba(230,235,240,0.35)'; g.fillRect(wx, y0 + 10, ww, fh - 34); }
      }
      continue;
    }
    // string course + cornice shadow
    g.fillStyle = 'rgba(255,245,225,0.35)'; g.fillRect(0, y0 + fh - 10, W, 6);
    g.fillStyle = 'rgba(20,15,10,0.35)'; g.fillRect(0, y0 + fh - 4, W, 4);
    if (ground && !brick) { g.fillStyle = 'rgba(30,22,15,0.35)'; for (let y = y0 + 8; y < y0 + fh; y += 14) g.fillRect(0, y, W, 3); }
    for (let b = 0; b < f.cols; b++) {
      const wx = b * bw + bw * 0.28, ww = bw * 0.44;
      const wy = y0 + fh * (ground ? 0.16 : noble ? 0.12 : 0.18), wh = fh * (ground ? 0.78 : noble ? 0.7 : 0.6);
      // stone surround with shadow
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(wx - 6, wy - 4, ww + 14, wh + 12);
      g.fillStyle = f.frame; g.fillRect(wx - 8, wy - 8, ww + 16, wh + 12);
      if (noble && style === 'haussmann') { g.beginPath(); g.moveTo(wx - 14, wy - 8); g.lineTo(wx + ww / 2, wy - 30); g.lineTo(wx + ww + 14, wy - 8); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(wx - 14, wy - 9, ww + 28, 3); }
      if (style === 'italian' || (ground && style === 'berlin')) { g.fillStyle = f.frame; g.beginPath(); g.arc(wx + ww / 2, wy, ww / 2 + 8, Math.PI, 0); g.fill(); }
      const lit = rnd() < (ground ? 0.25 : 0.5);
      const warm = rnd();
      const grd = g.createLinearGradient(0, wy, 0, wy + wh);
      if (lit) { grd.addColorStop(0, warm > 0.5 ? '#ffe2a8' : '#ffd08a'); grd.addColorStop(1, warm > 0.5 ? '#d88a40' : '#c47a36'); }
      else { grd.addColorStop(0, '#4a5870'); grd.addColorStop(0.5, '#27303f'); grd.addColorStop(1, f.window); }
      g.fillStyle = grd; g.fillRect(wx, wy, ww, wh);
      if (style === 'italian' || (ground && style === 'berlin')) { g.beginPath(); g.arc(wx + ww / 2, wy, ww / 2, Math.PI, 0); g.fill(); }
      if (lit) {
        // curtains and a lamp glow inside
        g.fillStyle = 'rgba(150,70,40,0.45)'; g.fillRect(wx, wy, ww * 0.18, wh); g.fillRect(wx + ww * 0.82, wy, ww * 0.18, wh);
        const eg = ge.createLinearGradient(0, wy, 0, wy + wh); eg.addColorStop(0, 'rgba(255,210,140,0.95)'); eg.addColorStop(1, 'rgba(255,150,70,0.75)');
        ge.fillStyle = eg; ge.fillRect(wx + ww * 0.18, wy, ww * 0.64, wh);
      } else { g.fillStyle = 'rgba(140,170,210,0.18)'; g.fillRect(wx + 2, wy + 2, ww * 0.4, wh * 0.5); }
      // mullions / transom
      g.fillStyle = f.frame; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); g.fillRect(wx, wy + wh * 0.33, ww, 3);
      ge.fillStyle = '#000'; ge.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); ge.fillRect(wx, wy + wh * 0.33, ww, 3);
      if (f.shutters) { g.fillStyle = f.shutters; g.fillRect(wx - ww * 0.36 - 8, wy, ww * 0.34, wh); g.fillRect(wx + ww + 8, wy, ww * 0.34, wh); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = wy; k < wy + wh; k += 5) { g.fillRect(wx - ww * 0.36 - 8, k, ww * 0.34, 1); g.fillRect(wx + ww + 8, k, ww * 0.34, 1); } }
      // individual wrought-iron balconettes
      if (f.balcony && !ground && !noble && fl !== 4) {
        g.fillStyle = '#121214'; g.fillRect(wx - 6, wy + wh - 22, ww + 12, 3); g.fillRect(wx - 6, wy + wh - 1, ww + 12, 2);
        for (let k = 0; k <= 10; k++) g.fillRect(wx - 6 + k * (ww + 12) / 10, wy + wh - 22, 1.5, 22);
        g.strokeStyle = '#121214'; g.lineWidth = 1.2; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(wx - 6 + (k + 0.5) * (ww + 12) / 5, wy + wh - 11, 4, 0, Math.PI * 2); g.stroke(); }
      }
    }
    // continuous balcony on the 2nd and 5th floors (Haussmann rhythm)
    if (f.balcony && (noble || fl === 4) && !ground) {
      const by = y0 + fh * (noble ? 0.82 : 0.78);
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, by + 26, W, 8);
      g.fillStyle = f.wall2; g.fillRect(0, by + 22, W, 6);
      g.fillStyle = '#0f0f11'; g.fillRect(0, by - 4, W, 3); g.fillRect(0, by + 20, W, 2);
      for (let x = 0; x < W; x += 6) g.fillRect(x, by - 4, 1.4, 24);
      g.strokeStyle = '#0f0f11'; g.lineWidth = 1.3; for (let x = 6; x < W; x += 16) { g.beginPath(); g.ellipse(x, by + 8, 5, 8, 0, 0, Math.PI * 2); g.stroke(); }
    }
  }
  const map = tex(c); const emi = tex(ce);
  const pair = { map, emi }; facadePairs.set(key, pair); return pair;
}
export function facadeTexture(style: BuildingStyle, variant = 0): THREE.Texture { return makeFacade(style, variant).map; }
export function facadeEmissive(style: BuildingStyle, variant = 0): THREE.Texture { return makeFacade(style, variant).emi; }

export function roofTexture(style: BuildingStyle): THREE.Texture {
  return cached('roof-' + style, () => {
    const [c, g] = canvas(256, 256);
    const col = style === 'italian' ? '#a5553a' : style === 'canal' ? '#4a423e' : style === 'modern' || style === 'berlin' ? '#6a6d72' : '#596374';
    g.fillStyle = col; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 12) for (let x = 0; x < 256; x += 16) {
      const v = rnd() * 0.22; g.fillStyle = `rgba(0,0,0,${v})`; g.fillRect(x + ((y / 12) % 2) * 8, y, 15, 11);
      if (rnd() < 0.15) { g.fillStyle = 'rgba(200,215,235,0.12)'; g.fillRect(x + ((y / 12) % 2) * 8, y, 15, 3); }
    }
    if (style === 'haussmann' || style === 'berlin') { g.fillStyle = 'rgba(170,180,195,0.35)'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 2, 256); }
    return tex(c);
  });
}

const STORE_SIGN: Record<StoreKind, string> = {
  jewellery: 'BIJOUX', electronics: 'ÉLECTRO', fashion: 'MODE', sports: 'SPORT', phones: 'MOBILE', department: 'STORE',
};

export function signTexture(name: string, kind: StoreKind, color: number): THREE.Texture {
  return cached(`sign-${name}-${color}`, () => {
    const [c, g] = canvas(512, 96);
    g.fillStyle = '#' + color.toString(16).padStart(6, '0'); g.fillRect(0, 0, 512, 96);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, 0, 512, 10);
    g.fillStyle = '#e8d6a6'; g.font = '600 46px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(STORE_SIGN[kind], 256, 52);
    return tex(c, false);
  });
}

/** interior seen through the shop window; `fill` (0..1) is the remaining stock */
export function interiorTexture(kind: StoreKind, fill: number): THREE.Texture {
  const step = Math.round(fill * 4);
  return cached(`int-${kind}-${step}`, () => {
    const W = 512, H = 256; const [c, g] = canvas(W, H);
    seed = 500 + kind.length * 31;
    // back wall, ceiling and a floor in perspective
    const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#f6dcae'); wall.addColorStop(0.65, '#d9a467'); wall.addColorStop(1, '#8a5a34');
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(90,55,30,0.55)'; g.beginPath(); g.moveTo(0, H); g.lineTo(60, 185); g.lineTo(W - 60, 185); g.lineTo(W, H); g.fill();
    g.fillStyle = 'rgba(255,250,235,0.9)'; for (let x = 40; x < W; x += 90) { g.beginPath(); g.ellipse(x, 8, 16, 4, 0, 0, Math.PI * 2); g.fill(); }
    for (let x = 40; x < W; x += 90) { const sp = g.createRadialGradient(x, 30, 0, x, 30, 70); sp.addColorStop(0, 'rgba(255,245,215,0.55)'); sp.addColorStop(1, 'rgba(255,245,215,0)'); g.fillStyle = sp; g.fillRect(x - 70, 0, 140, 140); }
    const n = Math.round(fill * 10);
    const shelf = kind === 'jewellery' ? '#5a1622' : kind === 'electronics' || kind === 'phones' ? '#1b2238' : '#6a4a32';
    // wall shelving
    g.fillStyle = shelf; for (const y of [70, 120]) g.fillRect(20, y, W - 40, 6);
    for (let i = 0; i < 10; i++) {
      const x = 30 + i * 46; const has = i < n;
      if (kind === 'jewellery') {
        g.fillStyle = 'rgba(40,10,15,0.85)'; g.fillRect(x, 150, 36, 34); // display case
        g.fillStyle = 'rgba(220,240,255,0.35)'; g.fillRect(x, 136, 36, 16);
        if (has) { g.fillStyle = '#fff3c2'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + 7 + k * 11, 146, 3.2, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#ffd86a'; g.fillRect(x + 4, 60, 8, 10); g.fillRect(x + 20, 110, 8, 10); }
      } else if (kind === 'electronics' || kind === 'phones') {
        g.fillStyle = '#10141f'; g.fillRect(x, 150, 38, 30);
        if (has) { g.fillStyle = ['#7fd0ff', '#9ab8ff', '#bfe9ff'][i % 3]; g.fillRect(x + 2, 26 + (i % 2) * 6, 34, 40); g.fillStyle = '#e8f4ff'; g.fillRect(x + 8, 134, 7, 14); g.fillRect(x + 20, 134, 7, 14); }
        else { g.fillStyle = '#20263a'; g.fillRect(x + 2, 26, 34, 40); }
      } else {
        if (has) { // mannequins / garments
          g.fillStyle = '#e8e0d4'; g.beginPath(); g.arc(x + 18, 96, 7, 0, Math.PI * 2); g.fill();
          g.fillStyle = ['#2a2a38', '#7a2f2f', '#2f5a3a', '#c8b48a', '#3a4a6a'][i % 5]; g.beginPath(); g.moveTo(x + 6, 106); g.lineTo(x + 30, 106); g.lineTo(x + 34, 175); g.lineTo(x + 2, 175); g.fill();
        } else { g.fillStyle = 'rgba(60,40,30,0.5)'; g.fillRect(x + 16, 104, 4, 70); }
      }
    }
    if (n === 0) { g.fillStyle = 'rgba(40,30,25,0.35)'; g.fillRect(0, 0, W, H); for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(160,120,80,0.6)'; g.fillRect(rnd() * W, 190 + rnd() * 50, 20, 6); } }
    return tex(c, false);
  });
}

export function crackTexture(level: number): THREE.Texture {
  return cached('crack-' + level, () => {
    const [c, g] = canvas(256, 128);
    g.clearRect(0, 0, 256, 128);
    g.strokeStyle = 'rgba(235,245,255,0.85)'; g.lineWidth = 1.4;
    const n = level === 1 ? 5 : 16;
    for (let k = 0; k < n; k++) {
      const cx = 30 + rnd() * 196, cy = 20 + rnd() * 88;
      for (let r = 0; r < 7; r++) { g.beginPath(); g.moveTo(cx, cy); let x = cx, y = cy; for (let s = 0; s < 4; s++) { x += (rnd() - 0.5) * 40; y += (rnd() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    }
    if (level >= 2) { g.fillStyle = 'rgba(10,10,15,0.55)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(rnd() * 256, rnd() * 128, 18 + rnd() * 20, 10 + rnd() * 16, rnd() * 3, 0, Math.PI * 2); g.fill(); } }
    return tex(c, false);
  });
}

export function shutterTexture(): THREE.Texture {
  return cached('shutter', () => {
    const [c, g] = canvas(128, 128);
    g.fillStyle = '#8b939c'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 8) { g.fillStyle = '#6d747c'; g.fillRect(0, y, 128, 2); g.fillStyle = '#a9b1b9'; g.fillRect(0, y + 2, 128, 1); }
    return tex(c);
  });
}

export function radialTexture(inner: string, outer: string): THREE.Texture {
  return cached(`rad-${inner}-${outer}`, () => {
    const [c, g] = canvas(128, 128);
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, inner); grd.addColorStop(1, outer);
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function flameTexture(): THREE.Texture {
  return cached('flame', () => {
    const [c, g] = canvas(64, 64);
    const grd = g.createRadialGradient(32, 36, 0, 32, 36, 30);
    grd.addColorStop(0, 'rgba(255,250,210,1)'); grd.addColorStop(0.35, 'rgba(255,170,50,0.9)'); grd.addColorStop(0.7, 'rgba(220,60,10,0.35)'); grd.addColorStop(1, 'rgba(120,20,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function smokeTexture(): THREE.Texture {
  return cached('smoke', () => {
    const [c, g] = canvas(64, 64);
    for (let i = 0; i < 6; i++) {
      const x = 22 + rnd() * 20, y = 22 + rnd() * 20, r = 14 + rnd() * 12;
      const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(70,70,75,0.5)'); grd.addColorStop(1, 'rgba(70,70,75,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function iconTexture(kind: string, color: string): THREE.Texture {
  return cached(`icon-${kind}-${color}`, () => {
    const [c, g] = canvas(64, 64);
    g.fillStyle = 'rgba(8,14,22,0.85)'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
    g.strokeStyle = color; g.lineWidth = 4; g.stroke();
    g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 4; g.lineCap = 'round';
    switch (kind) {
      case 'security': g.beginPath(); g.moveTo(32, 14); g.lineTo(48, 22); g.lineTo(44, 42); g.lineTo(32, 50); g.lineTo(20, 42); g.lineTo(16, 22); g.closePath(); g.fill(); break;
      case 'shield': g.fillRect(20, 14, 24, 34); g.fillStyle = 'rgba(8,14,22,0.85)'; g.fillRect(24, 20, 16, 4); break;
      case 'firefighter': g.beginPath(); g.moveTo(32, 12); g.quadraticCurveTo(50, 34, 32, 52); g.quadraticCurveTo(14, 34, 32, 12); g.fill(); break;
      case 'runner': g.beginPath(); g.moveTo(16, 40); g.lineTo(30, 22); g.lineTo(38, 32); g.lineTo(50, 18); g.stroke(); g.beginPath(); g.moveTo(42, 18); g.lineTo(50, 18); g.lineTo(50, 26); g.stroke(); break;
      case 'carrier': g.fillRect(20, 22, 24, 20); g.fillStyle = 'rgba(8,14,22,0.85)'; g.fillRect(30, 22, 4, 20); break;
      case 'heavy': g.fillRect(14, 26, 18, 18); g.fillRect(34, 18, 18, 26); break;
      case 'vandal': g.beginPath(); g.moveTo(20, 20); g.lineTo(44, 44); g.moveTo(44, 20); g.lineTo(20, 44); g.stroke(); break;
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function arrowTexture(color: string): THREE.Texture {
  return cached('arrow-' + color, () => {
    const [c, g] = canvas(64, 128);
    g.fillStyle = color;
    g.beginPath(); g.moveTo(32, 4); g.lineTo(60, 48); g.lineTo(42, 48); g.lineTo(42, 124); g.lineTo(22, 124); g.lineTo(22, 48); g.lineTo(4, 48); g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function waterTexture(): THREE.Texture {
  return cached('water', () => {
    const [c, g] = canvas(256, 256);
    g.fillStyle = '#2a4a5c'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${200 + rnd() * 55},${160 + rnd() * 60},90,${0.1 + rnd() * 0.3})`; g.fillRect(rnd() * 256, rnd() * 256, 10 + rnd() * 30, 1.5); }
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(20,40,55,${rnd() * 0.5})`; g.fillRect(rnd() * 256, rnd() * 256, 20 + rnd() * 40, 2); }
    return tex(c);
  });
}
