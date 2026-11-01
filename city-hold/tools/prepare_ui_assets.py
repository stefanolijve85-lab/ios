"""Create small runtime UI derivatives (icons, menu backdrops) from the supplied reference PNGs.
Run from the city-hold folder:  python3 tools/prepare_ui_assets.py
Originals in assets/ are never modified."""
import glob, os
from PIL import Image
OUT = 'public/ui'
os.makedirs(OUT, exist_ok=True)
for f in glob.glob('assets/units/*.png') + glob.glob('assets/units/extra_streetwear/*.png') + glob.glob('assets/props/*.png'):
    im = Image.open(f).convert('RGBA')
    bbox = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
    if bbox: im = im.crop(bbox)
    im.thumbnail((192, 192), Image.LANCZOS)
    im.save(os.path.join(OUT, os.path.basename(f).replace('.png', '.webp')), 'WEBP', quality=82)
for f in glob.glob('assets/maps/*.png'):
    im = Image.open(f).convert('RGB')
    im.thumbnail((1280, 720), Image.LANCZOS)
    im.save(os.path.join(OUT, os.path.basename(f).replace('.png', '.jpg')), 'JPEG', quality=72)
print('done', len(os.listdir(OUT)))
