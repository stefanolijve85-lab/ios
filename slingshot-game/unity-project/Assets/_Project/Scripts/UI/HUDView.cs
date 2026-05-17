using System.Text;
using Game.Core;
using Game.Gameplay;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Game.UI
{
    /// <summary>
    /// In-run HUD. Reads gameplay events (no polling) and tweens labels in place.
    /// </summary>
    public sealed class HUDView : MonoBehaviour
    {
        [SerializeField] private TMP_Text _multiplierLabel;
        [SerializeField] private TMP_Text _distanceLabel;
        [SerializeField] private TMP_Text _coinLabel;
        [SerializeField] private RunController _run;
        [SerializeField] private Button _boostButton;
        [SerializeField] private Button _pauseButton;
        [SerializeField] private RectTransform _comboPunchTarget;

        private readonly StringBuilder _sb = new(16);
        private float _displayedDistance;
        private long _displayedCoins;

        private void OnEnable()
        {
            EventBus<ComboChanged>.Subscribe(OnComboChanged);
            EventBus<CurrencyChanged>.Subscribe(OnCurrencyChanged);
            _boostButton.onClick.AddListener(() => EventBus<BoostTriggered>.Publish(new BoostTriggered(Vector2.right, 1.25f)));
            _pauseButton.onClick.AddListener(() => Time.timeScale = Time.timeScale == 0 ? 1 : 0);
        }

        private void OnDisable()
        {
            EventBus<ComboChanged>.Unsubscribe(OnComboChanged);
            EventBus<CurrencyChanged>.Unsubscribe(OnCurrencyChanged);
            _boostButton.onClick.RemoveAllListeners();
            _pauseButton.onClick.RemoveAllListeners();
        }

        private void Update()
        {
            // Distance ticks toward live value for smooth read.
            _displayedDistance = Mathf.Lerp(_displayedDistance, _run.CurrentDistance, 0.4f);
            _sb.Length = 0; _sb.Append(Mathf.RoundToInt(_displayedDistance)); _sb.Append(" m");
            _distanceLabel.SetText(_sb);
        }

        private void OnComboChanged(ComboChanged evt)
        {
            _sb.Length = 0; _sb.Append('x'); _sb.Append(evt.Multiplier.ToString("0.0"));
            _multiplierLabel.SetText(_sb);

            if (_comboPunchTarget != null)
            {
                _comboPunchTarget.localScale = Vector3.one * 1.4f;
                // Decay back via Update interpolation.
            }
        }

        private void OnCurrencyChanged(CurrencyChanged evt)
        {
            if (evt.Currency != Currency.Coins) return;
            _displayedCoins = evt.NewAmount;
            _sb.Length = 0; _sb.Append("+"); _sb.Append(evt.Delta);
            _coinLabel.SetText(_sb);
        }

        private void LateUpdate()
        {
            if (_comboPunchTarget != null)
                _comboPunchTarget.localScale = Vector3.Lerp(_comboPunchTarget.localScale, Vector3.one, 0.2f);
        }
    }
}
