# LAUNCHED! — Web Prototype

Single-file HTML5/Canvas prototype of the core gameplay loop. **Zero dependencies, no build step.**

## Play

**Option A — open directly:** double-click `index.html`. Works in Chrome / Safari / Firefox / mobile browsers.

**Option B — serve locally** (recommended on iOS for audio):
```bash
cd slingshot-game/web-prototype
python3 -m http.server 8000
# then visit http://localhost:8000 from any device on the same network
```

**Option C — host on GitHub Pages:** any static host works; the file is self-contained.

## Controls

| Action | Touch | Mouse |
|---|---|---|
| Aim | Drag back from anywhere | Click-drag back |
| Release | Lift finger | Release |
| Boost (during 0.3 s after a bounce) | Tap the glowing **BOOST!** button (or anywhere on screen) | Click anywhere |

## What this prototype demonstrates

- Drag-and-release impulse with charge-curve easing (matches `Launcher.cs`).
- Combo + multiplier ladder (`m = 1 + ⌊combo/4⌋ × 0.5`, capped at 10) — same formula as `ComboService.cs`.
- Procedural infinite biome generation, with phase-based difficulty scaling.
- Boost tap window after every bounce (`TUNE.boostWindow`).
- Critical impact zones (red pads) that trigger slow-mo + +4 combo.
- Particle effects, screen shake (Cinemachine-style), screen flash, hit pause.
- Synthesized audio (Web Audio API) — no asset loading.
- Camera follow with velocity look-ahead.
- Personal best stored in `localStorage`.
- Vibration API for haptics on supported devices.

## What's intentionally cut

This is a **gameplay-feel** prototype, not the production game. Skipped:

- Meta progression, upgrades, shop, battle pass — full design in `docs/`.
- 8 biomes (only Backyard styled).
- Cosmetics, unlocks beyond the 5 starter projectiles.
- Cloud save, ads, IAP.
- Detailed art — everything is procedural shapes.

The point is to validate **does the moment-to-moment feel right?** Open it, drag, release, beat your PB. If you smile within 10 seconds, the design pillars are working.

## Tuning Knobs

All numbers are at the top of the `<script>` in `index.html`, under `const TUNE = { ... }`. Try:

- `gravity: 1400` — lower for floatier
- `baseImpulse: 1500` — higher for absurd launches
- `boostWindow: 0.30` — tighten to make boost a skill check
- `multCap: 10` — raise to chase ridiculous multipliers

Refresh the page to apply.
