# 03 — Technical Architecture

## 1. Engine & Stack

| Layer | Choice | Rationale |
|---|---|---|
| Engine | **Unity 6 (6000.x LTS)** | Best-in-class mobile pipeline, mature URP, Cinemachine 3, new Unity 6 GPU Resident Drawer. |
| Render Pipeline | URP, 2.5D | Hybrid: 2D physics + 3D sprites (sprite-mesh swap on impact for shard destruction). |
| Language | C# 11 (Unity 6 / .NET Standard 2.1) | Source generators for codegen, file-scoped namespaces. |
| Input | New Input System 1.7+ | Touch + future gamepad/keyboard. |
| Physics | Box2D (Unity built-in) | Deterministic with fixed step. |
| Cameras | Cinemachine 3 | Per-state virtual cameras, easy slow-mo. |
| Audio | Built-in + FMOD optional later | Mix bus + snapshots. |
| Asset Mgmt | Addressables 2.x | Remote content for live ops, no app updates needed. |
| Save | Encrypted JSON + Unity Cloud Save | Local-first, cloud merge on login. |
| Analytics | Unity Analytics + custom funnel SDK adapter | Vendor-swappable. |
| Ads | Unity LevelPlay (mediation) | Single SDK, multi-network. |
| IAP | Unity IAP + StoreKit 2 native bridge | Receipt validation server-side. |

## 2. Architectural Pattern: **Layered Services + Event Bus + DI**

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                          │
│  HUD, Menus, Tween Drivers, Camera Rigs                 │
├─────────────────────────────────────────────────────────┤
│                    GAMEPLAY                              │
│  RunController, Launcher, Projectile, Combo, World      │
├─────────────────────────────────────────────────────────┤
│                    SERVICES                              │
│  Audio  Economy  Progression  Save  Ads  Analytics      │
│  Pool   Localization  Notification  RemoteConfig  IAP   │
├─────────────────────────────────────────────────────────┤
│                    FOUNDATION                            │
│  ServiceLocator  EventBus  Coroutine Runner  Logger     │
└─────────────────────────────────────────────────────────┘
```

- **Composition root:** `Bootstrapper.cs` runs in scene `Boot.unity`, registers every service into `ServiceLocator`, hands off to `MetaSceneLoader`.
- **Cross-cutting comms:** All inter-system events flow via a strongly-typed `EventBus<T>` (no `SendMessage`, no Object.FindObjectOfType in hot paths).
- **Data:** All tunable game data lives in `ScriptableObject` assets under `Assets/_Project/ScriptableObjects/`. Designers tweak in editor; build inlines.

## 3. Assembly Definition Map

Splitting by `asmdef` cuts iteration time from ~12 s to <2 s. Hard rules:

| Assembly | References | Notes |
|---|---|---|
| `Game.Core` | — | Foundation, no UnityEngine bits beyond `MonoBehaviour` base. |
| `Game.Data` | Core | ScriptableObject definitions. |
| `Game.Pooling` | Core | Generic pool, can be reused outside game. |
| `Game.Physics` | Core, Data | Custom aero, collision helpers. |
| `Game.Gameplay` | Core, Data, Physics, Pooling, World, Combo | Run-time gameplay. |
| `Game.World` | Core, Data, Pooling | Biome streamer, obstacle prefabs scripts. |
| `Game.Combo` | Core, Data | Combo & multiplier rules. |
| `Game.Audio` | Core, Data | Audio director, mix snapshots. |
| `Game.VFX` | Core, Pooling | Juice driver, camera shake. |
| `Game.UI` | Core, Data, Progression, Economy | HUD, menus. |
| `Game.Economy` | Core, Data, Save | Currencies, shop. |
| `Game.Progression` | Core, Data, Economy, Save | Levels, prestige, BP. |
| `Game.Meta` | Core, Data, Progression, Economy | Missions, achievements. |
| `Game.Save` | Core, Data | Save/load, cloud sync. |
| `Game.Ads` | Core | Wrappers around LevelPlay. |
| `Game.Analytics` | Core | Funnel-friendly wrappers. |
| `Game.Input` | Core | Touch -> game intents. |
| `Game.Boot` | * | Bootstrapper only. |

## 4. Event Bus

```csharp
public static class EventBus<T> where T : struct
{
    private static readonly List<Action<T>> _subs = new();
    public static void Subscribe(Action<T> h) => _subs.Add(h);
    public static void Unsubscribe(Action<T> h) => _subs.Remove(h);
    public static void Publish(in T evt)
    {
        // Reverse iterate to allow unsubscribe during iteration.
        for (int i = _subs.Count - 1; i >= 0; i--) _subs[i](evt);
    }
}
```

Events are tiny `struct`s — zero GC. Examples: `LaunchReleased`, `BounceOccurred`, `ComboBroken`, `CrateOpened`. See `Scripts/Core/Events.cs`.

## 5. Service Locator (lightweight DI)

We don't pull in Zenject / VContainer for the MVP — a simple `ServiceLocator` keeps Unity-friendly stack traces and easy unit testing:

```csharp
public static class ServiceLocator
{
    private static readonly Dictionary<Type, object> _map = new();
    public static void Register<T>(T svc) => _map[typeof(T)] = svc!;
    public static T Get<T>() => (T)_map[typeof(T)];
    public static bool TryGet<T>(out T svc) {
        if (_map.TryGetValue(typeof(T), out var o)) { svc = (T)o; return true; }
        svc = default!;
        return false;
    }
    public static void Reset() => _map.Clear();
}
```

Tests substitute services with fakes before scene boot.

## 6. Scene Strategy

- `Boot.unity` — empty, has `Bootstrapper`. Loads next scene additively.
- `Meta.unity` — main menu, shop, missions. Persists between runs.
- `Run.unity` — run controller, launcher, HUD. Loaded additively, unloaded on exit.
- `Biome_*.unity` — biome chunks streamed via Addressables, parented under `BiomeStreamer`.

Single-scene-Boot keeps `DontDestroyOnLoad` only for services, never for `MonoBehaviour` UI.

## 7. Data Flow Example (Bounce → Combo → Coin Reward)

```
Projectile.OnCollisionEnter2D
  ↓ EventBus<BounceOccurred>.Publish
  ↓
ComboService.OnBounce  →  Increments combo, recomputes multiplier
  ↓ EventBus<ComboChanged>.Publish
  ↓
HUDView.OnComboChanged →  Tweens UI
EconomyService.OnComboChanged → Stores live multiplier
AudioDirector.OnComboChanged →  Picks music stem layer
  ↓
Projectile.OnLanded
  ↓ EventBus<RunEnded>.Publish
  ↓
EconomyService.OnRunEnded → coins = distance * multiplier * runBonus
  ↓ EventBus<CurrencyChanged>.Publish
HUDView.OnCurrencyChanged → animates counter
SaveService.OnCurrencyChanged → queues delta to disk
```

Note: every system reacts *independently* to events; no system calls another directly. This is why we can rip out & replace e.g. the audio system without touching gameplay.

## 8. Object Pooling

Every projectile, every shard, every coin pickup, every VFX **must** be pooled. The pool:

```csharp
public sealed class ObjectPool<T> where T : Component
{
    private readonly Stack<T> _stack = new();
    private readonly T _prefab;
    private readonly Transform _root;
    public ObjectPool(T prefab, int prewarm, Transform root) { /* ... */ }
    public T Get() => _stack.Count > 0 ? _stack.Pop() : Object.Instantiate(_prefab, _root);
    public void Return(T item) { item.gameObject.SetActive(false); _stack.Push(item); }
}
```

`PoolService` indexes pools by prefab ID so designers can drop a new VFX in editor and it's automatically pooled at first use.

## 9. Determinism Considerations

- Fixed timestep: **0.01667 s** (60 Hz).
- All physics queries via `Physics2D` simulation step (no manual rigidbody pokes from `Update`).
- Random seeded per run from server timestamp + device salt; stored in run replay header.

## 10. Saving & Cloud

- `SaveService.SaveAsync(SaveSlot slot)` → writes to `Application.persistentDataPath/save_v1.bin` (AES-GCM).
- Push to Unity Cloud Save every meta change, throttled at 1 req / 5 s.
- Conflict resolution: server timestamp + per-key merge for currencies (max), set-union for cosmetics, last-write for settings.

## 11. Remote Config

- All balance constants (combo step, multiplier cap, crate odds) loaded from Unity Remote Config at boot.
- Fallback to local `ScriptableObject` if offline.
- Live ops can A/B test multiplier formulas in 24 h.

## 12. Testing Strategy

| Layer | Tests | Tooling |
|---|---|---|
| Foundation | Pure C# unit tests | NUnit, no Unity dependency |
| Services | Integration with fake event bus | Unity Test Framework |
| Physics | Recorded run replay regression (golden frames) | Custom harness |
| UI | Snapshot tests on prefabs via the Editor batch mode | Unity Recorder |
| Smoke | Build-and-run on Firebase Test Lab | CI nightly |

## 13. CI/CD

GitHub Actions matrix:
- `validate.yml` — opens project, runs play-mode & edit-mode tests on macOS runner.
- `build-ios.yml` — Xcode 16, fastlane to TestFlight on `main`.
- `build-android.yml` — Gradle, signed APK to Play Console internal track.
- `lint.yml` — Roslyn analyzers + custom rules (no `FindObjectOfType` outside Boot).

## 14. Telemetry / Observability

- **Game funnel:** custom events into Unity Analytics.
- **Performance:** every 30 s while in `Run`, logs frame stats P50/P95.
- **Crashes:** Cloud Diagnostics + Sentry (with PII scrubbing).
- **Live ops dashboards:** Looker on the analytics warehouse.

## 15. Security

- Save files signed (HMAC) with per-device key derived from `SystemInfo.deviceUniqueIdentifier` + salt fetched from server.
- IAP receipts validated server-side via App Store / Play Developer APIs.
- Leaderboards: score submissions accompanied by run hash, server-side replay validation for top 1%.
