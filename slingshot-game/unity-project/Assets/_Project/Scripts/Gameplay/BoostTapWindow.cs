using Game.Core;
using Game.Data;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Game.Gameplay
{
    /// <summary>
    /// Opens a brief tap window after every bounce. Tap inside the window = boost.
    /// </summary>
    public sealed class BoostTapWindow : MonoBehaviour
    {
        [SerializeField] private GameTuning _tuning;

        private float _windowOpenAt = -10f;
        private bool _windowActive;
        private Rigidbody2D _activeRb;

        private void OnEnable()
        {
            EventBus<BounceOccurred>.Subscribe(OnBounce);
            EventBus<ProjectileSettled>.Subscribe(OnSettled);
        }

        private void OnDisable()
        {
            EventBus<BounceOccurred>.Unsubscribe(OnBounce);
            EventBus<ProjectileSettled>.Unsubscribe(OnSettled);
        }

        private void OnBounce(BounceOccurred evt)
        {
            _windowOpenAt = Time.time;
            _windowActive = true;
            // Active projectile is tracked elsewhere (RunController) — left for production wiring.
        }

        private void OnSettled(ProjectileSettled _) { _windowActive = false; _activeRb = null; }

        private void Update()
        {
            if (!_windowActive) return;
            if (Time.time - _windowOpenAt > _tuning.BoostWindowSeconds) { _windowActive = false; return; }
            if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.wasPressedThisFrame)
                TriggerBoost();
            else if (Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame)
                TriggerBoost();
        }

        private void TriggerBoost()
        {
            _windowActive = false;
            // Apply velocity boost via event so AbilityService / RunController owns velocity mutation.
            EventBus<BoostTriggered>.Publish(new BoostTriggered(Vector2.right, _tuning.BoostPowerMultiplier));
        }
    }
}
