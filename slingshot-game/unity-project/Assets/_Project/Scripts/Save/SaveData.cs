using System;
using System.Collections.Generic;
using Game.Core;

namespace Game.Save
{
    /// <summary>
    /// The single root of player state. Serialized to disk + cloud as one document. Versioned for migrations.
    /// </summary>
    [Serializable]
    public sealed class SaveData
    {
        public int Version = 1;
        public string PlayerId = Guid.NewGuid().ToString();
        public long CreatedUtcTicks = DateTime.UtcNow.Ticks;
        public long LastSyncUtcTicks;

        // Currencies
        public long Coins;
        public long Gems;
        public long Bolts;

        // Progression
        public int Level = 1;
        public long Xp = 0;
        public int PrestigeCount = 0;

        // Inventory
        public List<string> UnlockedProjectileIds = new();
        public List<string> UnlockedLauncherIds = new();
        public string EquippedProjectileId = "tennis_ball";
        public string EquippedLauncherId = "launcher_wooden";
        public List<string> UnlockedCosmeticIds = new();
        public string EquippedTrailId = "trail_default";
        public string EquippedImpactFxId = "impact_default";
        public string EquippedPetId = "";

        // Upgrades
        public Dictionary<string, int> UpgradeTiers = new();

        // Stats
        public long BestDistanceCm;
        public long LifetimeCoins;
        public int LifetimeRuns;
        public int LifetimeBounces;

        // Battle Pass
        public string ActiveBattlePassId = "bp_s1";
        public long BpXp = 0;
        public bool BpPremiumOwned = false;

        // Daily
        public long LastDailyRewardUtcTicks;
        public int DailyStreak = 0;

        // Missions
        public Dictionary<string, MissionProgress> Missions = new();

        // Achievements (List for JsonUtility compatibility; treat semantically as a set)
        public List<string> AchievementsUnlocked = new();

        // Crate Pity
        public int CratesWithoutEpicStreak = 0;

        // Settings
        public Settings Settings = new();
    }

    [Serializable]
    public sealed class MissionProgress
    {
        public string MissionId;
        public long Progress;
        public bool Claimed;
        public long AssignedUtcTicks;
    }

    [Serializable]
    public sealed class Settings
    {
        public float MusicVolume = 0.8f;
        public float SfxVolume = 1.0f;
        public bool HapticsEnabled = true;
        public bool ReducedMotion = false;
        public string Locale = "en";
        public bool AdsPersonalized = true;
    }
}
