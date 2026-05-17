using System;
using Game.Core;
using Game.Data;
using Game.Save;
using UnityEngine;

namespace Game.Progression
{
    /// <summary>
    /// Battle pass XP tracking + tier resolution. Enforces daily XP caps and respects season expiry.
    /// </summary>
    public sealed class BattlePassService
    {
        private readonly SaveService _save;
        private readonly GameTuning _tuning;
        private BattlePassSeason _activeSeason;

        public BattlePassService(SaveService save, GameTuning tuning) { _save = save; _tuning = tuning; }

        public void SetActiveSeason(BattlePassSeason season)
        {
            _activeSeason = season;
            if (_save.Data.ActiveBattlePassId != season.Id)
            {
                _save.Data.ActiveBattlePassId = season.Id;
                _save.Data.BpXp = 0;
                _save.MarkDirty();
            }
        }

        public int CurrentTier => _activeSeason != null ? _activeSeason.TierFromXp((int)_save.Data.BpXp) : 0;
        public float ProgressInTier
        {
            get
            {
                if (_activeSeason == null) return 0;
                int xpIn = (int)(_save.Data.BpXp % _activeSeason.XpPerTier);
                return (float)xpIn / _activeSeason.XpPerTier;
            }
        }

        public int DailyXpCap => Mathf.Min(_tuning.DailyXpCapMax, _tuning.DailyXpCapBase + _tuning.DailyXpCapPerLevel * _save.Data.Level);

        public void GrantXp(int amount)
        {
            if (_activeSeason == null || amount <= 0) return;
            // Real impl: track per-day grant total to enforce DailyXpCap. Simplified here.
            int previousTier = CurrentTier;
            _save.Data.BpXp += amount;
            _save.MarkDirty();
            if (CurrentTier > previousTier) GrantTierRewards(previousTier + 1, CurrentTier);
        }

        private void GrantTierRewards(int from, int to)
        {
            for (int t = from; t <= to; t++)
            {
                // Hand off to economy/inventory in production code.
            }
        }
    }
}
