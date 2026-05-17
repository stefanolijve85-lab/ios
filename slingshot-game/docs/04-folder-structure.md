# 04 — Folder Structure

The project uses the `_Project/` pattern: everything we own lives under one root folder so it's never mixed with third-party packages.

```
unity-project/
├── Assets/
│   ├── _Project/
│   │   ├── Art/
│   │   │   ├── Characters/        # Projectile rigs & textures
│   │   │   ├── Environments/      # Biome chunks, parallax layers
│   │   │   ├── Materials/
│   │   │   ├── Shaders/           # Custom URP shaders (rim, dissolve, hit-flash)
│   │   │   ├── Sprites/
│   │   │   ├── UI/                # UI atlas, icons, fonts
│   │   │   └── VFX/               # Particle textures, trail gradients
│   │   ├── Audio/
│   │   │   ├── Music/             # Per-biome stems
│   │   │   ├── SFX/
│   │   │   │   ├── Launcher/
│   │   │   │   ├── Projectile/
│   │   │   │   ├── Impact/
│   │   │   │   ├── UI/
│   │   │   │   └── World/
│   │   │   └── Mixers/
│   │   ├── Prefabs/
│   │   │   ├── Boot/
│   │   │   ├── Projectiles/
│   │   │   ├── Launchers/
│   │   │   ├── World/
│   │   │   │   ├── Obstacles/
│   │   │   │   └── BiomeChunks/
│   │   │   ├── UI/
│   │   │   ├── VFX/
│   │   │   └── Pooled/            # Coins, shards, popups
│   │   ├── Scenes/
│   │   │   ├── Boot.unity
│   │   │   ├── Meta.unity
│   │   │   ├── Run.unity
│   │   │   └── Biomes/
│   │   │       ├── Backyard.unity
│   │   │       ├── Farm.unity
│   │   │       └── ...
│   │   ├── ScriptableObjects/
│   │   │   ├── Projectiles/        # ProjectileDefinition assets
│   │   │   ├── Launchers/          # LauncherDefinition assets
│   │   │   ├── Biomes/             # BiomeDefinition assets
│   │   │   ├── Upgrades/           # UpgradeTrackDefinition
│   │   │   ├── Missions/
│   │   │   ├── Crates/
│   │   │   ├── BattlePass/
│   │   │   └── Tuning/             # Global GameTuning SO
│   │   ├── Scripts/                 # mirrors asmdef layout (see below)
│   │   ├── Settings/                # URP Asset, Input Actions, Cinemachine settings
│   │   └── Editor/                  # Custom inspectors, build tooling, validators
│   └── ThirdParty/                  # Imported store packages (DOTween, etc.)
├── Packages/
│   ├── manifest.json
│   └── packages-lock.json
└── ProjectSettings/
    ├── ProjectSettings.asset
    ├── EditorBuildSettings.asset
    ├── DynamicsManager.asset
    ├── Physics2DSettings.asset
    └── ...
```

## Script Layout (`Assets/_Project/Scripts/`)

Each top-level folder is an assembly definition.

```
Scripts/
├── Core/                # Game.Core.asmdef
│   ├── Events.cs
│   ├── EventBus.cs
│   ├── ServiceLocator.cs
│   ├── CoroutineRunner.cs
│   ├── Logger.cs
│   └── Maths/EaseCurves.cs
├── Boot/                # Game.Boot.asmdef
│   └── Bootstrapper.cs
├── Data/                # Game.Data.asmdef
│   ├── ProjectileDefinition.cs
│   ├── LauncherDefinition.cs
│   ├── BiomeDefinition.cs
│   ├── UpgradeTrackDefinition.cs
│   ├── MissionDefinition.cs
│   ├── CrateDefinition.cs
│   ├── BattlePassSeason.cs
│   └── GameTuning.cs
├── Pooling/             # Game.Pooling.asmdef
│   ├── ObjectPool.cs
│   └── PoolService.cs
├── Physics/             # Game.Physics.asmdef
│   ├── AeroBody.cs
│   ├── BounceSurface.cs
│   └── SlowMotionService.cs
├── Gameplay/            # Game.Gameplay.asmdef
│   ├── RunController.cs
│   ├── Launcher.cs
│   ├── Projectile.cs
│   ├── DragAim.cs
│   └── BoostTapWindow.cs
├── Combo/               # Game.Combo.asmdef
│   ├── ComboService.cs
│   └── MultiplierLadder.cs
├── World/               # Game.World.asmdef
│   ├── BiomeStreamer.cs
│   ├── BiomeChunk.cs
│   └── Obstacles/
│       ├── DestructibleObstacle.cs
│       ├── BoostPad.cs
│       └── Ring.cs
├── Audio/               # Game.Audio.asmdef
│   ├── AudioDirector.cs
│   └── DynamicMusic.cs
├── VFX/                 # Game.VFX.asmdef
│   ├── JuiceController.cs
│   ├── CameraShaker.cs
│   └── HitFlash.cs
├── UI/                  # Game.UI.asmdef
│   ├── HUDView.cs
│   ├── MainMenuView.cs
│   ├── ShopView.cs
│   ├── EndRunView.cs
│   └── Tweens/UITween.cs
├── Economy/             # Game.Economy.asmdef
│   ├── CurrencyService.cs
│   ├── ShopService.cs
│   └── CrateService.cs
├── Progression/         # Game.Progression.asmdef
│   ├── ProgressionService.cs
│   ├── UpgradeService.cs
│   ├── PrestigeService.cs
│   └── BattlePassService.cs
├── Meta/                # Game.Meta.asmdef
│   ├── MissionService.cs
│   ├── AchievementService.cs
│   └── DailyRewardService.cs
├── Save/                # Game.Save.asmdef
│   ├── SaveService.cs
│   ├── SaveData.cs
│   └── CloudSync.cs
├── Input/               # Game.Input.asmdef
│   ├── TouchInput.cs
│   └── HapticService.cs
├── Analytics/           # Game.Analytics.asmdef
│   └── AnalyticsService.cs
└── Ads/                 # Game.Ads.asmdef
    └── AdService.cs
```

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Folders | `PascalCase` | `Projectiles/` |
| Scripts | `PascalCase.cs`, one type per file | `RunController.cs` |
| Prefabs | `PascalCase` + role suffix | `Apple_Projectile.prefab` |
| Scenes | `PascalCase` | `Run.unity` |
| ScriptableObjects | `Type_Identifier` | `Projectile_TennisBall.asset` |
| Materials | `Mat_*` | `Mat_Apple.mat` |
| Textures | `Tex_*` | `Tex_Apple_BC.png` (BC = base color) |
| Audio clips | `SFX_*` / `MUS_*` | `SFX_Launcher_Release_01.wav` |
| Animations | `Anim_<Subject>_<Action>` | `Anim_Slingshot_Release.anim` |

## Folder Rules

1. **Never** put scripts in `Art/`, `Audio/`, or `Prefabs/`. Code lives only in `Scripts/`.
2. Third-party tooling goes in `Assets/ThirdParty/`. Modify only forks, never originals.
3. ScriptableObject categories mirror the script `Data/` folder for discoverability.
4. Editor-only code lives in `Editor/` under each asmdef where appropriate.

## Validation

A custom editor script (`Assets/_Project/Editor/Validators/FolderValidator.cs`) runs on `OnPostprocessAllAssets` and fails the import if anything violates the structure. Designers see an actionable error popup.
