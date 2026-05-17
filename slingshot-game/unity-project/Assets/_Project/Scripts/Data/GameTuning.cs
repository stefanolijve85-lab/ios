using UnityEngine;

namespace Game.Data
{
    /// <summary>
    /// Single source of truth for all live-tunable global constants. Loaded into ServiceLocator at boot.
    /// Mirrored in Remote Config so live ops can patch without an app update.
    /// </summary>
    [CreateAssetMenu(menuName = "Game/Data/Game Tuning", fileName = "GameTuning")]
    public sealed class GameTuning : ScriptableObject
    {
        [Header("Launch")]
        public float BaseImpulse = 18f;
        public float MaxDragMagnitude = 4.5f;
        public float AimVisualizationRatio = 0.25f;  // how much of trajectory to show

        [Header("Combo")]
        public int ComboStep = 4;            // m += 0.5 each `ComboStep` combo
        public float MultiplierStep = 0.5f;
        public float MultiplierCap = 10f;
        public float ComboDecaySeconds = 3.0f;

        [Header("Boost")]
        public float BoostWindowSeconds = 0.25f;
        public float BoostPowerMultiplier = 1.25f;
        public int BoostComboGain = 1;

        [Header("Scoring & Economy")]
        public float CoinsPerScoreUnit = 0.08f;
        public float PrestigeMultiplierPerLevel = 0.05f;
        public float PrestigeMultiplierMax = 5.0f;
        public float BonusZoneCoinFactor = 0.5f;

        [Header("Difficulty")]
        public float PhaseLengthMeters = 250f;
        public float BaseObstacleDensity = 1f;
        public float DensityIncreasePerPhase = 0.18f;
        public float DensityCap = 3f;
        public float BaseHazardChance = 0.02f;
        public float HazardChanceIncreasePerPhase = 0.04f;
        public float HazardChanceCap = 0.45f;

        [Header("Settle")]
        public float SettleVelocityThreshold = 0.5f;
        public float SettleHoldSeconds = 0.4f;

        [Header("Slow Motion")]
        public float SlowMoCooldown = 1.5f;

        [Header("XP")]
        public int XpPerMeter = 1;
        public int XpPerRunCap = 500;

        [Header("Daily")]
        public int DailyXpCapBase = 1500;
        public int DailyXpCapPerLevel = 50;
        public int DailyXpCapMax = 4000;

        [Header("Pity")]
        public int CratesWithoutEpicBeforePity = 40;
    }
}
