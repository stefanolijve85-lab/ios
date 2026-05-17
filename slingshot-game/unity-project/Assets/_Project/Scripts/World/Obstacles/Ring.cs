using Game.Core;
using UnityEngine;

namespace Game.World.Obstacles
{
    /// <summary>
    /// Precision ring: pass through cleanly for +combo and a boost token.
    /// </summary>
    [RequireComponent(typeof(Collider2D))]
    public sealed class Ring : MonoBehaviour
    {
        [SerializeField] private int _ringId;
        private bool _used;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_used) return;
            if (other.attachedRigidbody == null) return;
            _used = true;
            EventBus<RingPassed>.Publish(new RingPassed(_ringId));
            gameObject.SetActive(false);
        }

        private void OnEnable() => _used = false;
    }
}
