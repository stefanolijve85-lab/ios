using System.Collections.Generic;
using Game.Core;
using Game.Data;
using Game.Economy;
using Game.Save;
using UnityEngine;

namespace Game.Progression
{
    /// <summary>
    /// Applies cost-curve and effect-curve from <see cref="UpgradeTrackDefinition"/>. Authoritative for purchase.
    /// </summary>
    public sealed class UpgradeService
    {
        private readonly SaveService _save;
        private readonly CurrencyService _currency;
        private readonly Dictionary<UpgradeBranch, UpgradeTrackDefinition> _tracks = new();

        public UpgradeService(SaveService save, CurrencyService currency, IEnumerable<UpgradeTrackDefinition> tracks)
        {
            _save = save;
            _currency = currency;
            foreach (var t in tracks) _tracks[t.Branch] = t;
        }

        public int GetTier(UpgradeBranch b) => _save.Data.UpgradeTiers.TryGetValue(b.ToString(), out var v) ? v : 0;
        public int NextCost(UpgradeBranch b) => _tracks[b].CostAtTier(GetTier(b) + 1);
        public float CurrentEffect(UpgradeBranch b) => _tracks[b].EffectAtTier(GetTier(b));

        public bool TryUpgrade(UpgradeBranch b)
        {
            if (!_tracks.TryGetValue(b, out var def)) return false;
            int tier = GetTier(b);
            if (tier >= def.MaxTier) return false;
            int cost = def.CostAtTier(tier + 1);
            if (!_currency.TrySpend(Currency.Coins, cost, $"upgrade_{b}")) return false;
            _save.Data.UpgradeTiers[b.ToString()] = tier + 1;
            _save.MarkDirty();
            EventBus<UpgradePurchased>.Publish(new UpgradePurchased(b.ToString(), tier + 1));
            return true;
        }

        // Aggregate stat modifier applied to runtime systems.
        public float PowerMultiplier      => 1f + CurrentEffect(UpgradeBranch.Power);
        public float BounceRetention      => 1f + CurrentEffect(UpgradeBranch.Bounce);
        public float DragMultiplier       => Mathf.Max(0.3f, 1f - CurrentEffect(UpgradeBranch.Aero));
        public float ComboWindowAdd       => CurrentEffect(UpgradeBranch.ComboWindow);
        public float MagnetRadiusAdd      => CurrentEffect(UpgradeBranch.MagnetRadius) * 10f;     // ratio→meters
        public float CritChanceAdd        => Mathf.Min(0.5f, CurrentEffect(UpgradeBranch.CritChance));
    }
}
