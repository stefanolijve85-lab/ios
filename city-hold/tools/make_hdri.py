"""Procedural blue-hour HDRI (equirectangular Radiance .hdr, 1024x512) for reflections and ambient light.
Not a photographed HDRI: a gradient sky, moon, warm city glow on the horizon and lit windows below it.
Run: python3 tools/make_hdri.py"""
import numpy as np
W, H = 1024, 512
rng = np.random.default_rng(3)
v = (np.arange(H) + 0.5) / H            # 0 top .. 1 bottom
u = (np.arange(W) + 0.5) / W
el = np.repeat((0.5 - v)[:, None] * np.pi, W, axis=1)  # elevation, +pi/2 zenith
az = (u[None, :] - 0.5) * 2 * np.pi
img = np.zeros((H, W, 3), np.float32)
s = np.clip(np.sin(el), 0, 1)
# sky: deep blue zenith -> violet/rose horizon
zen = np.array([0.020, 0.035, 0.11]); hor = np.array([0.22, 0.20, 0.36]); band = np.array([0.55, 0.32, 0.30])
t = (1 - s) ** 3
sky = zen * (1 - t)[..., None] + hor * t[..., None] + band * np.exp(-(el / 0.06) ** 2)[..., None] * 0.6
img[:] = np.where((el > 0)[..., None], sky, 0)
# moon
mx, my = 0.62, 0.3
md = np.sqrt(((u[None, :] - mx) * 2) ** 2 + (v[:, None] - my) ** 2)
img += (np.exp(-(md / 0.006) ** 2) * 60)[..., None] * np.array([0.9, 0.95, 1.0])
img += (np.exp(-(md / 0.05) ** 2) * 0.25)[..., None] * np.array([0.6, 0.7, 1.0])
# city below the horizon: dark facades with warm windows and a sodium glow
below = el <= 0
fac = np.array([0.03, 0.028, 0.035])
img[below] = fac
glow = np.exp(-(np.abs(el) / 0.05) ** 2)
img += (glow * 1.2)[..., None] * np.array([1.0, 0.55, 0.22])
win = (rng.random((H, W)) < 0.012) & (el < -0.02) & (el > -0.6)
img[win] += np.array([3.0, 1.9, 0.9]) * rng.uniform(0.5, 1.5, win.sum())[:, None]
# wet street reflection of the glow near the nadir
img += (np.exp(-((el + np.pi / 2) / 0.6) ** 2) * 0.04)[..., None] * np.array([1.0, 0.7, 0.45])

def write_hdr(path, a):
    a = np.maximum(a, 0); m = a.max(axis=2)
    e = np.ceil(np.log2(np.maximum(m, 1e-32))); sc = np.where(m > 1e-32, 256.0 / np.power(2.0, e), 0)
    rgbe = np.zeros(a.shape[:2] + (4,), np.uint8)
    rgbe[..., :3] = np.clip(a * sc[..., None], 0, 255).astype(np.uint8)
    rgbe[..., 3] = np.where(m > 1e-32, e + 128, 0).astype(np.uint8)
    with open(path, 'wb') as f:
        f.write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n' + f'-Y {a.shape[0]} +X {a.shape[1]}\n'.encode())
        f.write(rgbe.tobytes())
write_hdr('public/env/blue_hour.hdr', img)
print('ok')
