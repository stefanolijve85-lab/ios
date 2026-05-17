using Game.Data;
using Game.Physics;
using UnityEngine;

namespace Game.Gameplay
{
    /// <summary>
    /// Runtime wrapper for any projectile prefab. Wires <see cref="AeroBody"/>, plays trail VFX, handles ability tap.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    public sealed class Projectile : MonoBehaviour
    {
        [SerializeField] private TrailRenderer _trail;
        [SerializeField] private AeroBody _aero;
        [SerializeField] private SpriteRenderer _sprite;

        public Rigidbody2D Rigidbody { get; private set; }
        public ProjectileDefinition Definition { get; private set; }

        private void Awake()
        {
            Rigidbody = GetComponent<Rigidbody2D>();
        }

        public void Initialize(ProjectileDefinition def)
        {
            Definition = def;
            if (_aero == null) _aero = GetComponent<AeroBody>() ?? gameObject.AddComponent<AeroBody>();
            _aero.Configure(def);
            if (_trail != null) _trail.Clear();
            if (_sprite != null && def.Icon != null) _sprite.sprite = def.Icon;
        }

        public void UseAbility()
        {
            if (Definition == null || string.IsNullOrEmpty(Definition.AbilityId)) return;
            // Dispatch via ability registry in a real build — kept extension-friendly here.
            Game.Core.EventBus<Game.Core.AbilityUsed>.Publish(new Game.Core.AbilityUsed(Definition.AbilityId));
        }
    }
}
