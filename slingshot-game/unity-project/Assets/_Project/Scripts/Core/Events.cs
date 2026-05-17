using UnityEngine;

namespace Game.Core
{
    // ---- LIFECYCLE ----
    public readonly struct GameBooted { }
    public readonly struct MetaSceneReady { }
    public readonly struct RunSceneReady { }

    // ---- RUN LIFECYCLE ----
    public readonly struct RunStarted { public readonly string ProjectileId; public readonly string LauncherId; public readonly string BiomeId; public RunStarted(string p, string l, string b) { ProjectileId = p; LauncherId = l; BiomeId = b; } }
    public readonly struct RunEnded   { public readonly float Distance; public readonly int Coins; public readonly int PeakCombo; public readonly float DurationSeconds; public RunEnded(float d, int c, int peak, float dur) { Distance = d; Coins = c; PeakCombo = peak; DurationSeconds = dur; } }

    // ---- LAUNCHER ----
    public readonly struct LaunchAiming        { public readonly Vector2 DragVector; public LaunchAiming(Vector2 d) { DragVector = d; } }
    public readonly struct LaunchReleased      { public readonly Vector2 Impulse; public readonly float ChargeRatio; public LaunchReleased(Vector2 i, float r) { Impulse = i; ChargeRatio = r; } }
    public readonly struct LaunchCanceled      { }

    // ---- PROJECTILE ----
    public readonly struct BounceOccurred      { public readonly Vector2 Point; public readonly float Force; public readonly string ProjectileId; public readonly string SurfaceId; public BounceOccurred(Vector2 p, float f, string proj, string surf) { Point = p; Force = f; ProjectileId = proj; SurfaceId = surf; } }
    public readonly struct BoostTriggered      { public readonly Vector2 Direction; public readonly float Power; public BoostTriggered(Vector2 d, float p) { Direction = d; Power = p; } }
    public readonly struct AbilityUsed         { public readonly string AbilityId; public AbilityUsed(string id) { AbilityId = id; } }
    public readonly struct CriticalHit         { public readonly Vector2 Point; public CriticalHit(Vector2 p) { Point = p; } }
    public readonly struct ProjectileSettled   { public readonly Vector2 RestingPosition; public ProjectileSettled(Vector2 p) { RestingPosition = p; } }

    // ---- COMBO ----
    public readonly struct ComboChanged        { public readonly int Combo; public readonly float Multiplier; public ComboChanged(int c, float m) { Combo = c; Multiplier = m; } }
    public readonly struct ComboBroken         { public readonly int FinalCombo; public readonly float FinalMultiplier; public ComboBroken(int c, float m) { FinalCombo = c; FinalMultiplier = m; } }

    // ---- COLLECTIBLES ----
    public readonly struct CoinCollected       { public readonly int Amount; public readonly Vector2 WorldPosition; public CoinCollected(int a, Vector2 p) { Amount = a; WorldPosition = p; } }
    public readonly struct RingPassed          { public readonly int RingId; public RingPassed(int id) { RingId = id; } }
    public readonly struct ObstacleDestroyed   { public readonly string ObstacleId; public readonly int CoinReward; public ObstacleDestroyed(string id, int c) { ObstacleId = id; CoinReward = c; } }

    // ---- ECONOMY ----
    public readonly struct CurrencyChanged     { public readonly Currency Currency; public readonly long NewAmount; public readonly long Delta; public CurrencyChanged(Currency c, long now, long d) { Currency = c; NewAmount = now; Delta = d; } }
    public readonly struct CrateOpened         { public readonly string CrateId; public readonly bool WasDuplicate; public CrateOpened(string id, bool dup) { CrateId = id; WasDuplicate = dup; } }

    // ---- PROGRESSION ----
    public readonly struct XpGained            { public readonly int Amount; public readonly string Source; public XpGained(int a, string s) { Amount = a; Source = s; } }
    public readonly struct LeveledUp           { public readonly int NewLevel; public LeveledUp(int l) { NewLevel = l; } }
    public readonly struct PrestigeTriggered   { public readonly int PrestigeCount; public PrestigeTriggered(int p) { PrestigeCount = p; } }
    public readonly struct UpgradePurchased    { public readonly string Branch; public readonly int Tier; public UpgradePurchased(string b, int t) { Branch = b; Tier = t; } }

    // ---- META ----
    public readonly struct MissionCompleted    { public readonly string MissionId; public MissionCompleted(string id) { MissionId = id; } }
    public readonly struct AchievementUnlocked { public readonly string AchievementId; public AchievementUnlocked(string id) { AchievementId = id; } }
    public readonly struct DailyRewardClaimed  { public readonly int DayInCycle; public DailyRewardClaimed(int d) { DayInCycle = d; } }

    // ---- CAMERA / FX ----
    public enum CameraState { Aim, Flight, SlowMo, EndRun, Menu }
    public readonly struct CameraStateChanged  { public readonly CameraState State; public CameraStateChanged(CameraState s) { State = s; } }
    public readonly struct ShakeRequested      { public readonly string ProfileId; public ShakeRequested(string id) { ProfileId = id; } }
    public readonly struct SlowMoRequested     { public readonly float Scale; public readonly float Duration; public SlowMoRequested(float s, float d) { Scale = s; Duration = d; } }

    // ---- ADS / IAP ----
    public readonly struct AdRequested         { public readonly string Placement; public AdRequested(string p) { Placement = p; } }
    public readonly struct AdShownCompleted    { public readonly string Placement; public readonly bool Rewarded; public AdShownCompleted(string p, bool r) { Placement = p; Rewarded = r; } }
    public readonly struct IapPurchased        { public readonly string ProductId; public readonly bool Verified; public IapPurchased(string id, bool v) { ProductId = id; Verified = v; } }

    public enum Currency { Coins, Gems, Bolts }
}
