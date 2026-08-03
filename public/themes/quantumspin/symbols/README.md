# QUANTUM SPIN — symbol art drop-in

Place symbol images here and the game uses them automatically — no code change.
Until a file exists for a symbol, the game renders a crafted neon-glyph fallback,
so it is fully playable with zero art.

## Filenames

One file per symbol id (any of the formats below; the AssetManager probes
`avif → webp → png → svg` and uses the first it finds):

```
HERO_F   pink cyber-pilot   (top premium)
HERO_M   cyber-runner
GEM      quantum crystal
PLANET   ringed planet
ORB_B    blue energy orb
ORB_O    orange plasma orb
WILD     Quantum Wild
SCATTER  Quantum Portal (scatter / free-spins trigger)
A K Q J  royals
```

e.g. `HERO_F.webp`, `WILD.avif`, `A.png`.

## Recommendations

- Square, ~512×512, transparent background, trimmed to the symbol.
- Prefer **AVIF/WEBP** for size; keep a PNG fallback if you need max compatibility.
- Keep a consistent inner padding so symbols align on the reel.
- Texture-atlas packing happens at the renderer layer (Phase 1, PixiJS); source
  files here stay individual for easy iteration.
