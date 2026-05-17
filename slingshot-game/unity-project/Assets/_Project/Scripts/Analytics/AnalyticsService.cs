using System.Collections.Generic;
using Game.Core;
using UnityEngine;

namespace Game.Analytics
{
    /// <summary>
    /// Funnel-friendly analytics wrapper. Vendor-swappable adapter pattern so we can switch SDKs without touching the
    /// rest of the codebase.
    /// </summary>
    public sealed class AnalyticsService
    {
        public interface IAdapter { void Track(string name, IDictionary<string, object> props); }

        private readonly IAdapter _adapter;

        public AnalyticsService(IAdapter adapter)
        {
            _adapter = adapter;
            EventBus<RunStarted>.Subscribe(e => Track("run_started", new() { { "projectile", e.ProjectileId }, { "launcher", e.LauncherId }, { "biome", e.BiomeId } }));
            EventBus<RunEnded>.Subscribe(e => Track("run_ended", new() { { "distance", e.Distance }, { "peak_combo", e.PeakCombo }, { "coins", e.Coins }, { "duration", e.DurationSeconds } }));
            EventBus<LaunchReleased>.Subscribe(e => Track("launch_released", new() { { "charge", e.ChargeRatio } }));
            EventBus<UpgradePurchased>.Subscribe(e => Track("upgrade_purchased", new() { { "branch", e.Branch }, { "tier", e.Tier } }));
            EventBus<CrateOpened>.Subscribe(e => Track("crate_opened", new() { { "crate", e.CrateId }, { "duplicate", e.WasDuplicate } }));
            EventBus<IapPurchased>.Subscribe(e => Track("iap_purchased", new() { { "product", e.ProductId }, { "verified", e.Verified } }));
        }

        private void Track(string name, IDictionary<string, object> props)
        {
            try { _adapter?.Track(name, props); }
            catch (System.Exception e) { Logger.Error("Analytics track failed: " + e); }
        }
    }

    /// <summary>Default no-op adapter for development.</summary>
    public sealed class NullAnalyticsAdapter : AnalyticsService.IAdapter
    {
        public void Track(string name, IDictionary<string, object> props)
        {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            Debug.Log($"[Analytics] {name} {string.Join(",", props)}");
#endif
        }
    }
}
