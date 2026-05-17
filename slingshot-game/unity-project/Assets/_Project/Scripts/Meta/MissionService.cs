using System;
using System.Collections.Generic;
using Game.Core;
using Game.Data;
using Game.Economy;
using Game.Progression;
using Game.Save;
using UnityEngine;

namespace Game.Meta
{
    /// <summary>
    /// Listens to gameplay events to advance the player's active missions. Rolls daily/weekly sets.
    /// </summary>
    public sealed class MissionService
    {
        private readonly SaveService _save;
        private readonly CurrencyService _currency;
        private readonly BattlePassService _bp;
        private readonly List<MissionDefinition> _catalog;

        public MissionService(SaveService save, CurrencyService currency, BattlePassService bp, IEnumerable<MissionDefinition> catalog)
        {
            _save = save;
            _currency = currency;
            _bp = bp;
            _catalog = new List<MissionDefinition>(catalog);

            EventBus<RunEnded>.Subscribe(OnRunEnded);
            EventBus<BounceOccurred>.Subscribe(_ => Bump(MissionMetric.Bounces, 1));
            EventBus<BoostTriggered>.Subscribe(_ => Bump(MissionMetric.BoostsUsed, 1));
            EventBus<CrateOpened>.Subscribe(_ => Bump(MissionMetric.CratesOpened, 1));
        }

        public IEnumerable<MissionDefinition> ActiveDailies()
        {
            // Real impl: deterministically pick 3 today via date-seeded RNG and persist assignments.
            foreach (var m in _catalog)
                if (m.Scope == MissionScope.Daily) yield return m;
        }

        public MissionProgress GetProgress(string missionId)
        {
            if (!_save.Data.Missions.TryGetValue(missionId, out var p))
            {
                p = new MissionProgress { MissionId = missionId, AssignedUtcTicks = DateTime.UtcNow.Ticks };
                _save.Data.Missions[missionId] = p;
            }
            return p;
        }

        public bool TryClaim(string missionId)
        {
            var def = _catalog.Find(m => m.Id == missionId);
            if (def == null) return false;
            var p = GetProgress(missionId);
            if (p.Claimed || p.Progress < def.TargetValue) return false;
            p.Claimed = true;
            if (def.RewardCoins > 0) _currency.Grant(Currency.Coins, def.RewardCoins, "mission_" + missionId);
            if (def.RewardGems > 0) _currency.Grant(Currency.Gems, def.RewardGems, "mission_" + missionId);
            if (def.RewardBattlePassXp > 0) _bp.GrantXp(def.RewardBattlePassXp);
            _save.MarkDirty();
            EventBus<MissionCompleted>.Publish(new MissionCompleted(missionId));
            return true;
        }

        private void OnRunEnded(RunEnded evt)
        {
            Bump(MissionMetric.DistanceMeters, (long)evt.Distance);
            Bump(MissionMetric.CoinsEarned, evt.Coins);
            Bump(MissionMetric.RunsCompleted, 1);
            Bump(MissionMetric.ComboPeak, evt.PeakCombo);
        }

        private void Bump(MissionMetric metric, long amount)
        {
            foreach (var m in _catalog)
            {
                if (m.Metric != metric) continue;
                var p = GetProgress(m.Id);
                long target = m.ScalesWithLevel ? (long)(m.TargetValue * Mathf.Min(3f, 1f + _save.Data.Level * 0.05f)) : m.TargetValue;
                p.Progress = Mathf.Min((int)(p.Progress + amount), (int)target);
            }
            _save.MarkDirty();
        }
    }
}
