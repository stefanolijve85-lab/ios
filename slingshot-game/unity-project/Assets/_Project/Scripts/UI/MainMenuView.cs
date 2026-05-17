using Game.Core;
using Game.Progression;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace Game.UI
{
    /// <summary>
    /// Main menu screen. Big LAUNCH button + secondary nav.
    /// </summary>
    public sealed class MainMenuView : MonoBehaviour
    {
        [SerializeField] private Button _launchButton;
        [SerializeField] private Button _upgradeButton;
        [SerializeField] private Button _shopButton;
        [SerializeField] private Button _missionsButton;
        [SerializeField] private Button _bpButton;
        [SerializeField] private Button _cosmeticsButton;
        [SerializeField] private Button _leaderboardsButton;
        [SerializeField] private TMP_Text _levelLabel;
        [SerializeField] private Slider _xpBar;
        [SerializeField] private TMP_Text _coinsLabel;
        [SerializeField] private TMP_Text _gemsLabel;

        private void OnEnable()
        {
            _launchButton.onClick.AddListener(LoadRunScene);
            EventBus<CurrencyChanged>.Subscribe(OnCurrencyChanged);
            EventBus<LeveledUp>.Subscribe(_ => RefreshLevel());
            RefreshLevel();
        }

        private void OnDisable()
        {
            _launchButton.onClick.RemoveAllListeners();
            EventBus<CurrencyChanged>.Unsubscribe(OnCurrencyChanged);
        }

        private void RefreshLevel()
        {
            if (!ServiceLocator.TryGet<ProgressionService>(out var prog)) return;
            _levelLabel.text = $"Level {prog.Level}";
            _xpBar.value = prog.ProgressToNext;
        }

        private void OnCurrencyChanged(CurrencyChanged evt)
        {
            if (evt.Currency == Currency.Coins) _coinsLabel.text = evt.NewAmount.ToString("N0");
            if (evt.Currency == Currency.Gems) _gemsLabel.text = evt.NewAmount.ToString("N0");
        }

        private void LoadRunScene()
        {
            // Additive load — meta stays in memory but is hidden via the canvas group, then unloaded if low-mem.
            SceneManager.LoadSceneAsync("Run", LoadSceneMode.Additive);
            SceneManager.UnloadSceneAsync("Meta");
        }
    }
}
