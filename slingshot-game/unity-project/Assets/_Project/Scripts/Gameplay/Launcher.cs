using Game.Core;
using Game.Data;
using Game.Physics;
using Game.Pooling;
using UnityEngine;

namespace Game.Gameplay
{
    /// <summary>
    /// Visual & functional slingshot. Owns the current launcher tier + projectile selection and spawns a projectile
    /// configured with the player's effective upgrade values.
    /// </summary>
    public sealed class Launcher : MonoBehaviour
    {
        [SerializeField] private GameTuning _tuning;
        [SerializeField] private Transform _bandAnchorLeft;
        [SerializeField] private Transform _bandAnchorRight;
        [SerializeField] private Transform _bandCenter;
        [SerializeField] private LauncherDefinition _defaultLauncher;
        [SerializeField] private ProjectileDefinition _defaultProjectile;

        private LauncherDefinition _launcher;
        private ProjectileDefinition _projectile;
        private PoolService _pool;

        public string CurrentLauncherId => _launcher != null ? _launcher.Id : "unknown";

        public float EffectivePowerMul { get; set; } = 1f;   // set by Progression service from upgrades
        public float EffectiveAccuracyDeg { get; set; }      // residual jitter

        private void Awake()
        {
            _pool = ServiceLocator.Get<PoolService>();
            Equip(_defaultLauncher, _defaultProjectile);
        }

        public void Equip(LauncherDefinition launcher, ProjectileDefinition projectile)
        {
            _launcher = launcher;
            _projectile = projectile;
            EffectiveAccuracyDeg = launcher != null ? launcher.AccuracyJitter : 0f;
        }

        public void PrepareForAim()
        {
            // Animate band to neutral, idle bob via Animator handled by the rig prefab.
        }

        public Projectile SpawnAndLaunch(Vector3 spawnPos, Vector2 dragImpulse)
        {
            var projectile = _pool.Spawn(_projectile.Prefab.GetComponent<Projectile>(), spawnPos, Quaternion.identity);
            projectile.Initialize(_projectile);

            float charge = Mathf.Clamp01(dragImpulse.magnitude / _tuning.MaxDragMagnitude);
            float power = _tuning.BaseImpulse * _launcher.PowerMultiplier * EffectivePowerMul * EaseOutQuad(charge);

            Vector2 direction = dragImpulse.normalized;
            direction = ApplyJitter(direction, EffectiveAccuracyDeg);

            projectile.Rigidbody.linearVelocity = Vector2.zero;
            projectile.Rigidbody.AddForce(direction * power, ForceMode2D.Impulse);

            // Note: LaunchReleased is published by the input layer (DragAim). The launcher only applies impulse.
            return projectile;
        }

        public void RecycleProjectile(Projectile projectile)
        {
            _pool.Despawn(_projectile.Prefab.GetComponent<Projectile>(), projectile);
        }

        private static Vector2 ApplyJitter(Vector2 dir, float maxDeg)
        {
            if (maxDeg < 0.01f) return dir;
            float deg = Random.Range(-maxDeg, maxDeg);
            float rad = deg * Mathf.Deg2Rad;
            float cos = Mathf.Cos(rad), sin = Mathf.Sin(rad);
            return new Vector2(dir.x * cos - dir.y * sin, dir.x * sin + dir.y * cos);
        }

        private static float EaseOutQuad(float t) => 1f - (1f - t) * (1f - t);
    }
}
