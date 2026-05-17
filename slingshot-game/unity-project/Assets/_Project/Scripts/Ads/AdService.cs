using System;
using Game.Core;
using UnityEngine;

namespace Game.Ads
{
    /// <summary>
    /// Thin wrapper over the mediation SDK (LevelPlay/AppLovin/AdMob). Implements gating rules:
    ///   - interstitials throttled to 1 / 4 min, max 3 / session, first one only after run 6.
    ///   - rewarded video player-initiated only.
    /// </summary>
    public sealed class AdService
    {
        private DateTime _lastInterstitialUtc = DateTime.MinValue;
        private int _interstitialsThisSession;
        private int _runsThisSession;

        public bool CanShowInterstitial =>
            _runsThisSession >= 6 &&
            _interstitialsThisSession < 3 &&
            (DateTime.UtcNow - _lastInterstitialUtc).TotalMinutes >= 4;

        public AdService()
        {
            EventBus<RunEnded>.Subscribe(_ => _runsThisSession++);
            EventBus<AdRequested>.Subscribe(OnAdRequested);
        }

        private void OnAdRequested(AdRequested evt)
        {
            switch (evt.Placement)
            {
                case "rv_double_coins":
                case "rv_free_crate":
                case "rv_continue_run":
                case "rv_power_boost":
                    ShowRewarded(evt.Placement);
                    break;
                case "interstitial":
                    if (CanShowInterstitial) ShowInterstitial();
                    break;
            }
        }

        private void ShowRewarded(string placement)
        {
            // Real impl: call mediation SDK, then publish AdShownCompleted with Rewarded=true on success.
            Logger.Info($"[Ad] Rewarded show: {placement}");
            EventBus<AdShownCompleted>.Publish(new AdShownCompleted(placement, true));
        }

        private void ShowInterstitial()
        {
            _interstitialsThisSession++;
            _lastInterstitialUtc = DateTime.UtcNow;
            Logger.Info("[Ad] Interstitial");
            EventBus<AdShownCompleted>.Publish(new AdShownCompleted("interstitial", false));
        }
    }
}
