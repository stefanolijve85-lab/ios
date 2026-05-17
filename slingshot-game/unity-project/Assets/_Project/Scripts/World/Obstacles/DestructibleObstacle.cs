using Game.Core;
using UnityEngine;

namespace Game.World.Obstacles
{
    /// <summary>
    /// HP-based destructible. Damage scales with incoming kinetic energy. Drops coins on destroy and spawns
    /// a shard prefab via the pool.
    /// </summary>
    public sealed class DestructibleObstacle : MonoBehaviour
    {
        [SerializeField] private string _id = "obstacle_crate";
        [SerializeField] private float _hp = 100f;
        [SerializeField] private float _destructionMultiplier = 1f;
        [SerializeField] private int _coinDropOnDestroy = 25;
        [SerializeField] private GameObject _shardPrefab;
        [SerializeField] private SpriteRenderer _sprite;
        [SerializeField] private AudioClip _hitSfx;
        [SerializeField] private AudioClip _destroySfx;

        private float _currentHp;
        private bool _destroyed;

        private void OnEnable() { _currentHp = _hp; _destroyed = false; if (_sprite != null) _sprite.enabled = true; }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (_destroyed) return;
            var rb = collision.rigidbody;
            if (rb == null) return;

            float relSpeedSqr = collision.relativeVelocity.sqrMagnitude;
            float damage = 0.5f * rb.mass * relSpeedSqr * _destructionMultiplier;
            _currentHp -= damage;

            if (_currentHp <= 0f) Destroy();
        }

        private void Destroy()
        {
            _destroyed = true;
            if (_sprite != null) _sprite.enabled = false;
            if (_shardPrefab != null) Instantiate(_shardPrefab, transform.position, transform.rotation);
            EventBus<ObstacleDestroyed>.Publish(new ObstacleDestroyed(_id, _coinDropOnDestroy));
            EventBus<ShakeRequested>.Publish(new ShakeRequested("Medium"));
        }
    }
}
