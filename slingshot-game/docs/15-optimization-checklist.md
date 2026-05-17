# 15 — Optimization Checklist

## Target Device Matrix

| Tier | Device | Target FPS | Min RAM | Notes |
|---|---|---|---|---|
| Low | Galaxy A14, iPhone 8 | 30 | 2 GB | Reduced VFX, no post-FX bloom. |
| Mid | Pixel 6a, iPhone 11, Galaxy A54 | 60 | 4 GB | Baseline experience. |
| High | iPhone 15, S24, Pixel 8 | 60 (locked) | 6 GB | Full juice. |

## Frame Budget (Mid-Tier, 16.67 ms / frame)

| System | Budget |
|---|---|
| Scripts (CPU) | 4.5 ms |
| Physics 2D | 1.5 ms |
| Animation | 0.8 ms |
| Particles | 1.5 ms |
| Rendering (CPU) | 3.0 ms |
| GPU (rendering) | 5.0 ms |
| Slack | 0.4 ms |

## Memory Budget (Mid-Tier)

| Bucket | Budget (MB) |
|---|---|
| Code (mono / il2cpp) | 60 |
| Managed heap | 80 |
| Textures resident | 220 |
| Meshes | 60 |
| Audio | 40 |
| Other (Unity, scratch) | 80 |
| **Total RSS target** | **≤ 540 MB** |

## CPU Checklist

- [ ] No `GameObject.Find*`, `FindObjectsOfType` outside Bootstrapper.
- [ ] No allocations per frame (`new List`, boxing, lambdas in `Update`). Validate with Memory Profiler.
- [ ] String formatting via `StringBuilder` for UI counters; cache labels.
- [ ] `Update` only where needed; prefer event-driven.
- [ ] LINQ banned in hot paths; use `for`/`Span<T>`.
- [ ] Reuse `WaitForSeconds` instances or use UniTask.
- [ ] No reflection at runtime past Bootstrapper.
- [ ] All `MonoBehaviour`s subscribe in `OnEnable`, unsubscribe in `OnDisable`.
- [ ] FixedUpdate not used unless physics-related.

## Rendering Checklist

- [ ] URP, single-pass forward.
- [ ] **SRP Batcher**: every material uses compatible shaders. Confirmed via Frame Debugger.
- [ ] **GPU Instancing** on Particle materials.
- [ ] **MSAA off** (use sprite outline shader instead).
- [ ] **HDR off** for mid-tier; on for high-tier.
- [ ] Bloom restricted to URP volume profile, intensity ≤ 0.35.
- [ ] Vignette + grading via single Volume per scene.
- [ ] Atlas everything UI; 2048² max.
- [ ] Sprite Atlas variants disabled.
- [ ] Light probes only; no realtime shadows on mobile.

## Physics Checklist

- [ ] Fixed timestep 1/60; Max Allowed Timestep 1/15.
- [ ] Collision matrix audited; no needless interactions.
- [ ] Use `Rigidbody2D.Sleeping`; explicit `Sleep()` for off-screen pickups.
- [ ] Trigger colliders for pickups, not solid colliders (cheaper).
- [ ] No `OnCollision*` allocations (use `Collision2D` cached pool).
- [ ] Auto Sync Transforms OFF.
- [ ] All projectile colliders Continuous (avoid tunneling); everything else Discrete.

## Memory Checklist

- [ ] Textures: Mipmaps on, BC7 or ASTC, max size 1024² except hero UI assets.
- [ ] Audio: ADPCM / Vorbis q5, Load Type = Compressed in Memory for SFX, Streaming for music.
- [ ] Meshes: Read/Write OFF, no normals where Unlit.
- [ ] No retained textures (use Addressables release).
- [ ] Object pool sizes audited per scene; max projectiles in flight = 1 plus 3 shards each = ≤ 16 active rigidbodies typical.
- [ ] GC.Alloc per frame ≤ 0 in steady-state Run scene.

## Addressables Hygiene

- [ ] Groups named by usage frequency (`always-loaded`, `per-biome`, `cosmetics-on-demand`).
- [ ] LZ4 compression.
- [ ] Catalog hosted on CDN; static catalog mode for first-launch reliability.
- [ ] Asset bundles ≤ 8 MB.
- [ ] Background download for non-essential cosmetics.

## Battery / Thermals

- [ ] `Application.targetFrameRate = 60` (or 30 on low-tier). Never `-1`.
- [ ] `QualitySettings.vSyncCount = 0` (rely on targetFrameRate).
- [ ] On UI screens, drop frame rate to 30 to save battery (`UIBatterySaver` script).
- [ ] Pause game and drop to 1 fps when backgrounded.
- [ ] Disable any unused sensors (motion, location).

## Build Size

- [ ] **iOS** target: ≤ 80 MB IPA, ≤ 150 MB on-device.
- [ ] **Android** AAB target: ≤ 60 MB base.
- [ ] Strip engine code aggressively (`Managed Stripping Level = High`).
- [ ] Use `link.xml` to preserve only required types.
- [ ] No dev symbols in release.
- [ ] Architectures: ARM64 only (iOS), ARM64 + ARMv7 (Android base).

## Startup Time

- [ ] Splash: 1 s static logo, no animation.
- [ ] `Boot` scene loads in < 300 ms.
- [ ] First Meta screen visible in < 2 s on iPhone 12.
- [ ] Disable Cinemachine in Boot.
- [ ] Defer non-critical service init until first idle frame.

## Profiler Cadence

| Cadence | Profiler | Owner |
|---|---|---|
| Daily | Frame Debugger snapshots per scene | Tech Artist |
| Weekly | Memory Profiler diff | Engineer |
| Per PR | CI runs profiling capture on Pixel 6a | CI |
| Pre-release | 8-hour soak test, thermal log | QA |

## Performance Test Scenes

- `Perf_StressLaunch.unity`: 30-second auto-launcher script, asserts P95 frame time ≤ 16.6 ms.
- `Perf_ParticleStorm.unity`: triggers every VFX simultaneously, ensures particle cap.
- `Perf_BigBoss.unity`: boss boss boss boss boss VS projectile to verify mid-fight FPS.

## Common Pitfalls (Caught By CI)

- Material that breaks SRP Batcher because of `_TimeOffset` per-instance property.
- Coroutine that allocates a new `WaitForSeconds` every frame.
- Texture re-imported with mipmaps off.
- `Camera.main` called every frame (cached as `_cam` field).
