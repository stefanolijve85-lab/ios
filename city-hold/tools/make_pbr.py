"""Procedural tileable PBR sets (albedo, normal, roughness; 512 px) for limestone, wet setts and slate.
Generated, not scanned. Run: python3 tools/make_pbr.py"""
import numpy as np, os
from PIL import Image
N = 512; rng = np.random.default_rng(11)
os.makedirs('public/textures', exist_ok=True)
def tile_noise(scale, oct=5):
    out = np.zeros((N, N)); amp = 1; tot = 0
    for o in range(oct):
        g = max(2, scale * 2 ** o); grid = rng.random((g, g))
        x = np.linspace(0, g, N, endpoint=False); x0 = x.astype(int); f = x - x0; f = f * f * (3 - 2 * f); x1 = (x0 + 1) % g
        a = grid[x0][:, x0]; b = grid[x0][:, x1]; c = grid[x1][:, x0]; d = grid[x1][:, x1]
        out += ((a * (1 - f) + b * f) * (1 - f[:, None]) + (c * (1 - f) + d * f) * f[:, None]) * amp; tot += amp; amp *= 0.5
    return out / tot
def normal_from(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength; dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.dstack([-dx, dy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)
def save(name, alb, h, rough, strength):
    Image.fromarray((np.clip(alb, 0, 1) * 255).astype(np.uint8)).save(f'public/textures/{name}_albedo.jpg', quality=88)
    Image.fromarray(normal_from(h, strength)).save(f'public/textures/{name}_normal.jpg', quality=92)
    Image.fromarray((np.clip(rough, 0, 1) * 255).astype(np.uint8)).save(f'public/textures/{name}_rough.jpg', quality=90)

# limestone ashlar: courses 4 per tile, staggered joints, fine grain, faint veins, soot at the joints
y, x = np.mgrid[0:N, 0:N] / N
grain = tile_noise(8); veins = np.abs(tile_noise(3, 4) - 0.5)
course = (y * 4) % 1; row = (y * 4).astype(int); jx = ((x * 2 + (row % 2) * 0.5) % 1)
joint = np.minimum(np.minimum(course, 1 - course) * 4 * 30, np.minimum(jx, 1 - jx) * 2 * 30); joint = np.clip(joint, 0, 1)
base = np.array([0.86, 0.80, 0.68])
alb = base * (0.9 + 0.12 * grain[..., None]) * (0.92 + 0.08 * np.clip(veins * 8, 0, 1)[..., None])
alb = alb * (0.7 + 0.3 * joint[..., None])
h = grain * 0.4 + joint * 1.0
save('limestone', alb, h, 0.82 + 0.1 * grain - 0.1 * (1 - joint), 3.0)

# wet setts: rounded granite blocks; puddles lower the roughness in hollows
bw = 16; by = 20
cx = (x * bw + ((y * by).astype(int) % 2) * 0.5) % 1; cy = (y * by) % 1
dome = np.clip(1 - (np.abs(cx - 0.5) * 2) ** 4 - (np.abs(cy - 0.5) * 2) ** 4, 0, 1)
stone_var = tile_noise(16, 2)
alb = np.array([0.42, 0.40, 0.40]) * (0.75 + 0.35 * stone_var[..., None]) * (0.4 + 0.6 * np.sqrt(dome)[..., None])
puddle = np.clip((tile_noise(2, 3) - 0.55) * 6, 0, 1)
h = np.sqrt(dome) * 1.0 + tile_noise(32, 2) * 0.1
rough = np.clip(0.55 - 0.3 * (1 - np.sqrt(dome)) - 0.4 * puddle, 0.04, 1)
save('setts', alb, h, rough, 4.0)

# slate roof: overlapping rectangular tiles in rows
tw = 10; th = 18
rx = (x * tw + ((y * th).astype(int) % 2) * 0.5) % 1; ry = (y * th) % 1
edge = np.clip(np.minimum(np.minimum(rx, 1 - rx) * 25, ry * 12), 0, 1)
var = tile_noise(24, 2)
alb = np.array([0.30, 0.33, 0.38]) * (0.8 + 0.3 * var[..., None]) * (0.55 + 0.45 * edge[..., None])
save('slate', alb, edge * (1 - ry * 0.6), 0.45 + 0.2 * var, 3.0)
print('ok')
