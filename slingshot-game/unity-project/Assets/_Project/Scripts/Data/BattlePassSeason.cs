using System;
using UnityEngine;

namespace Game.Data
{
    [Serializable]
    public sealed class BattlePassTierReward
    {
        public int Tier;
        public string FreeRewardId;
        public string PremiumRewardId;
        public int FreeRewardCoins;
        public int FreeRewardGems;
        public int PremiumRewardGems;
    }

    [CreateAssetMenu(menuName = "Game/Data/Battle Pass Season", fileName = "BP_Season_New")]
    public sealed class BattlePassSeason : ScriptableObject
    {
        public string Id = "bp_s1";
        public string DisplayName = "Season 1 — Backyard Bash";
        public string Theme = "Backyard";
        public int DurationDays = 30;
        public int TotalTiers = 50;
        public int XpPerTier = 1000;
        public Sprite Banner;

        public BattlePassTierReward[] Tiers;

        [Header("Pricing")]
        public string PremiumIapProductId = "bp_s1_premium";
        public string PassPlusIapProductId = "bp_s1_plus";

        public int XpToTier(int tier) => tier * XpPerTier;
        public int TierFromXp(int xp) => Mathf.Clamp(xp / Mathf.Max(1, XpPerTier), 0, TotalTiers);
    }
}
