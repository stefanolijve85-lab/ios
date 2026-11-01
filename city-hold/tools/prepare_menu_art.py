"""Text-free crops of the RIOTS UI references (assets/riots_ui/references) for the real HTML menu.
Only regions without baked-in text, buttons or icons are used. Run: python3 tools/prepare_menu_art.py"""
import os
from PIL import Image, ImageFilter
import numpy as np
R = 'assets/riots_ui/references/'; O = 'public/menu/'
os.makedirs(O, exist_ok=True)
m02 = Image.open(R + '02_main_menu.png').convert('RGB')
m03 = Image.open(R + '03_city_selection.png').convert('RGB')
m04 = Image.open(R + '04_side_selection.png').convert('RGB')
c01 = Image.open(R + '01_cover.png').convert('RGB')
# main menu street (right of the text column; no text there)
m02.crop((640, 0, 1672, 941)).save(O + 'street.jpg', quality=86)
# cover for the loading screen (designed with its own title)
c01.resize((1280, 720), Image.LANCZOS).save(O + 'cover.jpg', quality=84)
# Paris hero: the square and fountain, below TERUG and above VERDER
m03.crop((560, 125, 1672, 552)).save(O + 'hero_paris.jpg', quality=86)
# six city thumbnails without the label strip and lock icons
cards = [(38, 292), (306, 560), (575, 830), (845, 1100), (1115, 1370), (1385, 1638)]
for name, (x0, x1) in zip(['paris', 'amsterdam', 'london', 'milan', 'berlin', 'saopaulo'], cards):
    m03.crop((x0 + 5, 678, x1 - 5, 838)).save(O + f'card_{name}.jpg', quality=86)
# side cards: artwork above the card titles
m04.crop((114, 178, 814, 535)).save(O + 'side_defence.jpg', quality=86)
m04.crop((857, 178, 1556, 535)).save(O + 'side_looters.jpg', quality=86)
m04.crop((104, 737, 462, 882)).save(O + 'mission_paris.jpg', quality=86)
# side-screen backdrop: the cover, blurred and darkened (the reference backdrop sits behind baked UI)
c01.crop((0, 345, 1672, 941)).resize((1254, 447)).filter(ImageFilter.GaussianBlur(2.2)).point(lambda v: int(v * 0.8)).save(O + 'side_bg.jpg', quality=80)  # below the cover's title
# weathered mask for the RIOTS title: white = keep, transparent specks = worn paint
rng = np.random.default_rng(5); W, H = 512, 256
a = np.full((H, W), 255, np.uint8)
for _ in range(420):
    x, y = rng.integers(0, W), rng.integers(0, H); r = rng.integers(1, 3)
    a[max(0, y - r):y + r, max(0, x - r):x + r] = 0
for _ in range(28):  # scratches
    x, y = rng.integers(0, W), rng.integers(0, H); l = rng.integers(8, 40)
    for k in range(l): a[min(H - 1, y + k // 6), min(W - 1, x + k)] = 0
img = np.dstack([np.full((H, W), 255, np.uint8)] * 3 + [a])
Image.fromarray(img, 'RGBA').save(O + 'grunge.png', optimize=True)
print('ok', sorted(os.listdir(O)))
