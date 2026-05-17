using Game.Core;
using UnityEngine;
using UnityEngine.Audio;

namespace Game.Audio
{
    /// <summary>
    /// Orchestrates mixer snapshots, dynamic music, and ducking for cinematic moments. Owns no clips itself —
    /// modules ask it to play named events (resolved via tables).
    /// </summary>
    public sealed class AudioDirector : MonoBehaviour
    {
        [SerializeField] private AudioMixer _mixer;
        [SerializeField] private AudioMixerSnapshot _snapshotNormal;
        [SerializeField] private AudioMixerSnapshot _snapshotSlowMo;
        [SerializeField] private AudioMixerSnapshot _snapshotPause;
        [SerializeField] private AudioMixerSnapshot _snapshotEndRun;
        [SerializeField] private DynamicMusic _music;
        [SerializeField] private SfxPlayer _sfx;

        private void OnEnable()
        {
            EventBus<LaunchReleased>.Subscribe(OnLaunch);
            EventBus<SlowMoRequested>.Subscribe(OnSlowMo);
            EventBus<RunEnded>.Subscribe(OnRunEnded);
            EventBus<RunStarted>.Subscribe(OnRunStarted);
            EventBus<BounceOccurred>.Subscribe(OnBounce);
            EventBus<ComboChanged>.Subscribe(OnComboChanged);
            EventBus<CrateOpened>.Subscribe(OnCrateOpened);
            EventBus<CurrencyChanged>.Subscribe(OnCurrencyChanged);
        }

        private void OnDisable()
        {
            EventBus<LaunchReleased>.Unsubscribe(OnLaunch);
            EventBus<SlowMoRequested>.Unsubscribe(OnSlowMo);
            EventBus<RunEnded>.Unsubscribe(OnRunEnded);
            EventBus<RunStarted>.Unsubscribe(OnRunStarted);
            EventBus<BounceOccurred>.Unsubscribe(OnBounce);
            EventBus<ComboChanged>.Unsubscribe(OnComboChanged);
            EventBus<CrateOpened>.Unsubscribe(OnCrateOpened);
            EventBus<CurrencyChanged>.Unsubscribe(OnCurrencyChanged);
        }

        private void OnLaunch(LaunchReleased _)        => _sfx.PlayOneShot("launcher_release");
        private void OnSlowMo(SlowMoRequested _)       => _snapshotSlowMo?.TransitionTo(0.15f);
        private void OnRunStarted(RunStarted _)         { _snapshotNormal?.TransitionTo(0.1f); _music?.PlayBiomeStems(); }
        private void OnRunEnded(RunEnded _)             => _snapshotEndRun?.TransitionTo(0.3f);
        private void OnBounce(BounceOccurred evt)       => _sfx.PlayOneShot(evt.Force > 8f ? "impact_crit" : "impact_med");
        private void OnComboChanged(ComboChanged evt)   => _music?.SetIntensity(evt.Multiplier);
        private void OnCrateOpened(CrateOpened _)       => _sfx.PlayOneShot("crate_open");
        private void OnCurrencyChanged(CurrencyChanged evt) { if (evt.Delta > 0) _sfx.PlayOneShot("coin_ting"); }
    }
}
