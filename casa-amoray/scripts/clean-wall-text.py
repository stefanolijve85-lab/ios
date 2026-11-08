"""
Verwijdert een (door AI verbasterde) tekstregel op een muur uit een beeldreeks.

De regel wordt in elk frame teruggevonden met template matching (meerdere schalen,
want de camera zoomt), en het vlak wordt opnieuw gevuld met een verloop van de muur
erboven en eronder (zelfde techniek als fix-mockup-text.py).

Gebruik (vanuit casa-amoray, met OpenCV: pip install opencv-python-headless numpy pillow):
  python3 scripts/clean-wall-text.py <scene-map> x0 y0 x1 y1 [--extend-left]
  - x0 y0 x1 y1: kader van (een herkenbaar deel van) de tekst in frame 1
  - --extend-left: wis de hele regel links van het gevonden deel tot de beeldrand
"""
import glob
import os
import sys

import cv2
import numpy as np
from PIL import Image

folder, x0, y0, x1, y1 = sys.argv[1], *map(int, sys.argv[2:6])
extend_left = "--extend-left" in sys.argv
files = sorted(glob.glob(os.path.join(folder, "f_*.webp")))

def load(f):
    return np.array(Image.open(f).convert("RGB"))

def refill(rgb, box, pad=4):
    bx0, by0, bx1, by1 = box
    H, W = rgb.shape[:2]
    bx0, bx1 = max(0, bx0), min(W, bx1)
    ya, yb = max(3, by0 - pad), min(H - 3, by1 + pad)
    if bx1 - bx0 < 4 or yb - ya < 4:
        return
    top = cv2.blur(rgb[ya - 3:ya, bx0:bx1].astype(np.float32).mean(axis=0)[None], (15, 1))[0]
    bot = cv2.blur(rgb[yb:yb + 3, bx0:bx1].astype(np.float32).mean(axis=0)[None], (15, 1))[0]
    t = np.linspace(0, 1, yb - ya, dtype=np.float32)[:, None, None]
    fill = top[None] * (1 - t) + bot[None] * t
    fill += np.random.default_rng(bx0 + by0).normal(0, 1.2, fill.shape).astype(np.float32)
    # zachte overgang aan de randen van het vlak
    region = rgb[ya:yb, bx0:bx1].astype(np.float32)
    m = np.ones(fill.shape[:2], np.float32)
    m = cv2.GaussianBlur(np.pad(m, 6, constant_values=0), (13, 13), 0)[6:-6, 6:-6][..., None]
    rgb[ya:yb, bx0:bx1] = np.clip(region * (1 - m) + fill * m, 0, 255).astype(np.uint8)

first = load(files[0])
gray0 = cv2.cvtColor(first, cv2.COLOR_RGB2GRAY)
tmpl = gray0[y0:y1, x0:x1]
th, tw = tmpl.shape
PAD = 400
cx, cy, cs = x0, y0, 1.0  # laatste positie en schaal
cleaned = 0
for f in files:
    rgb = load(f)
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    gp = cv2.copyMakeBorder(g, PAD, PAD, PAD, PAD, cv2.BORDER_REPLICATE)
    best = (-1, 0, 0, 1.0)
    for s in np.arange(max(0.9, cs - 0.06), cs + 0.1, 0.01):
        t = cv2.resize(tmpl, (int(tw * s), int(th * s)))
        # zoek alleen rond de vorige positie
        sx0, sy0 = int(cx + PAD - 90), int(cy + PAD - 50)
        sub = gp[sy0:sy0 + t.shape[0] + 100, sx0:sx0 + t.shape[1] + 150]
        if sub.shape[0] < t.shape[0] or sub.shape[1] < t.shape[1]:
            continue
        r = cv2.matchTemplate(sub, t, cv2.TM_CCOEFF_NORMED)
        _, mv, _, ml = cv2.minMaxLoc(r)
        if mv > best[0]:
            best = (mv, sx0 + ml[0] - PAD, sy0 + ml[1] - PAD, s)
    score, bx, by, s = best
    if score < 0.45 or bx + tw * s < 0:
        print(f"{os.path.basename(f)}: tekst niet meer gevonden (score {score:.2f}), klaar")
        break
    cx, cy, cs = bx, by, s
    box = (0 if extend_left else int(bx) - 6, int(by) - 4, int(bx + tw * s) + 8, int(by + th * s) + 4)
    refill(rgb, box)
    Image.fromarray(rgb).save(f, quality=52, method=6)
    cleaned += 1
print(f"✓ {cleaned} frames schoongemaakt in {folder}")
