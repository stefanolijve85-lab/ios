# Definitive 3D assets still missing

The Paris street is fully playable with **temporary models**. Every character and prop the game draws comes from a
model *slot*; `public/models/manifest.json` says which GLB fills each slot and whether it is `placeholder` or `final`.
All 29 slots are currently filled by placeholders generated from the procedural figures (`npm run placeholders`).
The in-game menu **3D assets** shows the live status per slot.

## How to deliver a final asset

1. Export glTF 2.0 binary (`.glb`): metres, Y up, facing +Z, origin at the feet / base, PBR metallic-roughness,
   textures embedded (max 2048², characters 1024–2048²). Budgets: character ≤ 15k triangles, prop ≤ 5k.
2. Copy it to `public/models/final/` and point the slot to it in `manifest.json`:
   `"char.security": { "file": "final/security.glb", "status": "final" }`
3. Run the game. No code change is needed. `npm test` checks the file, the clip names and the `carry` node.
   `npm run placeholders` never overwrites slots marked `final`.

### Character contract (all `char.*` slots)
- Rigged (skinned) or node-animated; one model per slot.
- **Animation clips, exact names:** `idle`, `walk`, `run`, `carry_idle`, `carry_walk`, `breach` (push/pull at a shutter),
  `collect` (reach, grasp, lift — sheet 38), `held` (open palms against a shield + recoil — sheet 39), `restrained`
  (stop signal, upright — sheet 41), `escorted` (walking, hands behind back — sheet 41), `restrain` (officer holding),
  `escort` (officer leading), `brace` (shield guard stance — sheet 40), `extinguish`. Loops must cycle cleanly;
  walk ≈ 0.84 s, run ≈ 0.51 s per cycle at the game's speeds (they are time-scaled to the unit's speed).
- Node **`carry`**: the carried goods (box / bags / TV box), shown only while loaded.
- Material named **`skin`** (recoloured per unit so the cast stays varied); casual looters also `top` and `legs`.
- Shield officer: node `shield`. Firefighter: extinguisher in the right hand.

## Missing — characters (17 slots, all placeholder)

| Slot | Reference |
|---|---|
| `char.security` | images 10, 11 (male and female variants welcome — add `char.security_b` later) |
| `char.shield` | image 12, poses sheet 40 |
| `char.firefighter` | image 29 |
| `char.runner` | image 26 (unloaded) + loaded variant via `carry` |
| `char.carrier` | images 13, 14, 27 |
| `char.heavy` | image 28 |
| `char.vandal` | no image supplied |
| `char.looter.01_tracksuit_arms_spread` … `char.looter.10_windbreaker_small_box` | extra streetwear sheets 01–10 |

## Missing — props (12 slots, all placeholder)

`prop.lamp` (Paris cast-iron lantern, lantern material named `glow`), `prop.tree`, `prop.planter`, `prop.bench`,
`prop.bollard`, `prop.umbrella` (café table + parasol), `prop.car` (image 18), `prop.car_burned` (image 19),
`prop.van` (image 17, light bar meshes named `beacon*`), `prop.barrier` (image 15), `prop.concrete` (image 31),
`prop.camera_mast` (image 16).

## Built in code — final assets still wanted

Everything below is real procedural 3D geometry in the engine (no reference image is used as a texture).
Each has, or can get, a GLB slot; a final GLB marked `final` in `manifest.json` replaces it without code changes.

### Paris shops (pack `assets/paris_realism`) — slots `shop.electronics|fashion|jewelry|grocery|cafe|sneakers` (optional)
`src/render/shopModule.ts`: VOLT, ATELIER, LUMIERE (gameplay stores) and MARCHE, CAFE RIVE, COURT (decorative).
Persistent shell (8 m module, 0.22 m window recess, 0.3 m entrance recess, plinth, pilasters with base/capital,
fascia sign, three-profile cornice, wall lanterns), interior box with type-specific fixtures, seeded stock, and the
named groups glass_intact / glass_broken / boards / shutter_intact / shutter_bent / debris / damage_decals plus
sockets entrance, pickup_01..06, sign, light_left, light_right. A GLB round trip (export → load into the slot →
drive with game state) was verified in the browser. **Missing:** six final shop GLBs with sculpted mouldings,
real product models, and PBR materials (limestone, painted wood, brass, glass, cardboard).

### Street objects (pack `assets/street_props`)
`src/render/streetProps.ts`: cast-iron lamp, slatted bench, Versailles planter tree (LOD crown), bus shelter,
crowd barrier with snap points, trailer camera mast with turning camera pivots, unbranded delivery van, octagonal
three-bowl fountain, extinguisher. Slots: `prop.lamp`, `prop.bench`, `prop.tree`, `prop.shelter`,
`prop.delivery_van`, `prop.barrier`, `prop.camera_mast`, `prop.fountain` (optional). **Missing:** final GLBs.

### Effects (pack `assets/effects_characters`)
The five PNGs are used as particle sprites (`public/fx`, made by `tools/prepare_fx.py`); motion is pooled particles.
**Missing:** flipbook/atlas animations for fire, smoke and gas, and a soft-particle depth fade.

### Done since the last list (procedural, made in this repository)
- **Rigged characters:** every `char.*` GLB is now a real skinned character (skeleton + one SkinnedMesh per
  material, `src/render/rig.ts`) with 17 clips including `throw`, `guide`, `flee`. Auto-rigged low-poly figures,
  weights 1.0 per joint — not artist-made, no faces or cloth simulation.
- **Civilian, shopkeeper, helper** now have roles (neutral; `tests/npc.test.ts`) and rigged slots.
- **Flipbooks:** fire, smoke and tear gas play 16-frame atlases (`tools/make_flipbooks.py`).
- **PBR + HDRI:** generated tileable sets for limestone, wet setts (puddle roughness) and slate
  (`tools/make_pbr.py`) and a blue-hour HDRI (`tools/make_hdri.py`, used for reflections and ambient light).
  These are generated, not scanned/photographed: replace with real CC0/licensed sets when available.
- **GLB templates for artists:** `assets/model_templates/*.glb` (`tools/make-templates.cjs`): the six shops with
  all named groups and sockets, the street props, and one Haussmann block — same names and sizes the game expects.

### Still needed from an artist or a library
- Final shop GLBs, street-prop GLBs and a modular facade kit (use the templates above as the contract).
- Hand-made rigged characters with faces/hands and real cloth, and hand-animated clips.
- Photographic/scanned PBR sets and a real blue-hour HDRI (the network policy blocked Poly Haven here).
- Hand-painted or simulated VFX flipbooks.

### Characters
The supplied figure PNGs (firefighter, firefighter with hose, shield officer, civilian, shopkeeper, helper) are used
as card portraits and as build references. **Missing:** rigged, skinned GLB characters for every `char.*` slot with
the clip names listed above; the civilian, shopkeeper and helper have no gameplay role yet.

### Buildings, ground, light
Haussmann facade kit, fan-pattern setts, pavements and sky are procedural. **Missing:** modular facade GLB kit
(bay, corner, ground floor, mansard, dormer, chimney), tileable PBR sets (setts, slabs, kerb, limestone, slate,
zinc, brick) and a licensed blue-hour HDRI.

Other cities (Amsterdam, London, Milan, Berlin, São Paulo) need their own building kits; they are out of scope
for this Paris-street milestone.
