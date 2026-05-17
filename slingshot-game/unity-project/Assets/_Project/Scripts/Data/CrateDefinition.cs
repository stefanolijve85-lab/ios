using System;
using UnityEngine;

namespace Game.Data
{
    public enum CrateRarity { Common, Rare, Epic, Legendary }

    [Serializable]
    public sealed class CrateDropEntry
    {
        public string Id;
        [Range(0f, 1f)] public float Weight = 0.1f;
        public CrateRarity Rarity = CrateRarity.Common;
        public int CoinAmount;
        public int GemAmount;
    }

    [CreateAssetMenu(menuName = "Game/Data/Crate", fileName = "Crate_New")]
    public sealed class CrateDefinition : ScriptableObject
    {
        public string Id = "crate_common";
        public string DisplayName = "Common Crate";
        public CrateRarity Rarity = CrateRarity.Common;
        public Sprite Icon;

        [Tooltip("Number of items rolled per crate.")]
        public int RollsPerOpen = 5;

        public CrateDropEntry[] Drops;

        [Header("Pity")]
        public CrateRarity GuaranteedFloorRarity = CrateRarity.Common;
        public int GuaranteedFloorRollIndex = 0; // e.g., last slot guaranteed Rare for Rare crate
    }
}
