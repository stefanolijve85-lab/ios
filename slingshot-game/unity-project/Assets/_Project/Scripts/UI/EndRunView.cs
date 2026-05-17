using System.Collections;
using Game.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Game.UI
{
    /// <summary>
    /// End-of-run card. Plays the dopamine sequence: emotional payoff → numbers → reward → CTA.
    /// </summary>
    public sealed class EndRunView : MonoBehaviour
    {
        [SerializeField] private CanvasGroup _root;
        [SerializeField] private TMP_Text _distanceLabel;
        [SerializeField] private TMP_Text _peakComboLabel;
        [SerializeField] private TMP_Text _bouncesLabel;
        [SerializeField] private TMP_Text _coinsLabel;
        [SerializeField] private TMP_Text _newPbBanner;
        [SerializeField] private Button _watchAdButton;
        [SerializeField] private Button _launchAgainButton;
        [SerializeField] private Button _upgradeButton;
        [SerializeField] private Button _shopButton;
        [SerializeField] private Button _exitButton;

        private void OnEnable()
        {
            _root.alpha = 0;
            _root.blocksRaycasts = false;
            EventBus<RunEnded>.Subscribe(OnRunEnded);
            _watchAdButton.onClick.AddListener(() => EventBus<AdRequested>.Publish(new AdRequested("rv_double_coins")));
            _launchAgainButton.onClick.AddListener(Hide);
        }

        private void OnDisable()
        {
            EventBus<RunEnded>.Unsubscribe(OnRunEnded);
            _watchAdButton.onClick.RemoveAllListeners();
            _launchAgainButton.onClick.RemoveAllListeners();
        }

        private void OnRunEnded(RunEnded evt)
        {
            StopAllCoroutines();
            StartCoroutine(Show(evt));
        }

        private IEnumerator Show(RunEnded evt)
        {
            yield return new WaitForSecondsRealtime(1.0f);   // wait for scoring camera to settle
            _root.alpha = 1;
            _root.blocksRaycasts = true;

            // Animate distance.
            float t = 0;
            const float dur = 1.2f;
            while (t < dur)
            {
                t += Time.unscaledDeltaTime;
                float val = Mathf.Lerp(0, evt.Distance, t / dur);
                _distanceLabel.text = Mathf.RoundToInt(val).ToString("N0") + " m";
                yield return null;
            }

            _peakComboLabel.text = "x" + evt.PeakCombo;
            _bouncesLabel.text   = evt.PeakCombo.ToString();
            _coinsLabel.text     = evt.Coins.ToString("N0");

            // New PB banner toggles if BestDistanceCm matches what we just did.
            _newPbBanner.gameObject.SetActive(true);
        }

        private void Hide()
        {
            _root.alpha = 0;
            _root.blocksRaycasts = false;
            // Notify RunController to restart
        }
    }
}
