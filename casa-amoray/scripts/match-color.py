"""
Laat de kleuren en belichting van een beeldreeks aansluiten op een referentiebeeld
(bv. de hero-foto), zodat de overgang van foto naar video niet opvalt.

Methode: Reinhard-kleurtransfer in Lab-ruimte. De correctie wordt één keer berekend
(referentie vs. frame 1) en daarna op álle frames toegepast, zodat de film consistent blijft.

Gebruik (vanuit casa-amoray, met OpenCV):
  python3 scripts/match-color.py <scene-map> <referentiebeeld> [sterkte 0..1]
"""
import glob
import os
import sys

import cv2
import numpy as np
from PIL import Image

folder, ref_path = sys.argv[1], sys.argv[2]
strength = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
files = sorted(glob.glob(os.path.join(folder, "f_*.webp")))

def lab(img):
    return cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2LAB).astype(np.float32)

first = Image.open(files[0])
ref = Image.open(ref_path).convert("RGB").resize(first.size, Image.LANCZOS)
a, r = lab(first), lab(ref)
ma, sa = a.reshape(-1, 3).mean(0), a.reshape(-1, 3).std(0) + 1e-6
mr, sr = r.reshape(-1, 3).mean(0), r.reshape(-1, 3).std(0)
scale = 1 + (sr / sa - 1) * strength
shift_to = ma + (mr - ma) * strength
print("Lab gemiddelde frame1", ma.round(1), "-> referentie", mr.round(1))
for f in files:
    x = lab(Image.open(f))
    y = (x - ma) * scale + shift_to
    out = cv2.cvtColor(np.clip(y, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    Image.fromarray(out).save(f, quality=52, method=6)
print(f"✓ {len(files)} frames afgestemd op {os.path.basename(ref_path)}")
