using UnityEngine;

namespace Game.Data
{
    public enum LauncherTier { Wooden, Reinforced, Mechanical, Pneumatic, Military, Plasma }

    [CreateAssetMenu(menuName = "Game/Data/Launcher", fileName = "Launcher_New")]
    public sealed class LauncherDefinition : ScriptableObject
    {
        [Header("Identity")]
        public string Id = "launcher_wooden";
        public string DisplayName = "Wooden Slingshot";
        public LauncherTier Tier = LauncherTier.Wooden;
        public Sprite Icon;
        public GameObject Prefab;

        [Header("Stats")]
        [Tooltip("Multiplier on the base launch impulse.")]
        public float PowerMultiplier = 1.0f;
        [Tooltip("Angular jitter (degrees) on release.")]
        public float AccuracyJitter = 4f;
        [Tooltip("Seconds before next launch is possible after settle.")]
        public float ReloadSeconds = 1.4f;
        [Tooltip("Wobble factor on the rig animation.")]
        public float Stability = 0.5f;

        [Header("Special Traits")]
        public int BonusBoostTokens = 0;
        [Range(0, 0.25f)] public float DoubleLaunchChance = 0f;

        [Header("Unlock")]
        public int RequiredPlayerLevel = 1;
        public int CostCoins = 0;
        public int CostGems = 0;

        [Header("FX")]
        public AudioClip ReleaseSound;
        public GameObject ReleaseVfxPrefab;
    }
}
