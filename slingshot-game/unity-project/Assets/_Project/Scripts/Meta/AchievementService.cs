using System.Collections.Generic;
using Game.Core;
using Game.Save;

namespace Game.Meta
{
    /// <summary>
    /// Permanent objectives. Listens to gameplay events and publishes <see cref="AchievementUnlocked"/> events.
    /// </summary>
    public sealed class AchievementService
    {
        private readonly SaveService _save;
        private readonly Dictionary<string, System.Func<bool>> _rules;

        public AchievementService(SaveService save)
        {
            _save = save;
            _rules = new Dictionary<string, System.Func<bool>>
            {
                { "achievement_fledgling",  () => _save.Data.BestDistanceCm >= 100_000 },     // 1 km
                { "achievement_globetrotter", () => false }, // populated by visit tracker
                { "achievement_centurion",  () => _save.Data.PrestigeCount >= 100 },
                { "achievement_collector",  () => _save.Data.UnlockedCosmeticIds.Count >= 50 },
            };

            EventBus<RunEnded>.Subscribe(_ => CheckAll());
            EventBus<PrestigeTriggered>.Subscribe(_ => CheckAll());
            EventBus<CrateOpened>.Subscribe(_ => CheckAll());
        }

        public void CheckAll()
        {
            foreach (var kv in _rules)
            {
                if (_save.Data.AchievementsUnlocked.Contains(kv.Key)) continue;
                if (kv.Value())
                {
                    _save.Data.AchievementsUnlocked.Add(kv.Key);
                    EventBus<AchievementUnlocked>.Publish(new AchievementUnlocked(kv.Key));
                    _save.MarkDirty();
                }
            }
        }
    }
}
