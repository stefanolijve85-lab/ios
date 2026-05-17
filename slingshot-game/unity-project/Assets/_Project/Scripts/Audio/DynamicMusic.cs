using System.Collections;
using UnityEngine;

namespace Game.Audio
{
    /// <summary>
    /// Crossfades 4 stems (drone / drums / hook / triumph) based on combo multiplier.
    /// </summary>
    public sealed class DynamicMusic : MonoBehaviour
    {
        [SerializeField] private AudioSource _drone;
        [SerializeField] private AudioSource _drums;
        [SerializeField] private AudioSource _hook;
        [SerializeField] private AudioSource _triumph;
        [SerializeField] private AudioClip[] _droneByBiome;
        [SerializeField] private AudioClip[] _drumsByBiome;
        [SerializeField] private AudioClip[] _hookByBiome;
        [SerializeField] private AudioClip[] _triumphByBiome;

        public void PlayBiomeStems(int biomeIndex = 0)
        {
            Play(_drone, _droneByBiome, biomeIndex, 1f);
            Play(_drums, _drumsByBiome, biomeIndex, 0f);
            Play(_hook, _hookByBiome, biomeIndex, 0f);
            Play(_triumph, _triumphByBiome, biomeIndex, 0f);
        }

        public void SetIntensity(float multiplier)
        {
            StopAllCoroutines();
            StartCoroutine(LerpVol(_drums, multiplier >= 2f ? 1f : 0f));
            StartCoroutine(LerpVol(_hook, multiplier >= 4f ? 1f : 0f));
            StartCoroutine(LerpVol(_triumph, multiplier >= 6f ? 1f : 0f));
        }

        private void Play(AudioSource src, AudioClip[] table, int idx, float volume)
        {
            if (src == null || table == null || table.Length == 0) return;
            src.clip = table[Mathf.Clamp(idx, 0, table.Length - 1)];
            src.loop = true;
            src.volume = volume;
            src.Play();
        }

        private IEnumerator LerpVol(AudioSource src, float target)
        {
            if (src == null) yield break;
            float start = src.volume;
            float t = 0f;
            const float dur = 0.6f;
            while (t < dur)
            {
                src.volume = Mathf.Lerp(start, target, t / dur);
                t += Time.unscaledDeltaTime;
                yield return null;
            }
            src.volume = target;
        }
    }
}
