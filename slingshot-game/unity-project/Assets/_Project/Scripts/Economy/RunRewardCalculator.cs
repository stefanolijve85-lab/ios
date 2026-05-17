using Game.Core;
using Game.Data;
using Game.Save;
using UnityEngine;

namespace Game.Economy
{
    /// <summary>
    /// Translates a finished run into coin & XP payouts using the formulas in docs/09-upgrade-formulas.md.
    /// Listens to <see cref="RunEnded"/> and publishes the resulting currency/XP grants.
    /// </summary>
    public sealed class RunRewardCalculator
    {
        private readonly GameTuning _tuning;
        private readonly CurrencyService _currency;
        private readonly SaveService _save;
        private float _peakMultiplier = 1f;
        private int _bonusZones;
        private float _eventMultiplier = 1f;

        public RunRewardCalculator(GameTuning tuning, CurrencyService currency, SaveService save)
        {
            _tuning = tuning;
            _currency = currency;
            _save = save;
            EventBus<ComboChanged>.Subscribe(OnCombo);
            EventBus<RingPassed>.Subscribe(_ => _bonusZones++);
            EventBus<ObstacleDestroyed>.Subscribe(_ => _bonusZones++);
            EventBus<RunStarted>.Subscribe(_ => Reset());
            EventBus<RunEnded>.Subscribe(OnRunEnded);
        }

        public void SetEventMultiplier(float mult) => _eventMultiplier = Mathf.Max(0f, mult);

        private void Reset() { _peakMultiplier = 1f; _bonusZones = 0; }

        private void OnCombo(ComboChanged evt) { if (evt.Multiplier > _peakMultiplier) _peakMultiplier = evt.Multiplier; }

        private void OnRunEnded(RunEnded evt)
        {
            float prestigeMult = Mathf.Min(1f + _save.Data.PrestigeCount * _tuning.PrestigeMultiplierPerLevel, 1f + _tuning.PrestigeMultiplierMax);
            float raw = evt.Distance * _peakMultiplier * _tuning.CoinsPerScoreUnit
                       + _bonusZones * _tuning.BonusZoneCoinFactor * 100f;
            int coins = Mathf.RoundToInt(raw * prestigeMult * _eventMultiplier);

            int xp = Mathf.Min(_tuning.XpPerRunCap, Mathf.RoundToInt(evt.Distance * _tuning.XpPerMeter));

            _currency.Grant(Currency.Coins, coins, "run_end");
            EventBus<XpGained>.Publish(new XpGained(xp, "run_end"));

            // Track personal best (distance in cm to preserve int math).
            long cm = (long)(evt.Distance * 100);
            if (cm > _save.Data.BestDistanceCm) _save.Data.BestDistanceCm = cm;
            _save.Data.LifetimeRuns++;
            _save.MarkDirty();
        }
    }
}
