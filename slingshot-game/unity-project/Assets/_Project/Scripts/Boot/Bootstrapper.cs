using System.Collections;
using System.Collections.Generic;
using Game.Ads;
using Game.Analytics;
using Game.Audio;
using Game.Combo;
using Game.Core;
using Game.Data;
using Game.Economy;
using Game.Input;
using Game.Meta;
using Game.Physics;
using Game.Pooling;
using Game.Progression;
using Game.Save;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Game.Boot
{
    /// <summary>
    /// Single composition root. Lives in <c>Boot.unity</c>, registers every service into <see cref="ServiceLocator"/>,
    /// then loads the Meta scene additively. Survives via <c>DontDestroyOnLoad</c>.
    /// </summary>
    public sealed class Bootstrapper : MonoBehaviour
    {
        [Header("Data")]
        [SerializeField] private GameTuning _tuning;
        [SerializeField] private List<UpgradeTrackDefinition> _upgradeTracks;
        [SerializeField] private List<MissionDefinition> _missionCatalog;
        [SerializeField] private BattlePassSeason _activeSeason;

        [Header("Scenes")]
        [SerializeField] private string _firstScene = "Meta";

        private CoroutineRunner _coroutineRunner;
        private SaveService _save;

        private void Awake()
        {
            DontDestroyOnLoad(gameObject);
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            Physics2D.gravity = _tuning != null ? new Vector2(0, -25f) : Physics2D.gravity;
            Time.fixedDeltaTime = 1f / 60f;

            BuildAndRegisterServices();
            EventBus<GameBooted>.Publish(default);
            StartCoroutine(LoadFirstScene());
        }

        private void BuildAndRegisterServices()
        {
            // Core
            _coroutineRunner = gameObject.AddComponent<CoroutineRunner>();
            ServiceLocator.Register(_coroutineRunner);
            ServiceLocator.Register(_tuning);

            // Save & Cloud
            _save = new SaveService();
            ServiceLocator.Register(_save);
            ServiceLocator.Register(new CloudSync(_save));

            // Pooling
            var poolRoot = new GameObject("__Pools__").transform;
            DontDestroyOnLoad(poolRoot.gameObject);
            ServiceLocator.Register(new PoolService(poolRoot));

            // Economy
            var currency = new CurrencyService(_save);
            ServiceLocator.Register(currency);
            ServiceLocator.Register(new ShopService(_save, currency));
            ServiceLocator.Register(new CrateService(_save, currency, _tuning));
            ServiceLocator.Register(new RunRewardCalculator(_tuning, currency, _save));

            // Progression
            var progression = new ProgressionService(_save);
            ServiceLocator.Register(progression);
            var upgrades = new UpgradeService(_save, currency, _upgradeTracks);
            ServiceLocator.Register(upgrades);
            ServiceLocator.Register(new PrestigeService(_save));
            var bp = new BattlePassService(_save, _tuning);
            bp.SetActiveSeason(_activeSeason);
            ServiceLocator.Register(bp);

            // Meta
            ServiceLocator.Register(new MissionService(_save, currency, bp, _missionCatalog));
            ServiceLocator.Register(new AchievementService(_save));
            ServiceLocator.Register(new DailyRewardService(_save, currency));

            // Physics
            ServiceLocator.Register(new SlowMotionService(_coroutineRunner, _tuning));

            // Combo
            ServiceLocator.Register(new ComboService(_tuning));

            // Input
            ServiceLocator.Register(new HapticService { Enabled = _save.Data.Settings.HapticsEnabled });

            // Ads
            ServiceLocator.Register(new AdService());

            // Analytics
            ServiceLocator.Register(new AnalyticsService(new NullAnalyticsAdapter()));
        }

        private IEnumerator LoadFirstScene()
        {
            var op = SceneManager.LoadSceneAsync(_firstScene, LoadSceneMode.Additive);
            while (!op.isDone) yield return null;
            EventBus<MetaSceneReady>.Publish(default);
        }

        private void Update()
        {
            _save.Tick();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) _save.SaveSync();
        }
    }
}
