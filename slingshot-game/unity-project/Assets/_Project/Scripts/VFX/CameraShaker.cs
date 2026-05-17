using System.Collections.Generic;
using Game.Core;
using Unity.Cinemachine;
using UnityEngine;

namespace Game.VFX
{
    /// <summary>
    /// Translates <see cref="ShakeRequested"/> events into Cinemachine Impulse signals via named profiles.
    /// </summary>
    public sealed class CameraShaker : MonoBehaviour
    {
        [System.Serializable]
        public struct Profile
        {
            public string Id;
            public float Amplitude;
            public float Frequency;
            public float Duration;
        }

        [SerializeField] private CinemachineImpulseSource _source;
        [SerializeField] private Profile[] _profiles;

        private readonly Dictionary<string, Profile> _byId = new();

        private void Awake()
        {
            foreach (var p in _profiles) _byId[p.Id] = p;
            EventBus<ShakeRequested>.Subscribe(OnShake);
        }

        private void OnDestroy() => EventBus<ShakeRequested>.Unsubscribe(OnShake);

        private void OnShake(ShakeRequested evt)
        {
            if (!_byId.TryGetValue(evt.ProfileId, out var p)) return;
            if (_source == null) return;
            _source.DefaultVelocity = new Vector3(p.Amplitude, p.Amplitude, 0);
            _source.ImpulseDefinition.ImpulseDuration = p.Duration;
            _source.GenerateImpulse();
        }
    }
}
