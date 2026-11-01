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

## Missing — still generated in code (no slot yet; I add the slot when the asset arrives)

These have the biggest visual impact on matching concept art 01–07:

1. **Haussmann building kit** (Paris street): facade bay with real window depth and iron balcony, corner module,
   ground-floor module, mansard roof module with dormers, chimney stack with pots. Limestone / slate / zinc PBR.
2. **Three shopfronts** at human scale, fixed order left → right: burgundy jewellery, navy electronics,
   green fashion. Each with: interior with displays, door, roll-down shutter (levels 1–3 look), and damage states
   intact / cracked glass / shattered + bent shutter (images 04–06). Interior should come in 3–5 "stock" states.
3. **Fountain** (central, tiered, lit basin — image 01/03).
4. **Ground materials** (PBR, tileable, with height/normal): wet cobbles, pavement slabs, kerb stones.
5. **HDRI** of a blue-hour sky for reflections and ambient light.
6. Optional: café terrace set, flower beds, debris / glass-shard set, fire and smoke flipbook textures.

Other cities (Amsterdam, London, Milan, Berlin, São Paulo) need their own building kits; they are out of scope
for this Paris-street milestone.
