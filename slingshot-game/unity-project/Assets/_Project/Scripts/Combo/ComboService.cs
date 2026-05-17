using Game.Core;
using Game.Data;
using UnityEngine;

namespace Game.Combo
{
    /// <summary>
    /// Tracks combo, multiplier and decay. The single authority for "current run score multiplier".
    /// </summary>
    public sealed class ComboService
    {
        private readonly GameTuning _tuning;
        private int _combo;
        private float _multiplier = 1f;
        private float _lastEventTime;
        private bool _active;

        public int Combo => _combo;
        public float Multiplier => _multiplier;
        public int PeakCombo { get; private set; }

        public ComboService(GameTuning tuning)
        {
            _tuning = tuning;
            EventBus<BounceOccurred>.Subscribe(OnBounce);
            EventBus<BoostTriggered>.Subscribe(OnBoost);
            EventBus<RingPassed>.Subscribe(OnRing);
            EventBus<RunStarted>.Subscribe(OnRunStarted);
            EventBus<ProjectileSettled>.Subscribe(OnSettled);
            EventBus<CriticalHit>.Subscribe(OnCrit);
        }

        public void Dispose()
        {
            EventBus<BounceOccurred>.Unsubscribe(OnBounce);
            EventBus<BoostTriggered>.Unsubscribe(OnBoost);
            EventBus<RingPassed>.Unsubscribe(OnRing);
            EventBus<RunStarted>.Unsubscribe(OnRunStarted);
            EventBus<ProjectileSettled>.Unsubscribe(OnSettled);
            EventBus<CriticalHit>.Unsubscribe(OnCrit);
        }

        public void TickDecay()
        {
            if (!_active || _combo <= 0) return;
            if (Time.time - _lastEventTime > _tuning.ComboDecaySeconds) Break();
        }

        private void OnRunStarted(RunStarted _) { _combo = 0; _multiplier = 1f; PeakCombo = 0; _active = true; _lastEventTime = Time.time; Broadcast(); }
        private void OnSettled(ProjectileSettled _) { _active = false; Break(); }

        private void OnBounce(BounceOccurred _)  { if (_active) AddCombo(1); }
        private void OnBoost(BoostTriggered _)   { if (_active) AddCombo(_tuning.BoostComboGain + 1); }
        private void OnRing(RingPassed _)        { if (_active) AddCombo(5); }
        private void OnCrit(CriticalHit _)       { if (_active) AddCombo(3); }

        private void AddCombo(int n)
        {
            _combo += n;
            if (_combo > PeakCombo) PeakCombo = _combo;
            _multiplier = Mathf.Clamp(1f + Mathf.FloorToInt(_combo / (float)_tuning.ComboStep) * _tuning.MultiplierStep, 1f, _tuning.MultiplierCap);
            _lastEventTime = Time.time;
            Broadcast();
        }

        private void Break()
        {
            int finalCombo = _combo;
            float finalMul = _multiplier;
            _combo = 0; _multiplier = 1f;
            EventBus<ComboBroken>.Publish(new ComboBroken(finalCombo, finalMul));
            Broadcast();
        }

        private void Broadcast() => EventBus<ComboChanged>.Publish(new ComboChanged(_combo, _multiplier));
    }
}
