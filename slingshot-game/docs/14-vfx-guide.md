# 14 — VFX Guide ("The Juice Bible")

## Juice Taxonomy

Every gameplay moment maps to one or more juice "ingredients":

| Ingredient | Tools | Cost (CPU/GPU) |
|---|---|---|
| Camera Shake | Cinemachine Impulse | Cheap |
| Camera Punch | DOTween on FOV/zoom | Cheap |
| Slow Motion | `Time.timeScale` | Free |
| Screen Flash | UI Image fade | Cheap |
| Chromatic Aberration | URP Post Process | Medium (toggle per scene) |
| Hit Pause / Freeze Frame | `Time.timeScale = 0` for 1–3 frames | Free |
| Particles | Shuriken / VFX Graph | Variable |
| Decals | URP decals | Medium |
| Squash & Stretch | DOTween scale | Cheap |
| Procedural Mesh Shake | Custom shader | Cheap |
| Trails | TrailRenderer | Medium |
| Audio Stinger | One-shot SFX | Cheap |

## Juice Catalog (Mapping Moments → Ingredients)

| Moment | Juice |
|---|---|
| Slingshot draw | Squash band, audio creak, controller haptic light. |
| Slingshot release | Camera punch 0.08, white flash 1 frame, slow-mo 0.2 s, haptic medium, *thwock* SFX, trail spawn. |
| First bounce | Hit pause 2 frames, dust particle, camera shake 0.25, impact SFX. |
| Combo +1 | Counter pop, sparkle particle, micro-sound `+1` ping. |
| Combo break | Counter "snap" with red flash, low brass stinger. |
| Boost tap success | Radial shockwave, +20 combo flash, light-cyan trail change for 1 s. |
| Crit hit | Slow-mo 0.4 s, red screen tint 30%, chromatic aberration ramp, heavy haptic, comedic 8-bit "WOAH". |
| Coin pickup | Magnet swirl, 1 small ting, +n popup. |
| Crate open | Tilt, shake, pop, spray particles, depending on rarity escalate intensity. |
| End-of-run PB | Confetti rain, gold UI glow, triumphant chord, vibrate burst. |

## Particle Budget

- **Run scene cap:** 800 simultaneous particles.
- **Per-effect cap:** 80 particles. Anything beyond replaced with decal + flash.
- **Burst lifetime:** ≤ 0.6 s ≈ 2 frame budget at 60 fps.
- **No Mesh Renderers** in particles on mobile — only billboards.
- **Texture atlas:** all VFX share `Tex_VFX_Atlas_2048.png`.

## Shader Catalog

| Shader | Use | Cost |
|---|---|---|
| `S_Lit_Stylized` | Standard hero shader. Lit, cel-shaded, rim. | Cheap |
| `S_DissolveDestroy` | Destruction shards. Edge glow, alpha cutoff. | Medium |
| `S_HitFlash` | Brief white-out on hit using `_FlashAmount` property. | Cheap |
| `S_TrailGradient` | Custom for projectile trail with gradient ramp tex. | Cheap |
| `S_PlasmaArc` | Plasma launcher VFX | Medium |
| `S_Outline` | Screen-space outline post FX for projectile/boss | Medium |
| `S_BiomeUnlit` | Background props, cheap unlit + vertex color shading | Cheapest |

All shaders authored in Shader Graph except `S_Outline` (HLSL handwritten for SRP performance).

## Camera Shake Profiles

Implemented via Cinemachine Impulse + a custom `CameraShaker` that wraps amplitude/duration into named profiles:

| Profile | Amplitude | Frequency | Duration |
|---|---|---|---|
| `Tiny` | 0.05 | 30 | 0.08 |
| `Small` | 0.1 | 22 | 0.15 |
| `Medium` | 0.2 | 18 | 0.25 |
| `Large` | 0.4 | 14 | 0.4 |
| `Crit` | 0.6 | 10 | 0.5 |
| `Boss` | 0.9 | 8 | 0.7 |

## Slow-Motion Specs

| Trigger | Scale | Duration |
|---|---|---|
| Player release | 0.6 | 0.2 |
| First bounce crit | 0.35 | 0.4 |
| Mid-air boost success | 0.55 | 0.2 |
| End-of-run settle | 0.4 | 0.5 |
| PB confirmed | 0.5 | 0.6 |

Cooldown 1.5 s between automatic slow-mos to avoid sluggishness.

## Haptics Map (iOS / Android)

| Event | iOS API | Android Equivalent |
|---|---|---|
| Drag start | `Selection` | Tick 10 ms |
| Release | `Impact Medium` | Vibrate 25 ms |
| Bounce small | `Impact Light` | Vibrate 10 ms |
| Bounce big | `Impact Heavy` | Vibrate 40 ms |
| Crit | `Notification Success` | Pattern 0/40/30/40 |
| Combo break | `Impact Soft` | Vibrate 12 ms |
| Crate open | `Success` | Pattern 0/15/15/15 |

Implemented via `Game.Input.HapticService` with platform-specific bridges.

## VFX Per Projectile Identity

Each projectile ships with:
- **Trail gradient** (color ramp tex)
- **Launch puff** (default vs special)
- **Impact burst** (3 intensities)
- **Ability VFX** (apple split, watermelon burst, etc.)
- **Death particles** (when projectile is consumed — apple's chunks etc.)

## Decals

Used sparingly:
- Scorch marks for explosive barrel detonation.
- Apple juice splats (visual coin bonus indicator).
- Plasma arcs on plasma pumpkin chain.

Lifetime 4 s, then despawn via pool.

## Performance Discipline

- All particle systems start *disabled* and `Pre-Warm = off`. Activated only on demand.
- VFX Graph for the 5 fanciest effects (BlackHoleEgg pull, PlasmaPumpkin chain, Crate Legendary). Everything else Shuriken.
- A custom `ParticleBudgetMonitor` script (Editor + runtime debug) shows the count and warns when near cap.

## Authoring Rules

- Time is sacred — bursts ≤ 0.6 s.
- Read silhouette first, then color.
- Always ship a "Reduced Motion" variant (single sprite frame fade-out).
- No "screen-fill" particles except on PB / Legendary crate.

## Testing

- Daily VFX regression scene cycles every effect in sequence with screenshots.
- Pixel-diff against approved baseline (50% threshold) flags regressions.
