using System.Collections;
using Game.Combo;
using Game.Core;
using Game.Data;
using UnityEngine;

namespace Game.Gameplay
{
    /// <summary>
    /// Authoritative state machine for a single run. Owns the projectile lifecycle and decides when scoring/end runs.
    /// </summary>
    public sealed class RunController : MonoBehaviour
    {
        public enum RunState { Ready, Aiming, Charging, Released, Flying, Settling, Scoring, Decision }

        [SerializeField] private Launcher _launcher;
        [SerializeField] private Transform _spawnPoint;
        [SerializeField] private GameTuning _tuning;

        private RunState _state = RunState.Ready;
        private Projectile _activeProjectile;
        private float _settleTimer;
        private float _runStartTime;
        private float _maxX;
        private ComboService _combo;

        public RunState State => _state;
        public float CurrentDistance => _activeProjectile != null ? Mathf.Max(0, _activeProjectile.transform.position.x - _spawnPoint.position.x) : 0f;

        private void Awake()
        {
            _combo = ServiceLocator.Get<ComboService>();
        }

        private void OnEnable()
        {
            EventBus<LaunchReleased>.Subscribe(OnLaunchReleased);
            EventBus<LaunchAiming>.Subscribe(OnLaunchAiming);
            EventBus<LaunchCanceled>.Subscribe(OnLaunchCanceled);
        }

        private void OnDisable()
        {
            EventBus<LaunchReleased>.Unsubscribe(OnLaunchReleased);
            EventBus<LaunchAiming>.Unsubscribe(OnLaunchAiming);
            EventBus<LaunchCanceled>.Unsubscribe(OnLaunchCanceled);
        }

        private void Start()
        {
            EnterReady();
        }

        private void Update()
        {
            _combo.TickDecay();
            switch (_state)
            {
                case RunState.Flying: TickFlying(); break;
                case RunState.Settling: TickSettling(); break;
            }
        }

        private void TickFlying()
        {
            if (_activeProjectile == null) return;
            _maxX = Mathf.Max(_maxX, _activeProjectile.transform.position.x);
            if (_activeProjectile.Rigidbody.linearVelocity.sqrMagnitude < _tuning.SettleVelocityThreshold * _tuning.SettleVelocityThreshold)
                EnterSettling();
        }

        private void TickSettling()
        {
            if (_activeProjectile == null) return;
            if (_activeProjectile.Rigidbody.linearVelocity.sqrMagnitude > 1f) { Enter(RunState.Flying); return; }
            _settleTimer += Time.deltaTime;
            if (_settleTimer >= _tuning.SettleHoldSeconds) EnterScoring();
        }

        // ---- Transitions ----
        private void EnterReady()
        {
            Enter(RunState.Ready);
            EventBus<CameraStateChanged>.Publish(new CameraStateChanged(CameraState.Aim));
            _launcher.PrepareForAim();
        }

        private void OnLaunchAiming(LaunchAiming evt)
        {
            if (_state == RunState.Ready) Enter(RunState.Aiming);
            if (_state == RunState.Aiming || _state == RunState.Charging) Enter(RunState.Charging);
        }

        private void OnLaunchCanceled(LaunchCanceled _)
        {
            if (_state is RunState.Aiming or RunState.Charging) EnterReady();
        }

        private void OnLaunchReleased(LaunchReleased evt)
        {
            if (_state is not (RunState.Aiming or RunState.Charging or RunState.Ready)) return;
            Enter(RunState.Released);

            _activeProjectile = _launcher.SpawnAndLaunch(_spawnPoint.position, evt.Impulse);
            _runStartTime = Time.time;
            _maxX = _spawnPoint.position.x;

            EventBus<RunStarted>.Publish(new RunStarted(
                _activeProjectile.Definition.Id,
                _launcher.CurrentLauncherId,
                "biome_current")); // biome resolved at scene level

            EventBus<CameraStateChanged>.Publish(new CameraStateChanged(CameraState.Flight));
            EventBus<SlowMoRequested>.Publish(new SlowMoRequested(0.6f, 0.2f));
            EventBus<ShakeRequested>.Publish(new ShakeRequested("Medium"));

            Enter(RunState.Flying);
        }

        private void EnterSettling()
        {
            Enter(RunState.Settling);
            _settleTimer = 0f;
            EventBus<CameraStateChanged>.Publish(new CameraStateChanged(CameraState.SlowMo));
            EventBus<SlowMoRequested>.Publish(new SlowMoRequested(0.4f, 0.5f));
        }

        private void EnterScoring()
        {
            Enter(RunState.Scoring);
            float duration = Time.time - _runStartTime;
            float distance = _maxX - _spawnPoint.position.x;

            EventBus<ProjectileSettled>.Publish(new ProjectileSettled(_activeProjectile.transform.position));
            EventBus<CameraStateChanged>.Publish(new CameraStateChanged(CameraState.EndRun));

            // Coins are computed by EconomyService listening to RunEnded.
            EventBus<RunEnded>.Publish(new RunEnded(distance, 0, _combo.PeakCombo, duration));

            StartCoroutine(GoToDecisionAfter(2.5f));
        }

        private IEnumerator GoToDecisionAfter(float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            Enter(RunState.Decision);
        }

        private void Enter(RunState next) => _state = next;

        // External API
        public void RestartRun()
        {
            if (_activeProjectile != null) _launcher.RecycleProjectile(_activeProjectile);
            _activeProjectile = null;
            _maxX = 0f;
            EnterReady();
        }
    }
}
