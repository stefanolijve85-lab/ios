using System.Collections.Generic;
using UnityEngine;

namespace Game.Audio
{
    /// <summary>
    /// Allocation-free SFX pool with named-id lookup. Designer drops clips into a named bank in the inspector.
    /// </summary>
    public sealed class SfxPlayer : MonoBehaviour
    {
        [System.Serializable]
        public struct Bank
        {
            public string Id;
            public AudioClip[] Clips;
            [Range(0, 1)] public float Volume;
            [Range(-3, 3)] public float MinPitch;
            [Range(-3, 3)] public float MaxPitch;
        }

        [SerializeField] private Bank[] _banks;
        [SerializeField] private int _voices = 12;

        private readonly Dictionary<string, Bank> _byId = new();
        private AudioSource[] _sources;
        private int _next;

        private void Awake()
        {
            foreach (var b in _banks) _byId[b.Id] = b;
            _sources = new AudioSource[_voices];
            for (int i = 0; i < _voices; i++)
            {
                var go = new GameObject("SFX_Voice_" + i);
                go.transform.SetParent(transform, false);
                _sources[i] = go.AddComponent<AudioSource>();
            }
        }

        public void PlayOneShot(string id)
        {
            if (!_byId.TryGetValue(id, out var bank) || bank.Clips == null || bank.Clips.Length == 0) return;
            var src = _sources[_next];
            _next = (_next + 1) % _sources.Length;
            src.clip = bank.Clips[Random.Range(0, bank.Clips.Length)];
            src.volume = bank.Volume <= 0 ? 1f : bank.Volume;
            src.pitch = bank.MaxPitch <= 0 ? 1f : Random.Range(bank.MinPitch, bank.MaxPitch);
            src.Play();
        }
    }
}
