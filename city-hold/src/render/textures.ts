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

export function groundTexture(kind: 'cobble' | 'brick' | 'stone' | 'asphalt' | 'plaza'): THREE.Texture {
  return cached('ground-' + kind, () => {
    const [c, g] = canvas(512, 512);
    if (kind === 'asphalt') {
      g.fillStyle = '#2b2e33'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) { const v = 35 + rnd() * 30; g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; g.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
      return tex(c);
    }
    const base = kind === 'brick' ? [120, 72, 58] : kind === 'stone' || kind === 'plaza' ? [150, 140, 125] : [104, 98, 94];
    g.fillStyle = kind === 'brick' ? '#3a2620' : '#25262b'; g.fillRect(0, 0, 512, 512);
    if (kind === 'cobble') {
      const s = 32;
      for (let y = 0; y < 512; y += s * 0.8) for (let x = -s; x < 512; x += s) {
        const ox = (Math.round(y / (s * 0.8)) % 2) * s * 0.5;
        const v = rnd() * 40 - 20; const bl = rnd() * 14;
        g.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v + bl})`;
        g.beginPath(); g.ellipse(x + ox + s / 2, y + s * 0.4, s * 0.45, s * 0.36, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,220,170,0.08)'; g.beginPath(); g.ellipse(x + ox + s / 2 - 4, y + s * 0.3, s * 0.2, s * 0.12, 0, 0, Math.PI * 2); g.fill();
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
  haussmann: { wall: '#cdbb9b', wall2: '#b9a684', window: '#2a2f3a', frame: '#e3d6bb', floors: 6, cols: 3, balcony: true },
  canal: { wall: '#7a3d2c', wall2: '#5e2f24', window: '#1f2630', frame: '#efe8da', floors: 5, cols: 2, balcony: false },
  brick: { wall: '#8a4a36', wall2: '#713a2a', window: '#202631', frame: '#f1ece2', floors: 5, cols: 3, balcony: false },
  italian: { wall: '#d6ae6c', wall2: '#c39656', window: '#2a2a2a', frame: '#efe1c0', floors: 5, cols: 3, balcony: true, shutters: '#3f5a3a' },
  berlin: { wall: '#c9c4ba', wall2: '#b3ada2', window: '#262b33', frame: '#e8e4dc', floors: 6, cols: 3, balcony: true },
  modern: { wall: '#9a9ea3', wall2: '#7c8187', window: '#2f3c48', frame: '#c9cdd1', floors: 5, cols: 4, balcony: false },
};

/** one facade tile = `cols` window bays wide (2 m per bay), `floors` storeys high (3.2 m per storey) */
export function facadeTexture(style: BuildingStyle, variant = 0): THREE.Texture {
  return cached(`facade-${style}-${variant}`, () => {
    const f = FACADES[style];
    const W = 256, H = 512; const [c, g] = canvas(W, H);
    g.fillStyle = f.wall; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 3, 2); }
    const fh = H / f.floors, bw = W / f.cols;
    for (let fl = 0; fl < f.floors; fl++) {
      const y0 = fl * fh;
      g.fillStyle = f.wall2; g.fillRect(0, y0 + fh - 4, W, 4); // cornice line
      if (style === 'brick' || style === 'canal') { for (let by = y0; by < y0 + fh; by += 6) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, by, W, 1); } }
      const ground = fl === f.floors - 1;
      for (let b = 0; b < f.cols; b++) {
        const wx = b * bw + bw * 0.27, ww = bw * 0.46, wy = y0 + fh * (ground ? 0.2 : 0.18), wh = fh * (ground ? 0.72 : 0.62);
        g.fillStyle = f.frame; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
        const lit = rnd() < 0.45;
        const grd = g.createLinearGradient(0, wy, 0, wy + wh);
        if (lit) { grd.addColorStop(0, '#ffd99a'); grd.addColorStop(1, '#e09a4a'); } else { grd.addColorStop(0, '#3a4253'); grd.addColorStop(1, f.window); }
        g.fillStyle = grd; g.fillRect(wx, wy, ww, wh);
        g.fillStyle = f.frame; g.fillRect(wx + ww / 2 - 1, wy, 2, wh); g.fillRect(wx, wy + wh * 0.4, ww, 2);
        if (f.shutters) { g.fillStyle = f.shutters; g.fillRect(wx - ww * 0.35 - 3, wy, ww * 0.3, wh); g.fillRect(wx + ww + 3, wy, ww * 0.3, wh); }
        if (f.balcony && !ground && (fl === 1 || fl === 3 || style === 'italian')) {
          g.fillStyle = '#1b1c1f'; g.fillRect(wx - 6, wy + wh - 10, ww + 12, 3);
          for (let k = 0; k < 8; k++) g.fillRect(wx - 6 + k * (ww + 12) / 7, wy + wh - 10, 1.5, 12);
        }
        if (style === 'italian' && ground) { g.fillStyle = f.wall2; g.beginPath(); g.arc(wx + ww / 2, wy, ww / 2 + 3, Math.PI, 0); g.fill(); }
      }
    }
    if (style === 'haussmann') { g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = fh * (f.floors - 1); y < H; y += 10) g.fillRect(0, y, W, 2); }
    const t = tex(c); return t;
  });
}

export function roofTexture(style: BuildingStyle): THREE.Texture {
  return cached('roof-' + style, () => {
    const [c, g] = canvas(256, 256);
    const col = style === 'italian' ? '#9a4a32' : style === 'canal' ? '#3b3532' : style === 'modern' || style === 'berlin' ? '#55585c' : '#3e4652';
    g.fillStyle = col; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 12) for (let x = 0; x < 256; x += 16) {
      const v = rnd() * 0.18; g.fillStyle = `rgba(0,0,0,${v})`; g.fillRect(x + ((y / 12) % 2) * 8, y, 15, 11);
    }
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
    const [c, g] = canvas(256, 128);
    const grd = g.createLinearGradient(0, 0, 0, 128); grd.addColorStop(0, '#ffe2b0'); grd.addColorStop(1, '#c98a4a');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(80,50,30,0.35)'; g.fillRect(0, 96, 256, 32);
    const n = step * 2;
    for (let i = 0; i < 8; i++) {
      const x = 16 + i * 30;
      if (i >= n) { g.fillStyle = 'rgba(60,40,30,0.45)'; g.fillRect(x, 80, 20, 3); continue; } // empty plinth
      if (kind === 'jewellery') { g.fillStyle = '#5a1420'; g.fillRect(x, 70, 22, 26); g.fillStyle = '#fff0b8'; g.beginPath(); g.arc(x + 11, 64, 6, 0, Math.PI * 2); g.fill(); }
      else if (kind === 'electronics' || kind === 'phones') { g.fillStyle = '#1a2440'; g.fillRect(x, 40, 24, 40); g.fillStyle = '#7fc9ff'; g.fillRect(x + 3, 44, 18, 26); }
      else if (kind === 'fashion' || kind === 'department') { g.fillStyle = '#ddd'; g.beginPath(); g.arc(x + 11, 34, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = ['#223', '#7a2f2f', '#2f5a3a', '#c8b48a'][i % 4]; g.fillRect(x + 2, 42, 18, 50); }
      else { g.fillStyle = ['#d33', '#36c', '#eee'][i % 3]; g.fillRect(x, 60, 22, 30); }
    }
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
    g.fillStyle = '#0d1a24'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${150 + rnd() * 100},${120 + rnd() * 80},80,${rnd() * 0.25})`; g.fillRect(rnd() * 256, rnd() * 256, 10 + rnd() * 30, 1.5); }
    return tex(c);
  });
}
