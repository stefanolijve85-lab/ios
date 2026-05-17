using UnityEngine;

namespace Game.Data
{
    public enum MissionScope { Daily, Weekly, Seasonal }
    public enum MissionMetric { DistanceMeters, Bounces, BoostsUsed, CoinsEarned, RunsCompleted, CratesOpened, ComboPeak }

    [CreateAssetMenu(menuName = "Game/Data/Mission", fileName = "Mission_New")]
    public sealed class MissionDefinition : ScriptableObject
    {
        public string Id = "mission_daily_distance_3k";
        public string DisplayName = "Travel 3 km";
        public MissionScope Scope = MissionScope.Daily;
        public MissionMetric Metric = MissionMetric.DistanceMeters;

        public long TargetValue = 3000;
        public int RewardCoins = 200;
        public int RewardGems = 0;
        public int RewardBattlePassXp = 50;
        public string RewardItemId = "";   // optional - e.g., common crate id

        [Tooltip("Difficulty multiplier scales with player level.")]
        public bool ScalesWithLevel = true;
    }
}
