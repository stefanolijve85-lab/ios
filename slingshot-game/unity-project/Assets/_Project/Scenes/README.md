# Scenes

3 core scenes + N biome scenes (additive). Create in editor as `.unity` files.

## Boot.unity

```
Boot (empty scene)
└── Bootstrapper (GameObject)
    ├── Bootstrapper.cs           ← single MonoBehaviour
    └── Inspector references:
        - Tuning   = GameTuning.asset
        - UpgradeTracks = [Upgrade_Power.asset, …]
        - MissionCatalog = [Mission_Daily_*.asset, …]
        - ActiveSeason = BP_Season_S1.asset
        - FirstScene = "Meta"
```

## Meta.unity

```
Meta
├── MainCamera (Cinemachine Brain)
│   └── CM_MetaMenu (Cinemachine virtual cam)
├── UIRoot (Canvas, Screen Space - Overlay)
│   ├── MainMenuView   (script: MainMenuView)
│   ├── ShopView       (disabled, script: ShopView)
│   ├── MissionsView
│   ├── UpgradeView
│   ├── BattlePassView
│   └── PopupLayer
├── HubScene (rotating slingshot vignette)
└── Lighting + Audio
```

## Run.unity

```
Run
├── BiomeStreamer (script: BiomeStreamer; biome = current; tracks Projectile)
├── Parallax (5 quads)
├── Launcher (prefab: Launcher_Wooden_Rig — has Launcher.cs)
├── ProjectileRoot (empty parent for pooled projectiles)
├── Cameras (Cinemachine: CM_Aim / CM_Flight / CM_SlowMo / CM_EndRun)
├── HUDRoot (Canvas)
│   ├── HUDView
│   ├── EndRunView (disabled by default)
│   └── PauseMenu
├── VFX
│   ├── ScreenShake (CinemachineImpulseSource + CameraShaker)
│   ├── HitFlashLayer (Image overlay + JuiceController)
│   └── PostProcessVolume
├── Audio
│   ├── AudioDirector (+ DynamicMusic + SfxPlayer)
└── Logic
    └── RunController.cs
```

Add scenes to `EditorBuildSettings.asset` in this order:
1. Boot
2. Meta
3. Run
4. Biome_Backyard
5. Biome_Farm
6. ...

The first scene Unity loads is Boot.
