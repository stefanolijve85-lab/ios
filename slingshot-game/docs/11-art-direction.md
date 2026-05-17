# 11 — Art Direction

## North Star Reference

> "If Pixar's *Up* met *Cut the Rope* in a *Clash Royale* shop."

- Soft warm key light, cool rim light.
- Exaggerated proportions: heroes 1:1.4 head-to-body ratio for friendly silhouettes.
- Materials read as gouache + plastic — slightly waxy with rim highlights.
- World feels *toy-like* — everything safe to bonk.

## Style Pillars

1. **Stylized 2.5D.** Sprites for pickups, low-poly 3D for projectiles & set dressing.
2. **Cinematic but readable.** Background depth, foreground silhouette pop.
3. **Always-juicy.** Every collision earns a particle, every motion has follow-through.
4. **Coherent across biomes.** Different palettes, same lineweight, same shading language.

## Color Bible

Three color roles:
- **Hero (saturated, warm).** Projectile, launcher, currency UI.
- **Stage (mid-saturation).** Biome props, ground, ramps.
- **Ambient (low-saturation).** Backgrounds, parallax distance.

Per biome:

| Biome | Hero hue | Stage hue | Ambient hue | LUT |
|---|---|---|---|---|
| Backyard | Sunshine yellow `#FFD23F` | Grass green `#74C365` | Soft sky `#A8DAEC` | LUT_Backyard |
| Farm | Pumpkin `#F39237` | Hay `#E0C068` | Dusk pink `#F4B7C2` | LUT_Farm |
| Rooftops | Neon magenta `#FF3CAC` | Indigo `#2A0944` | Smoggy navy `#1B3A5C` | LUT_City |
| Construction | Hazard orange `#FF7A00` | Steel grey `#9CA3AF` | Sunset amber `#E2A05A` | LUT_Construction |
| Desert | Sunset red `#E94F37` | Sand `#E1B07E` | Mesa lavender `#A78BFA` | LUT_Desert |
| Snow | Ice cyan `#A6E1FA` | White `#F2F4F6` | Powder blue `#7EC8E3` | LUT_Snow |
| Sci-Fi | Plasma cyan `#00FFFF` | Deep purple `#4C00FF` | Black `#0A0612` | LUT_SciFi |
| Space | Star gold `#FFE082` | Cosmic violet `#4B0082` | Void `#000016` | LUT_Space |

## Silhouette Rules

- Projectiles readable on **all** biome backdrops; secondary outline shader if local contrast < 0.4.
- All obstacles have at least one "iconic" silhouette element (e.g., scarecrow's hat).
- Hero projectile rim-light uses inverse of biome ambient color → "always pops".

## Lineweight & Shading

- Faux-2D shader on 3D meshes: cel-shaded with 2 light bands + rim.
- Outline shader: post-process screen-space, 1.5 px on `Projectile` and `Boss`.
- No outlines on background props (reduces visual noise).

## Modeling Standards

| Asset | Tris | Texture | Notes |
|---|---|---|---|
| Projectile (hero) | ≤ 3,500 | 512² BC, 256² Mask | LOD0 only; auto-LOD generator OFF (we tune by hand). |
| Launcher | ≤ 6,000 | 1024² | Static, no skin. |
| Obstacle | ≤ 1,200 | 256² shared atlas | Use mesh combine where possible. |
| Background prop | ≤ 400 | atlased | Many duplicates batched. |
| Boss | ≤ 12,000 | 1024² + 512² | Rigged, 28-bone budget. |

## Textures & Atlases

- 4 atlases total: Projectiles, World (per biome), UI, VFX. Each ≤ 2048².
- BC7 compression (mobile-friendly with sRGB), normals BC5.
- Mipmaps always enabled. Anisotropic 2x default.

## Lighting

- 1 directional sunlight + 1 fill light per biome (baked).
- HDR off (mobile). Bloom intensity capped at 0.35.
- Volumetric fog only in Snow biome (cheap fragment shader fake).
- Vignette 0.2, slightly stronger in night biomes.

## VFX Language (high-level — see 14-vfx-guide.md)

- **Squashy.** Particles squash to direction of motion.
- **Brief.** Most bursts ≤ 0.5 s.
- **Color-coded.** Coin = gold, Combo = white-cyan, Crit = red, Boost = electric blue.

## Animation Style

- Snappy (12 fps base for sprite animations; tween for 3D).
- Anticipation 4 frames → snap 2 frames → recovery 6–8 frames.
- "Smear" frames for high-velocity launches.

## UI Aesthetic

- Rounded chunky panels with 3 px subtle drop shadow.
- Two display fonts: 
  - **Burst** (custom, for numbers + headers; bold, slight italics).
  - **Marble** (for body; humanist sans).
- Buttons: 8 dp corner radius, 1 px stroke, pressable shadow.
- Currency icons: 32 dp, with a soft glow ring on increment.

## Asset Naming

| Asset | Pattern |
|---|---|
| Texture | `Tex_<Subject>_<Channel>` e.g., `Tex_Apple_BC.png` |
| Material | `Mat_<Subject>` |
| Mesh | `Mesh_<Subject>` |
| Animation | `Anim_<Subject>_<Action>` |
| Prefab | `<Subject>_<Role>` |

## Reference Art Pipeline

- DCC: Maya 2025 (rigging), Blender 4.x (modeling), Substance Painter (texturing).
- Hand-painted alpha decals for "stickers" (e.g., scratch marks on obstacles).
- Concept art kanban: every new biome starts with 3 thumbnail compositions before any prod art.

## Brand Identity

- Logo: stylized slingshot Y-shape with a comet leaving the band.
- Mascot: **"Pip"** — a tennis ball with mismatched eyebrows. Used as MVP avatar, store hero, push notifications.

## Production Budget per Biome

- 8 unique obstacles
- 1 ramp variant
- 1 boost pad variant
- 3 background parallax sets
- 1 boss
- 1 ambient particle system
- 1 weather variant
- ~3 weeks for a senior artist + a tech artist.
