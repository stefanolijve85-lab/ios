# Prefabs

Author the following prefabs (created in Unity editor) to back the scripted systems:

## Projectiles (one per ProjectileDefinition)
**`Projectile_TennisBall.prefab`**
- Components: `Rigidbody2D` (mass 0.06, Continuous), `CircleCollider2D` (PhysicsMaterial2D = Mat_Default),
  `AeroBody`, `Projectile`, `SpriteRenderer`, `TrailRenderer`, `AudioSource` (roll loop), `HitFlash`.
- Layer: `Projectile`.

## Launchers (one per LauncherDefinition)
**`Launcher_Wooden_Rig.prefab`**
- Hierarchy:
  ```
  Launcher_Wooden_Rig
  ├── Frame_SpriteRenderer
  ├── BandLeft  (animated via Animator, shader VertexBend)
  ├── BandRight
  ├── BandCenter
  └── SpawnPoint (empty Transform)
  ```
- Components on root: `Launcher` (with refs to BandAnchorLeft/Right, BandCenter, GameTuning, defaults).

## Obstacles
**`Obstacle_HayBale.prefab`** — DestructibleObstacle, HP 80, _coinDropOnDestroy 15.
**`Obstacle_BoostPad.prefab`** — `BoostPad`, trigger collider, particle child.
**`Obstacle_Ring.prefab`** — `Ring`, trigger collider, rotating Sprite.
**`Obstacle_Crit.prefab`** — `BounceSurface` with _isCrit = true.

## Pooled
**`Pooled_CoinPickup.prefab`** — sprite + collider + audio.
**`Pooled_Shard.prefab`** — Rigidbody2D, ~6 variants of same prefab in destruction list.
**`Pooled_DamageNumber.prefab`** — UI text popup.

## VFX
**`VFX_LaunchPuff.prefab`** — ParticleSystem (burst 30, lifetime 0.4s, billboard).
**`VFX_BoostShockwave.prefab`** — ParticleSystem + decal.
**`VFX_CritFlash.prefab`** — full-screen UI image flash (used by JuiceController).

## UI
**`UI_OfferRow.prefab`** — used by ShopView for the offer list.

## Boot
**`Bootstrapper_Container.prefab`** — wraps the GameObject for Boot.unity.

## Naming reminder
`<Subject>_<Role>.prefab` — never embed scene names, never abbreviate.
