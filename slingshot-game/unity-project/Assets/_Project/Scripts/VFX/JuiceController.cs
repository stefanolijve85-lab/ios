using Game.Core;
using UnityEngine;
using UnityEngine.UI;

namespace Game.VFX
{
    /// <summary>
    /// Compositions of "juice" effects triggered by gameplay events. Adds flash, hit-pause, decals, etc.
    /// </summary>
    public sealed class JuiceController : MonoBehaviour
    {
        [SerializeField] private Image _flashOverlay;
        [SerializeField] private float _flashDuration = 0.08f;

        private void OnEnable()
        {
            EventBus<LaunchReleased>.Subscribe(OnLaunch);
            EventBus<CriticalHit>.Subscribe(OnCrit);
        }

        private void OnDisable()
        {
            EventBus<LaunchReleased>.Unsubscribe(OnLaunch);
            EventBus<CriticalHit>.Unsubscribe(OnCrit);
        }

        private void OnLaunch(LaunchReleased _)  => Flash(Color.white, 0.4f);
        private void OnCrit(CriticalHit _)        { Flash(new Color(1, 0.2f, 0.2f, 0.6f), 0.6f); HitPause(2); }

        private void Flash(Color c, float alphaMax)
        {
            if (_flashOverlay == null) return;
            StopAllCoroutines();
            StartCoroutine(FlashRoutine(c, alphaMax));
        }

        private System.Collections.IEnumerator FlashRoutine(Color color, float alphaMax)
        {
            color.a = alphaMax;
            _flashOverlay.color = color;
            float t = 0;
            while (t < _flashDuration)
            {
                t += Time.unscaledDeltaTime;
                color.a = Mathf.Lerp(alphaMax, 0f, t / _flashDuration);
                _flashOverlay.color = color;
                yield return null;
            }
            color.a = 0; _flashOverlay.color = color;
        }

        private void HitPause(int frames)
        {
            StartCoroutine(HitPauseRoutine(frames));
        }

        private System.Collections.IEnumerator HitPauseRoutine(int frames)
        {
            float oldScale = Time.timeScale;
            Time.timeScale = 0f;
            for (int i = 0; i < frames; i++) yield return null;
            Time.timeScale = oldScale;
        }
    }
}
