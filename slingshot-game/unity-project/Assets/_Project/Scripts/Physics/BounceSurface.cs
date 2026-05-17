using Game.Core;
using UnityEngine;

namespace Game.Physics
{
    /// <summary>
    /// Tag for any collider that should publish bounce events and optionally boost the projectile (trampoline pad).
    /// </summary>
    public sealed class BounceSurface : MonoBehaviour
    {
        [SerializeField] private string _surfaceId = "ground";
        [SerializeField] private bool _isBoostPad = false;
        [SerializeField] private Vector2 _boostDirection = Vector2.up;
        [SerializeField] private float _boostImpulse = 14f;
        [SerializeField] private bool _isCrit = false;

        private void OnCollisionEnter2D(Collision2D collision)
        {
            var rb = collision.rigidbody;
            if (rb == null) return;

            // Force magnitude approximated from impulse.
            float force = collision.relativeVelocity.magnitude * rb.mass;
            EventBus<BounceOccurred>.Publish(new BounceOccurred(
                collision.contacts[0].point, force,
                rb.gameObject.name, _surfaceId));

            if (_isCrit) EventBus<CriticalHit>.Publish(new CriticalHit(collision.contacts[0].point));

            if (_isBoostPad)
            {
                Vector2 dir = transform.TransformDirection(_boostDirection).normalized;
                rb.linearVelocity = Vector2.zero;          // reset for predictable feel
                rb.AddForce(dir * _boostImpulse * rb.mass, ForceMode2D.Impulse);
                EventBus<BoostTriggered>.Publish(new BoostTriggered(dir, _boostImpulse));
            }
        }
    }
}
