# Settings

Project-wide configuration assets. Created in Unity editor; key entries:

- `URP_Asset_Mobile.asset` — single Forward path, MSAA off, HDR off, shadow distance 25.
- `URP_Renderer_Mobile.asset` — opaque + transparent passes, no SSAO.
- `InputActions_Game.inputactions` — Touch + (future) Gamepad bindings.
- `AudioMixer_Master.mixer` — Master / Music / SFX / Ambience busses with named snapshots.
- `Volume_Backyard.asset` — Color grading + bloom (intensity 0.35) + vignette (0.2).
- `Volume_SlowMo.asset` — Desat -10%, bloom +0.05.

## Recommended ProjectSettings

| Setting | Value |
|---|---|
| Default Render Pipeline | URP_Asset_Mobile |
| Color Space | Linear |
| Auto Graphics API (Android) | OFF — only Vulkan + GLES3 |
| Auto Graphics API (iOS) | OFF — Metal only |
| Scripting Backend (mobile) | IL2CPP |
| Api Compatibility Level | .NET Standard 2.1 |
| Managed Stripping Level | High |
| Use incremental GC | ON |
| Default orientation | Portrait |
| MSAA | Disabled |
| Static + Dynamic Batching | ON |
| GPU Skinning | ON |
| Multithreaded Rendering | ON |
| Splash | Custom 1s logo, no Unity splash (paid plan) |

## Physics2D Tunings

| Setting | Value |
|---|---|
| Gravity | (0, -25) |
| Default Material | Mat_Default |
| Velocity Iterations | 12 |
| Position Iterations | 4 |
| Velocity Threshold | 0.5 |
| Max Linear Correction | 0.2 |
| Auto Sync Transforms | OFF |
| Queries Hit Triggers | ON |
| Sleep Mode | Start Awake |
| Layer Collision Matrix | committed (see docs/06-physics-setup.md) |
