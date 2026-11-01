"""Procedural 4x4 flipbook atlases (16 looping frames, 128 px each) for fire, smoke and tear gas.
Colours follow the effects pack sprites (assets/effects_characters/effects). Run: python3 tools/make_flipbooks.py"""
import numpy as np
from PIL import Image
import os

rng = np.random.default_rng(7)
N = 128; F = 16
def noise3(shape, scale):
    # tileable-in-time value noise: periodic in t over F frames
    gx, gy, gt = max(2, N // scale), max(2, N // scale), 4
    g = rng.random((gt, gy + 1, gx + 1))
    g[:, :, -1] = g[:, :, 0]
    ys, xs = np.mgrid[0:N, 0:N] / N
    out = np.zeros((F, N, N))
    for f in range(F):
        tt = f / F * gt; t0 = int(tt) % gt; t1 = (t0 + 1) % gt; ft = tt - int(tt)
        def sample(gg, xo):
            x = (xs * gx + xo) % gx; y = ys * gy
            x0 = x.astype(int); y0 = y.astype(int); fx = x - x0; fy = y - y0
            fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
            a = gg[y0, x0]; b = gg[y0, x0 + 1]; c = gg[np.minimum(y0 + 1, gy), x0]; d = gg[np.minimum(y0 + 1, gy), x0 + 1]
            return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
        out[f] = sample(g[t0], 0) * (1 - ft) + sample(g[t1], 0) * ft
    return out
def fbm(oct=4, base=4):
    s = np.zeros((F, N, N)); amp = 1; tot = 0
    for o in range(oct): s += noise3((F, N, N), max(4, N // (base * 2 ** o))) * amp; tot += amp; amp *= 0.5
    return s / tot

ys, xs = np.mgrid[0:N, 0:N] / N
os.makedirs('public/fx', exist_ok=True)
def atlas(frames_rgba, name):
    A = np.zeros((4 * N, 4 * N, 4), np.uint8)
    for f in range(F): r, c = divmod(f, 4); A[r * N:(r + 1) * N, c * N:(c + 1) * N] = frames_rgba[f]
    Image.fromarray(A, 'RGBA').save(f'public/fx/{name}_atlas.png', optimize=True)

# fire: rising turbulent flame, hot core, teardrop envelope
n = fbm(5, 3)
fr = []
for f in range(F):
    # scroll the noise upward over the loop
    sh = n[f]  # noise is periodic over the loop, so the flicker cycles without a seam
    cx = 0.5 + (sh - 0.5) * 0.25
    width = 0.32 * (ys ** 0.8) + 0.04
    env = np.clip(1 - np.abs(xs - cx) / width, 0, 1) * np.clip(ys * 1.6, 0, 1) * np.clip((1 - ys) * 6, 0, 1)
    heat = np.clip(env * (0.55 + sh) - 0.35 + ys * 0.25, 0, 1)
    r = np.clip(heat * 2.2, 0, 1); g = np.clip(heat * 1.5 - 0.25, 0, 1); b = np.clip(heat * 1.6 - 0.95, 0, 1)
    a = np.clip(heat * 2.4, 0, 1)
    fr.append((np.dstack([r, g, b, a]) * 255).astype(np.uint8))
atlas(fr, 'fire')

# smoke / gas: soft billows that churn in place (particles supply growth and drift)
for name, col, dens in [('smoke', (0.42, 0.42, 0.45), 1.7), ('tear_gas', (0.93, 0.92, 0.88), 0.75)]:
    n = fbm(5, 2)
    fr = []
    d = np.sqrt((xs - 0.5) ** 2 + (ys - 0.5) ** 2)
    for f in range(F):
        m = np.clip(1 - d / 0.48, 0, 1) ** 1.3
        a = np.clip((n[f] * 1.4 - 0.25) * m * 1.6 * dens, 0, 1)
        shade = 0.75 + 0.35 * (1 - ys) * n[f]
        rgb = np.dstack([np.full_like(a, col[0]), np.full_like(a, col[1]), np.full_like(a, col[2])]) * shade[..., None]
        fr.append((np.dstack([np.clip(rgb, 0, 1), a]) * 255).astype(np.uint8))
    atlas(fr, name)
print('ok')
