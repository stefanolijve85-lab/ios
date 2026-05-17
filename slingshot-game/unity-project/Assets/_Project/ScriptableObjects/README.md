# ScriptableObject Assets

Designer-authored content lives here. Unity converts these to `.asset` files when opened (auto-generates the YAML).
Use the **Create → Game → Data** menu in the editor — each `ScriptableObject` exposes a `CreateAssetMenu` attribute.

Suggested layout (created by the Unity editor on first open):

```
ScriptableObjects/
├── Projectiles/
│   ├── Projectile_TennisBall.asset
│   ├── Projectile_Apple.asset
│   ├── Projectile_Bowling.asset
│   ├── Projectile_Watermelon.asset
│   └── ...
├── Launchers/
│   ├── Launcher_Wooden.asset
│   ├── Launcher_Mechanical.asset
│   └── ...
├── Biomes/
│   ├── Biome_Backyard.asset
│   ├── Biome_Farm.asset
│   └── ...
├── Upgrades/
│   ├── Upgrade_Power.asset
│   ├── Upgrade_Bounce.asset
│   └── ...
├── Missions/
│   ├── Mission_Daily_Distance_3k.asset
│   └── ...
├── Crates/
│   ├── Crate_Common.asset
│   ├── Crate_Rare.asset
│   └── ...
├── BattlePass/
│   └── BP_Season_S1.asset
└── Tuning/
    └── GameTuning.asset    ← assigned to Bootstrapper.Tuning
```

## Example: Projectile_TennisBall.asset (data shape)

When this asset is created in the editor, Unity serializes it to YAML:

```yaml
%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_Script: {fileID: 11500000, guid: <Projectile_GUID>, type: 3}
  Id: tennis_ball
  DisplayName: "Tennis Ball"
  Tier: 0          # Common
  Family: 1        # Sport
  Mass: 0.06
  Bounciness: 0.85
  Friction: 0.45
  DragCoefficient: 0.42
  CrossSectionArea: 0.05
  AbilityId: ""
  RequiredPlayerLevel: 1
  UnlockedByDefault: 1
```

## Example: Crate_Common.asset (data shape)

```yaml
Id: crate_common
DisplayName: "Common Crate"
Rarity: 0
RollsPerOpen: 5
Drops:
  - {Id: coin_small,  Weight: 0.6,  Rarity: 0, CoinAmount: 50,  GemAmount: 0}
  - {Id: coin_medium, Weight: 0.18, Rarity: 0, CoinAmount: 150, GemAmount: 0}
  - {Id: skin_common, Weight: 0.17, Rarity: 0}
  - {Id: skin_rare,   Weight: 0.04, Rarity: 1}
  - {Id: skin_epic,   Weight: 0.009, Rarity: 2}
  - {Id: skin_legend, Weight: 0.001, Rarity: 3}
GuaranteedFloorRarity: 0
GuaranteedFloorRollIndex: 0
```
