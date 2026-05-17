using UnityEngine;

namespace Game.Data
{
    public enum UpgradeBranch { Power, Bounce, Aero, ComboWindow, MagnetRadius, CritChance }

    [CreateAssetMenu(menuName = "Game/Data/Upgrade Track", fileName = "Upgrade_New")]
    public sealed class UpgradeTrackDefinition : ScriptableObject
    {
        public UpgradeBranch Branch = UpgradeBranch.Power;
        public string DisplayName = "Power";
        public Sprite Icon;
        public string EffectDescription = "+3% impulse per tier";

        [Header("Cost Curve")]
        public int BaseCost = 100;
        [Tooltip("Geometric growth ratio per tier (1.18 ≈ +18% / tier).")]
        public float CostGrowth = 1.18f;
        public int MaxTier = 50;

        [Header("Effect Curve")]
        [Tooltip("Per-tier additive effect ratio (e.g., 0.03 = +3%).")]
        public float PerTierEffect = 0.03f;

        public int CostAtTier(int tier) => Mathf.RoundToInt(BaseCost * Mathf.Pow(CostGrowth, tier - 1));
        public float EffectAtTier(int tier) => Mathf.Max(0, tier) * PerTierEffect;
    }
}
