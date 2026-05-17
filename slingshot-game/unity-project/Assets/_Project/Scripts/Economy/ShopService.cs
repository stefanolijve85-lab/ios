using System;
using System.Collections.Generic;
using Game.Core;
using Game.Data;
using Game.Save;

namespace Game.Economy
{
    /// <summary>
    /// Catalog + transactional purchase of cosmetics, launchers and projectiles. Backed by SaveData inventory lists.
    /// </summary>
    public sealed class ShopService
    {
        public readonly struct ShopOffer
        {
            public readonly string Id;
            public readonly string DisplayName;
            public readonly Currency PriceCurrency;
            public readonly int Price;
            public readonly Action OnPurchased;
            public ShopOffer(string id, string name, Currency pc, int price, Action onPurchased)
            { Id = id; DisplayName = name; PriceCurrency = pc; Price = price; OnPurchased = onPurchased; }
        }

        private readonly Dictionary<string, ShopOffer> _offers = new();
        private readonly SaveService _save;
        private readonly CurrencyService _currency;

        public ShopService(SaveService save, CurrencyService currency)
        {
            _save = save;
            _currency = currency;
        }

        public void RegisterOffer(ShopOffer offer) => _offers[offer.Id] = offer;
        public IEnumerable<ShopOffer> AllOffers() => _offers.Values;

        public bool TryPurchase(string offerId, out string error)
        {
            error = "";
            if (!_offers.TryGetValue(offerId, out var offer)) { error = "offer_missing"; return false; }
            if (!_currency.TrySpend(offer.PriceCurrency, offer.Price, "shop_" + offerId)) { error = "insufficient_funds"; return false; }
            offer.OnPurchased?.Invoke();
            _save.MarkDirty();
            return true;
        }

        // Convenience helpers for canned offers.
        public void RegisterLauncherUnlock(LauncherDefinition def)
        {
            RegisterOffer(new ShopOffer(
                "launcher_unlock_" + def.Id, def.DisplayName,
                def.CostGems > 0 ? Currency.Gems : Currency.Coins,
                def.CostGems > 0 ? def.CostGems : def.CostCoins,
                () =>
                {
                    if (!_save.Data.UnlockedLauncherIds.Contains(def.Id))
                        _save.Data.UnlockedLauncherIds.Add(def.Id);
                }));
        }
    }
}
