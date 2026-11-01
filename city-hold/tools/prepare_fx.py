"""Small runtime sprites from the effects pack (assets/effects_characters). Originals stay untouched.
Run from city-hold:  python3 tools/prepare_fx.py"""
import os
from PIL import Image
SRC = 'assets/effects_characters'
os.makedirs('public/fx', exist_ok=True)
for name in ['fire', 'smoke', 'sparks', 'explosion', 'tear_gas']:
    im = Image.open(f'{SRC}/effects/{name}.png').convert('RGBA')
    bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(bbox)
    # pad to a square with transparent borders so rotated particles never show hard edges
    s = max(im.size); sq = Image.new('RGBA', (int(s * 1.08), int(s * 1.08)), (0, 0, 0, 0))
    sq.paste(im, ((sq.width - im.width) // 2, (sq.height - im.height) // 2))
    sq = sq.resize((256, 256), Image.LANCZOS)
    # straight alpha: clear colour where alpha is ~0 to avoid dark/coloured halos when filtered
    px = sq.load()
    for y in range(256):
        for x in range(256):
            r, g, b, a = px[x, y]
            if a < 3: px[x, y] = (0, 0, 0, 0)
    sq.save(f'public/fx/{name}.png', optimize=True)
os.makedirs('public/ui', exist_ok=True)
for name in ['firefighter', 'firefighter_hose', 'shield_officer', 'evacuating_civilian', 'shopkeeper', 'helper']:
    im = Image.open(f'{SRC}/figures/{name}.png').convert('RGBA'); im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox())
    im.thumbnail((192, 192), Image.LANCZOS); im.save(f'public/ui/fx_{name}.webp', 'WEBP', quality=82)
print('ok')

# card portraits from the throw-pose sheets (first pose = wind-up)
import glob
for f in sorted(glob.glob('assets/throw_poses/*/*.png')):
    im = Image.open(f).convert('RGBA'); w, h = im.size
    third = im.crop((0, 0, w // 3, h)); third = third.crop(third.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox())
    third.thumbnail((192, 192)); third.save('public/ui/thr_' + os.path.basename(f)[:-4] + '.webp', 'WEBP', quality=82)
