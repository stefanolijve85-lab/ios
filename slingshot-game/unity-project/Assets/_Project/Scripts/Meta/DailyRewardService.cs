using System;
using Game.Core;
using Game.Economy;
using Game.Save;

namespace Game.Meta
{
    /// <summary>
    /// 7-day rotating daily login reward with a forgiving 36-hour grace window (no streak loss on a single miss).
    /// </summary>
    public sealed class DailyRewardService
    {
        private static readonly (Currency c, int amount)[] Cycle =
        {
            (Currency.Coins, 200),
            (Currency.Coins, 0),       // crate id pretend
            (Currency.Gems, 50),
            (Currency.Coins, 500),
            (Currency.Coins, 0),       // crate id pretend
            (Currency.Gems, 100),
            (Currency.Coins, 0)        // epic crate
        };

        private readonly SaveService _save;
        private readonly CurrencyService _currency;

        public DailyRewardService(SaveService save, CurrencyService currency) { _save = save; _currency = currency; }

        public bool CanClaim()
        {
            var lastClaim = new DateTime(_save.Data.LastDailyRewardUtcTicks, DateTimeKind.Utc);
            return (DateTime.UtcNow - lastClaim).TotalHours >= 22;
        }

        public bool TryClaim()
        {
            if (!CanClaim()) return false;
            var lastClaim = new DateTime(_save.Data.LastDailyRewardUtcTicks, DateTimeKind.Utc);
            var hoursSince = (DateTime.UtcNow - lastClaim).TotalHours;
            // Grace window: if > 36h since last claim, reset streak.
            if (hoursSince > 36) _save.Data.DailyStreak = 0;

            int day = _save.Data.DailyStreak % Cycle.Length;
            var reward = Cycle[day];
            if (reward.amount > 0) _currency.Grant(reward.c, reward.amount, "daily_reward");

            _save.Data.DailyStreak++;
            _save.Data.LastDailyRewardUtcTicks = DateTime.UtcNow.Ticks;
            _save.MarkDirty();

            EventBus<DailyRewardClaimed>.Publish(new DailyRewardClaimed(day + 1));
            return true;
        }
    }
}
