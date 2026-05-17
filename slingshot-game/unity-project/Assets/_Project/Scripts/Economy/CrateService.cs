using System;
using System.Collections.Generic;
using Game.Core;
using Game.Data;
using Game.Save;
using UnityEngine;

namespace Game.Economy
{
    /// <summary>
    /// Rolls crate contents. Implements pity timer so worst-case streaks of bad luck still guarantee an Epic eventually.
    /// </summary>
    public sealed class CrateService
    {
        private readonly SaveService _save;
        private readonly CurrencyService _currency;
        private readonly GameTuning _tuning;
        private readonly System.Random _rng = new();

        public CrateService(SaveService save, CurrencyService currency, GameTuning tuning)
        {
            _save = save;
            _currency = currency;
            _tuning = tuning;
        }

        public List<CrateDropEntry> Open(CrateDefinition crate)
        {
            var rolls = new List<CrateDropEntry>(crate.RollsPerOpen);
            bool guaranteedEpic = _save.Data.CratesWithoutEpicStreak >= _tuning.CratesWithoutEpicBeforePity;

            for (int i = 0; i < crate.RollsPerOpen; i++)
            {
                bool forceFloor = (i == crate.GuaranteedFloorRollIndex);
                var entry = RollOne(crate, forceFloor, guaranteedEpic && i == 0);
                rolls.Add(entry);

                ApplyReward(entry);
                if (entry.Rarity >= CrateRarity.Epic) _save.Data.CratesWithoutEpicStreak = 0;
            }

            if (!ContainsEpic(rolls)) _save.Data.CratesWithoutEpicStreak++;
            EventBus<CrateOpened>.Publish(new CrateOpened(crate.Id, false));
            _save.MarkDirty();
            return rolls;
        }

        private CrateDropEntry RollOne(CrateDefinition crate, bool floor, bool guaranteedEpic)
        {
            float totalWeight = 0f;
            foreach (var d in crate.Drops) totalWeight += d.Weight;
            double r = _rng.NextDouble() * totalWeight;
            float acc = 0;
            CrateDropEntry pick = crate.Drops[0];
            foreach (var d in crate.Drops)
            {
                acc += d.Weight;
                if (r <= acc) { pick = d; break; }
            }
            if (floor && pick.Rarity < crate.GuaranteedFloorRarity) pick = PromoteToRarity(crate, crate.GuaranteedFloorRarity, pick);
            if (guaranteedEpic && pick.Rarity < CrateRarity.Epic) pick = PromoteToRarity(crate, CrateRarity.Epic, pick);
            return pick;
        }

        private CrateDropEntry PromoteToRarity(CrateDefinition crate, CrateRarity floor, CrateDropEntry fallback)
        {
            foreach (var d in crate.Drops)
                if (d.Rarity >= floor) return d;
            return fallback;
        }

        private bool ContainsEpic(List<CrateDropEntry> rolls)
        {
            foreach (var r in rolls) if (r.Rarity >= CrateRarity.Epic) return true;
            return false;
        }

        private void ApplyReward(CrateDropEntry entry)
        {
            if (entry.CoinAmount > 0) _currency.Grant(Currency.Coins, entry.CoinAmount, "crate");
            if (entry.GemAmount > 0) _currency.Grant(Currency.Gems, entry.GemAmount, "crate");
            if (!string.IsNullOrEmpty(entry.Id) && !_save.Data.UnlockedCosmeticIds.Contains(entry.Id))
                _save.Data.UnlockedCosmeticIds.Add(entry.Id);
        }
    }
}
