#!/usr/bin/env bash
# Zet een (Higgsfield-)videoclip om in een geoptimaliseerde beeldreeks voor de
# scrollytelling en werkt src/content/media-manifest.json bij.
#
# Gebruik (vanuit de map casa-amoray):
#   npm run frames -- <video.mp4> <scene-id> <mobile|desktop> [aantal-frames]
#
# Voorbeelden:
#   npm run frames -- ~/Downloads/02-binnenkomst-9x16.mp4 binnenkomst mobile
#   npm run frames -- ~/Downloads/02-binnenkomst-16x9.mp4 binnenkomst desktop 72
#   npm run frames -- clip.mp4 welkom mobile 48 "crop=iw:ih-140:0:140"
#
# Het optionele 5e argument is een ffmpeg-filter dat vóór het schalen wordt toegepast,
# bijvoorbeeld om een rand met een AI-tekstfout weg te snijden.
#
# Standaard: mobiel 96 frames op 720x1280 (volle clipresolutie, licht verscherpt), desktop 72 frames op 1280x720, WebP.
# Meer frames = vloeiender, maar zwaarder. Houd mobiel rond 2-3 MB per scène.
set -euo pipefail

VIDEO="${1:?Geef het pad naar de video op}"
SCENE="${2:?Geef de scene-id op (bv. binnenkomst)}"
VARIANT="${3:?Geef mobile of desktop op}"
case "$VARIANT" in
  mobile)  W=720;  H=1280; N="${4:-96}"; Q=52 ;;
  desktop) W=1280; H=720;  N="${4:-72}"; Q=52 ;;
  *) echo "Variant moet 'mobile' of 'desktop' zijn"; exit 1 ;;
esac
PRE="${5:-}"
[ -n "$PRE" ] && PRE="$PRE,"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/media/scenes/$SCENE/$VARIANT"
mkdir -p "$OUT"
rm -f "$OUT"/f_*.webp

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
FPS=$(python3 -c "print(max(1e-3, $N / float('$DUR')))")

# Schaal + bijsnijden naar de juiste compositie (cover), gelijkmatig N frames.
ffmpeg -loglevel error -y -i "$VIDEO" \
  -vf "${PRE}fps=$FPS,scale=$W:$H:force_original_aspect_ratio=increase:flags=lanczos,crop=$W:$H,unsharp=5:5:0.55:5:5:0" \
  -frames:v "$N" -c:v libwebp -quality "$Q" -compression_level 6 \
  "$OUT/f_%04d.webp"

COUNT=$(ls "$OUT" | grep -c '^f_.*\.webp$')
python3 - "$ROOT/src/content/media-manifest.json" "$SCENE" "$VARIANT" "$COUNT" "$W" "$H" <<'PY'
import json, sys, os, time
path, scene, variant, count, w, h = sys.argv[1:]
m = json.load(open(path)) if os.path.exists(path) else {}
entry = m.setdefault(scene, {})
entry[variant] = {"frames": int(count), "path": f"/media/scenes/{scene}/{variant}", "width": int(w), "height": int(h), "v": int(time.time())}
entry["placeholder"] = False
json.dump(m, open(path, "w"), indent=2)
PY

echo "✓ $COUNT frames → public/media/scenes/$SCENE/$VARIANT ($(du -sh "$OUT" | cut -f1))"
echo "  Manifest bijgewerkt. Zet in src/content/scenes.ts: media: { kind: \"sequence\", id: \"$SCENE\" }"
