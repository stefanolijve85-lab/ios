using System.Collections;
using Game.Core;
using Game.Data;
using UnityEngine;

namespace Game.Physics
{
    /// <summary>
    /// Centralized slow-mo. Triggers cool down to avoid sluggish flow when multiple bounces stack hits.
    /// </summary>
    public sealed class SlowMotionService
    {
        private readonly CoroutineRunner _runner;
        private readonly GameTuning _tuning;
        private Coroutine _running;
        private float _lastTriggerTime = -10f;
        private const float DefaultFixedDelta = 1f / 60f;

        public SlowMotionService(CoroutineRunner runner, GameTuning tuning)
        {
            _runner = runner;
            _tuning = tuning;
            EventBus<SlowMoRequested>.Subscribe(OnRequested);
        }

        public void Dispose() => EventBus<SlowMoRequested>.Unsubscribe(OnRequested);

        private void OnRequested(SlowMoRequested evt) => Trigger(evt.Scale, evt.Duration);

        public void Trigger(float scale, float duration)
        {
            if (Time.unscaledTime - _lastTriggerTime < _tuning.SlowMoCooldown) return;
            _lastTriggerTime = Time.unscaledTime;

            if (_running != null) _runner.Stop(_running);
            _running = _runner.Run(Run(scale, duration));
        }

        private IEnumerator Run(float scale, float duration)
        {
            Time.timeScale = Mathf.Clamp(scale, 0.05f, 1f);
            Time.fixedDeltaTime = DefaultFixedDelta * Time.timeScale;
            yield return new WaitForSecondsRealtime(duration);
            Time.timeScale = 1f;
            Time.fixedDeltaTime = DefaultFixedDelta;
            _running = null;
        }
    }
}
