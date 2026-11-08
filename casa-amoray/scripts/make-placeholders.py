"""
Maakt de logo's, de stills (mobiel + desktop) en het OG-beeld uit de Nederlandse
mock-ups (reference/nl). De beeldreeksen komen uit de Higgsfield-clips
(zie scripts/video-to-frames.sh en docs/STORYBOARD-HIGGSFIELD.md).

Gebruik:  python3 -I scripts/make-placeholders.py   (vanuit de map casa-amoray)
"""
import json, os, time
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REF = os.path.join(ROOT, "reference")
# Mock-ups met Nederlandse tekst (gemaakt door scripts/fix-mockup-text.py)
REF_NL = os.path.join(REF, "nl")
PUB = os.path.join(ROOT, "public", "media")

def out(*p):
    path = os.path.join(PUB, *p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path

# ---------- 1. Logo's -> transparante PNG (donker + crème) ----------
def logo_alpha(src, invert=False, lo=70, hi=225):
    im = Image.open(src).convert("L")
    if invert:
        im = ImageOps.invert(im)
    # donkere inkt op lichte achtergrond -> alpha
    alpha = im.point(lambda v: 255 if v <= lo else 0 if v >= hi else int(255 * (hi - v) / (hi - lo)))
    bbox = alpha.getbbox()
    return alpha.crop(bbox)

def save_logo(alpha, name, rgb):
    for label, color in rgb.items():
        layer = Image.new("RGBA", alpha.size, color + (0,))
        layer.putalpha(alpha)
        layer.save(out("brand", f"{name}-{label}.png"), optimize=True)

DARK, CREAM = (73, 53, 46), (248, 241, 235)
save_logo(logo_alpha(os.path.join(REF, "logo-wordmark.jpg")), "wordmark", {"dark": DARK, "cream": CREAM})
save_logo(logo_alpha(os.path.join(REF, "logo-monogram.jpg"), invert=True, lo=40, hi=170), "monogram", {"dark": DARK, "cream": CREAM})

# ---------- 2. Stills (mobiel staand 9:16 + desktop 16:9) ----------
def crop_to(im, ratio, fx=0.5, fy=0.5, zoom=1.0):
    W, H = im.size
    if W / H > ratio:
        h = H / zoom; w = h * ratio
    else:
        w = W / zoom; h = w / ratio
    cx = min(max(fx * W, w / 2), W - w / 2)
    cy = min(max(fy * H, h / 2), H - h / 2)
    return im.crop((int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2)))

STILLS = {
    # naam: (bron in reference/nl, focus mobiel x, focus desktop x)
    # lounge-clean: zonder het bruine 'casa amoray'-bord rechtsonder (bewerkt met GPT Image)
    "lounge": ("mockup-lounge-clean.png", 0.42, 0.5),
    "welkom": ("mockup-lounge-clean.png", 0.30, 0.38),
    "ruimte": ("mockup-producten.png", 0.48, 0.5),
    "behandeling": ("mockup-voetmassage.png", 0.52, 0.5),
    "nagevoel": ("mockup-ontspanning.png", 0.62, 0.5),
}
for name, (src, fxm, fxd) in STILLS.items():
    im = Image.open(os.path.join(REF_NL, src)).convert("RGB")
    zoom = 1.25 if name == "welkom" else 1.0
    fy = 0.62 if name == "welkom" else 0.5
    m = crop_to(im, 9 / 16, fxm, fy, zoom).resize((630, 1120), Image.LANCZOS)
    d = crop_to(im, 16 / 9, fxd, fy, zoom).resize((1280, 720), Image.LANCZOS)
    m.save(out("stills", f"{name}-mobile.webp"), quality=74, method=6)
    d.save(out("stills", f"{name}-desktop.webp"), quality=74, method=6)

# OG-afbeelding
og = crop_to(Image.open(os.path.join(REF_NL, "mockup-lounge-clean.png")).convert("RGB"), 1200 / 630).resize((1200, 630), Image.LANCZOS)
og.save(out("og-casa-amoray.jpg"), quality=82)

# De beeldreeksen zelf komen nu uit de Higgsfield-clips: zie scripts/video-to-frames.sh.
print("klaar")
