using UnityEngine;

namespace Game.VFX
{
    /// <summary>
    /// Drives a sprite's <c>_FlashAmount</c> material parameter on impact for the white-out flash effect.
    /// </summary>
    public sealed class HitFlash : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _sprite;
        [SerializeField] private float _duration = 0.08f;
        private MaterialPropertyBlock _mpb;
        private static readonly int FlashAmount = Shader.PropertyToID("_FlashAmount");
        private float _timer;

        private void Awake() { _mpb = new MaterialPropertyBlock(); }

        public void Flash()
        {
            _timer = _duration;
            _mpb.SetFloat(FlashAmount, 1f);
            _sprite.SetPropertyBlock(_mpb);
        }

        private void Update()
        {
            if (_timer <= 0) return;
            _timer -= Time.deltaTime;
            float amt = Mathf.Clamp01(_timer / _duration);
            _mpb.SetFloat(FlashAmount, amt);
            _sprite.SetPropertyBlock(_mpb);
        }
    }
}
