"""
Vervangt de Portugese teksten in de aangeleverde mock-ups door Nederlandse.

  "MASSAGEM · BEM-ESTAR · CONEXÃO"         -> "MASSAGE · WELZIJN · VERBINDING"
  "ÓLEO DE MASSAGEM" / "LAVANDA" (flessen) -> "MASSAGEOLIE" / "LAVENDEL"
  "Obrigada por escolher a Casa Amoray."   -> "Bedankt dat je voor Casa Amoray kiest."

Werkwijze per tekstvlak: de oorspronkelijke tekstkleur meten, het vlak opnieuw vullen vanuit
de randen (verloop + korrel) en de Nederlandse tekst in dezelfde kleur, maat en zachtheid terugzetten.
Uitvoer: reference/nl/*.png, die scripts/make-placeholders.py als bron gebruikt.

Vereist: pip install opencv-python-headless numpy pillow
Gebruik: python3 scripts/fix-mockup-text.py   (vanuit de map casa-amoray)
"""
import os
import cv2  # noqa: E402
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REF = os.path.join(ROOT, "reference")
OUT = os.path.join(REF, "nl")
FONTS = os.path.join(ROOT, "scripts", "fonts")
os.makedirs(OUT, exist_ok=True)

TAGLINE = "MASSAGE · WELZIJN · VERBINDING"


def font(kind, size, weight):
    f = ImageFont.truetype(os.path.join(FONTS, "manrope-latin.woff2" if kind == "sans" else "cormorant-garamond-latin.woff2"), size)
    f.set_variation_by_axes([weight])
    return f


def text_color(rgb, box, dark_text):
    """Kleur van de oorspronkelijke letters: gemiddelde van de donkerste/lichtste 12% pixels."""
    x0, y0, x1, y1 = box
    px = rgb[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32)
    lum = px @ np.array([0.299, 0.587, 0.114], np.float32)
    k = max(1, int(len(px) * 0.12))
    idx = np.argsort(lum)[:k] if dark_text else np.argsort(lum)[-k:]
    return tuple(int(v) for v in px[idx].mean(axis=0))


def refill(rgb, box, pad=3, seed=0):
    """Vult het tekstvlak opnieuw: per kolom een verloop van de rand erboven naar de rand eronder,
    met een beetje korrel zodat het niet glad/plastic oogt. Werkt goed op muren, labels en kaarten."""
    x0, y0, x1, y1 = box
    top = rgb[y0 - pad - 3:y0 - pad, x0:x1].astype(np.float32).mean(axis=0)
    bot = rgb[y1 + pad:y1 + pad + 3, x0:x1].astype(np.float32).mean(axis=0)
    # horizontaal licht gladstrijken zodat losse randpixels geen strepen geven
    top = cv2.blur(top[None], (9, 1))[0]
    bot = cv2.blur(bot[None], (9, 1))[0]
    h = (y1 + pad) - (y0 - pad)
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    fill = top[None] * (1 - t) + bot[None] * t
    rng = np.random.default_rng(seed)
    region = rgb[y0 - pad - 12:y0 - pad, x0:x1].astype(np.float32)
    grain = float(np.clip(region.std(axis=(0, 1)).mean() * 0.25, 0.5, 4))
    fill += rng.normal(0, grain, fill.shape).astype(np.float32)
    rgb[y0 - pad:y1 + pad, x0:x1] = np.clip(fill, 0, 255).astype(np.uint8)


def draw_tracked(img, center, text, fnt_spec, fill, tracking_em, blur=0.0, ss=4):
    """Tekst met letterspatiëring, gecentreerd op `center`.
    Wordt op 4x formaat getekend en daarna verkleind: nauwkeurige letterafstand, ook bij kleine tekst."""
    kind, size, weight = fnt_spec
    big = font(kind, size * ss, weight)
    tracking = tracking_em * size * ss
    widths = [big.getlength(c) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    asc, desc = big.getmetrics()
    W, H = int(total + 8 * ss), int(asc + desc + 8 * ss)
    layer = Image.new("RGBA", (W, H), fill[:3] + (0,))
    d = ImageDraw.Draw(layer)
    x = 4 * ss
    for c, w in zip(text, widths):
        d.text((x, 4 * ss), c, font=big, fill=fill)
        x += w + tracking
    layer = layer.resize((max(1, round(W / ss)), max(1, round(H / ss))), Image.LANCZOS)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    px = round(center[0] - layer.width / 2)
    py = round(center[1] - layer.height / 2 + desc / ss * 0.3)
    img.alpha_composite(layer, (px, py))


def fit_size(text, kind, weight, width, tracking_em, start=40):
    for size in range(start, 6, -1):
        f = font(kind, size, weight)
        w = sum(f.getlength(c) for c in text) + tracking_em * size * (len(text) - 1)
        if w <= width:
            return size
    return 7


def process(src, dst, jobs):
    im = Image.open(os.path.join(REF, src)).convert("RGB")
    rgb = np.array(im)
    for i, j in enumerate(jobs):
        j["color"] = j.get("color_override") or text_color(rgb, j["box"], j["dark"])
        refill(rgb, j["box"], seed=i)
    out = Image.fromarray(rgb).convert("RGBA")
    for j in jobs:
        x0, y0, x1, y1 = j["box"]
        width = (x1 - x0) * j.get("fill", 0.96)
        lines = j["text"].split("\n")
        size = j.get("size") or fit_size(max(lines, key=len), j["kind"], j["weight"], width, j["tracking"])
        cx, cy = (x0 + x1) / 2 + j.get("dx", 0), (y0 + y1) / 2 + j.get("dy", 0)
        lh = size * j.get("leading", 1.15)
        for k, line in enumerate(lines):
            ly = cy + (k - (len(lines) - 1) / 2) * lh
            draw_tracked(out, (cx, ly), line, (j["kind"], size, j["weight"]), j["color"] + (int(255 * j.get("alpha", 0.92)),), j["tracking"], j.get("blur", 0.4))
    out.convert("RGB").save(os.path.join(OUT, dst))
    print("✓", dst)


SANS_TAG = dict(kind="sans", weight=500, tracking=0.16)

process("mockup-lounge.jpg", "mockup-lounge.png", [
    dict(box=(158, 322, 462, 354), dark=True, text=TAGLINE, **SANS_TAG, blur=0.6),
    dict(box=(1110, 970, 1322, 996), dark=False, text=TAGLINE, **SANS_TAG, blur=0.4, alpha=1.0, fill=0.97, dx=-2, color_override=(226, 214, 198)),
    dict(box=(934, 993, 1090, 1045), dark=True, text="Bedankt dat je voor\nCasa Amoray kiest.",
         kind="serif", weight=500, tracking=0.0, leading=1.25, blur=0.4, fill=0.9),
])
process("mockup-producten.png", "mockup-producten.png", [
    dict(box=(56, 254, 496, 290), dark=True, text=TAGLINE, **SANS_TAG, blur=1.6, alpha=0.8),
    dict(box=(592, 630, 756, 660), dark=False, text="MASSAGEOLIE", kind="sans", weight=500, tracking=0.12, fill=0.8, blur=0.5),
    dict(box=(626, 676, 716, 699), dark=False, text="LAVENDEL", kind="sans", weight=500, tracking=0.14, fill=0.95, blur=0.5),
])
process("mockup-voetmassage.png", "mockup-voetmassage.png", [
    dict(box=(74, 234, 480, 264), dark=True, text=TAGLINE, **SANS_TAG, blur=0.7),
    dict(box=(1028, 903, 1152, 927), dark=False, text="MASSAGEOLIE", kind="sans", weight=500, tracking=0.1, fill=0.85, blur=0.5),
    dict(box=(1054, 940, 1126, 961), dark=False, text="LAVENDEL", kind="sans", weight=500, tracking=0.12, fill=0.85, blur=0.5),
])
process("mockup-ontspanning.png", "mockup-ontspanning.png", [
    dict(box=(276, 206, 576, 234), dark=True, text=TAGLINE, **SANS_TAG, blur=0.6),
    dict(box=(1081, 896, 1180, 917), dark=False, text="MASSAGEOLIE", kind="sans", weight=500, tracking=0.08, fill=0.85, blur=0.5),
    dict(box=(1103, 923, 1155, 942), dark=False, text="LAVENDEL", kind="sans", weight=500, tracking=0.1, fill=1.15, blur=0.5),
])
