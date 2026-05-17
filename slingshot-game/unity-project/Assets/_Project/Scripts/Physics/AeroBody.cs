using Game.Data;
using UnityEngine;

namespace Game.Physics
{
    /// <summary>
    /// Applies quadratic air drag plus a visual magnus spin effect to a Rigidbody2D. Box2D's built-in linear drag
    /// feels mushy at high velocity — this gives projectiles realistic "settle" while keeping snappy peaks.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    public sealed class AeroBody : MonoBehaviour
    {
        private Rigidbody2D _rb;
        private ProjectileDefinition _def;

        public void Configure(ProjectileDefinition def)
        {
            _def = def;
            _rb = GetComponent<Rigidbody2D>();
            _rb.mass = def.Mass;
            _rb.linearDamping = 0f;      // we own damping
            _rb.angularDamping = 0.05f;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            _rb.sleepMode = RigidbodySleepMode2D.NeverSleep;
        }

        private void FixedUpdate()
        {
            if (_def == null) return;
            Vector2 v = _rb.linearVelocity;
            float speed = v.magnitude;
            if (speed < 0.01f) return;

            // F_drag = 0.5 * Cd * rho_air * A * v^2 (rho lumped into Cd for tuning simplicity).
            float dragMag = 0.5f * _def.DragCoefficient * _def.CrossSectionArea * speed * speed;
            Vector2 dragForce = -(v / speed) * dragMag;
            _rb.AddForce(dragForce, ForceMode2D.Force);

            // Magnus / visual spin = small lateral lift proportional to angular velocity & forward speed.
            float spin = _rb.angularVelocity * Mathf.Deg2Rad;
            Vector2 perp = new Vector2(-v.y, v.x).normalized;
            _rb.AddForce(perp * (spin * speed * 0.005f * _def.Mass), ForceMode2D.Force);
        }
    }
}
