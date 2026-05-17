# 06 — Physics Setup

## 1. Physics World

| Setting | Value | Why |
|---|---|---|
| Physics engine | Box2D (Unity 2D) | Fast, deterministic, well-tested. |
| Gravity | `(0, -25)` | Snappier than real-world 9.81; tuned for game feel. |
| Fixed Timestep | `0.01667` (60 Hz) | Deterministic across devices. |
| Max Fixed Timesteps | 4 | Prevents spiral of death without stretching slow-mo. |
| Velocity Iterations | 12 | Stable stacked obstacles. |
| Position Iterations | 4 | Default; sufficient. |
| Velocity Threshold | `0.5` | Below this, treated as resting (used by sleep + settle). |
| Default Material | `PhysicsMat_Default` | Friction 0.4, bounciness 0.0. |
| Auto Sync Transforms | Off | We do explicit sync where needed. |
| Queries Hit Triggers | On | Ring/pickup detection uses triggers. |
| Sleep Mode | Start Awake | Avoid first-frame jitter. |

## 2. Layers & Collision Matrix

| Layer | Mask | Notes |
|---|---|---|
| 0 `Default` | — | Empty per convention. |
| 8 `Projectile` | collides with: `Obstacle`, `Ground`, `Boost`, `Ring`, `Coin`, `Boss` | Player launchable. |
| 9 `Ground` | `Projectile` | Static ground per chunk. |
| 10 `Obstacle` | `Projectile`, `Obstacle` (limited) | Destructibles. |
| 11 `Boost` | `Projectile` | Trigger-only. |
| 12 `Ring` | `Projectile` | Trigger-only. |
| 13 `Coin` | `Projectile` | Trigger-only. |
| 14 `Boss` | `Projectile` | Bigger HP, custom hit script. |
| 15 `Decoration` | none | Visual only. |
| 16 `Shard` | `Ground`, `Shard` | Debris, no projectile collision. |

Matrix is locked via `Physics2DSettings.asset` (committed to repo) and verified by a build-time validator.

## 3. Materials (PhysicsMaterial2D)

| Material | Friction | Bounciness | Used by |
|---|---|---|---|
| `Mat_Default` | 0.4 | 0.0 | Generic obstacles |
| `Mat_Ground_Grass` | 0.6 | 0.1 | Backyard, Farm |
| `Mat_Ground_Ice` | 0.05 | 0.3 | Snow mountains |
| `Mat_Ground_Sand` | 0.8 | 0.0 | Desert |
| `Mat_Trampoline` | 0.1 | 1.4 | Boost pads (capped at 1.4 to avoid runaway) |
| `Mat_Rubber` | 0.5 | 0.95 | Giant rubber duck |
| `Mat_Metal` | 0.2 | 0.55 | Bowling ball, metal cube |

## 4. Projectile Body Setup

A projectile prefab has:

| Component | Notes |
|---|---|
| `Rigidbody2D` | Body Type = Dynamic, Mass per ScriptableObject, Linear Drag set by `AeroBody`, Angular Drag 0.05, Collision Detection **Continuous** (avoids tunneling at high speed). |
| `CircleCollider2D` or `PolygonCollider2D` | Per shape, Material per object. |
| `AeroBody` | Custom — applies drag scaled by speed, plus magnus effect (visual spin). |
| `Projectile` | Lifecycle, ability dispatch, event publishing. |
| `TrailRenderer` | Pooled, gradient per skin. |
| `AudioSource` (pooled) | Roll loop, pitch-scaled by velocity. |

## 5. Aerodynamic Drag (Custom)

Linear drag in Box2D is unrealistic at high speed (linear in v, real air is quadratic). We override:

```csharp
// In AeroBody.FixedUpdate()
Vector2 v = _rb.linearVelocity;
float speed = v.magnitude;
if (speed < 0.01f) return;
float dragMag = 0.5f * _def.dragCoefficient * speed * speed * _def.crossSectionArea;
Vector2 dragForce = -v.normalized * dragMag;
_rb.AddForce(dragForce, ForceMode2D.Force);
```

Where `dragCoefficient` and `crossSectionArea` come from the ProjectileDefinition.

## 6. Launch Impulse

```csharp
Vector2 launchVector = -DragDelta;  // pull back, launch forward
float magnitude = Mathf.Clamp(launchVector.magnitude, 0, _maxDrag);
float power = _launcher.PowerCoefficient * _upgrades.PowerMultiplier;
Vector2 impulse = launchVector.normalized * EaseOutQuad(magnitude / _maxDrag) * _baseImpulse * power;
_rb.AddForce(impulse, ForceMode2D.Impulse);
```

`EaseOutQuad` makes small pulls feel responsive; long pulls saturate (no infinite scaling).

## 7. Bounce Coefficient Interaction

Effective bounciness = `combine(projectile.material.bounciness, surface.material.bounciness)` using Unity's `Multiply` mode for predictability. Boost pads override via `BounceSurface.OverrideBounciness = 1.4`.

## 8. Slow Motion

`SlowMotionService.Trigger(duration: 0.4f, scale: 0.35f)`:

```csharp
Time.timeScale = scale;
Time.fixedDeltaTime = 0.01667f * scale;
yield return new WaitForSecondsRealtime(duration);
Time.timeScale = 1f;
Time.fixedDeltaTime = 0.01667f;
```

`AudioSource.pitch` matched 1:1 for diegetic clips, 1.0 for music (we use `unscaledTime` for music tempo).

## 9. Boost Pads

Trigger collider in `Boost` layer; on `OnTriggerEnter2D`:
- Compute impulse along pad normal (Vector2 derived from pad rotation).
- Scale by projectile mass for visual consistency.
- Publish `BoostHit` event.
- Apply force (`ForceMode2D.Impulse`).
- Trigger camera shake + VFX.

Pads can be **directional** (custom angle) or **omni** (radial bounce always upward).

## 10. Destruction

Obstacles have HP. Each collision:
- Damage = `0.5 * mass * relativeVelocity.sqrMagnitude * destructionMultiplier`.
- If HP ≤ 0 → spawn shard prefab via pool, hide original collider, play SFX, drop coins.

Shards are physical rigidbodies on layer `Shard`, with auto-despawn at 4 s lifetime or off-screen.

## 11. Wind Zones

`WindZone2D` component attached to a trigger:

```csharp
void OnTriggerStay2D(Collider2D other) {
    if (other.attachedRigidbody is not Rigidbody2D rb) return;
    rb.AddForce(_force, ForceMode2D.Force);
}
```

Wind force is biome-defined (e.g., Desert thermals = `(0, 12)`, City wind tunnel = `(40, 0)`).

## 12. Gravity Zones (Sci-Fi / Space)

Override gravity locally with a `GravityZone` component:

```csharp
void OnTriggerEnter2D(Collider2D c) {
    if (c.TryGetComponent(out Rigidbody2D rb)) rb.gravityScale = _zoneGravity;
}
void OnTriggerExit2D(Collider2D c) {
    if (c.TryGetComponent(out Rigidbody2D rb)) rb.gravityScale = 1f;
}
```

Space biome sets `Physics2D.gravity` per-scene to `(0,-6)` and uses very wide chunks for momentum-based gameplay.

## 13. Stability & QA

- Manual stress test: 500 launches with random projectiles, verify zero NaN positions and ≤ 0.1 ms physics step at 95th percentile.
- Determinism test: same seed + recorded inputs produce identical end distance to 0.001 m across iOS + Android builds.
- Soak test: 30-minute run with auto-launcher script; memory growth < 5 MB.
