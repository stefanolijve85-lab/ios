using Game.Core;
using Game.Save;

namespace Game.Economy
{
    /// <summary>
    /// Owns all currency mutations. Every spend/grant flows here so analytics, audit and HUD remain in sync.
    /// </summary>
    public sealed class CurrencyService
    {
        private readonly SaveService _save;

        public CurrencyService(SaveService save) { _save = save; }

        public long Get(Currency c) => c switch
        {
            Currency.Coins => _save.Data.Coins,
            Currency.Gems => _save.Data.Gems,
            Currency.Bolts => _save.Data.Bolts,
            _ => 0
        };

        public void Grant(Currency c, long amount, string source)
        {
            if (amount <= 0) return;
            Mutate(c, amount, source);
        }

        public bool TrySpend(Currency c, long amount, string sink)
        {
            if (amount <= 0) return true;
            if (Get(c) < amount) return false;
            Mutate(c, -amount, sink);
            return true;
        }

        private void Mutate(Currency c, long delta, string reason)
        {
            long now = c switch
            {
                Currency.Coins => _save.Data.Coins += delta,
                Currency.Gems => _save.Data.Gems += delta,
                Currency.Bolts => _save.Data.Bolts += delta,
                _ => 0
            };
            if (c == Currency.Coins && delta > 0) _save.Data.LifetimeCoins += delta;
            _save.MarkDirty();
            EventBus<CurrencyChanged>.Publish(new CurrencyChanged(c, now, delta));
        }
    }
}
