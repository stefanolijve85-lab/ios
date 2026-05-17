using Game.Core;
using UnityEngine;

namespace Game.World.Obstacles
{
    /// <summary>
    /// Single-direction boost pad. Resets projectile velocity for a predictable feel, then applies impulse.
    /// </summary>
    [RequireComponent(typeof(Collider2D))]
    public sealed class BoostPad : MonoBehaviour
    {
        [SerializeField] private float _impulse = 22f;
        [SerializeField] private Vector2 _direction = new(0.6f, 1f);
        [SerializeField] private float _comboBonus = 1f;

        private void OnTriggerEnter2D(Collider2D other)
        {
            var rb = other.attachedRigidbody;
            if (rb == null) return;
            Vector2 dir = transform.TransformDirection(_direction.normalized);
            rb.linearVelocity = Vector2.zero;
            rb.AddForce(dir * _impulse * rb.mass, ForceMode2D.Impulse);
            EventBus<BoostTriggered>.Publish(new BoostTriggered(dir, _impulse));
            EventBus<ShakeRequested>.Publish(new ShakeRequested("Large"));
        }
    }
}
