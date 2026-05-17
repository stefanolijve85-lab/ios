using UnityEngine;

namespace Game.Data
{
    public enum ProjectileTier { Common, Uncommon, Rare, Epic, Legendary }
    public enum ProjectileFamily { Fruit, Sport, Heavy, Explosive, Novelty, Fantasy, Cosmic }

    /// <summary>
    /// Every launchable object is described by one of these. Designer-authored, no code changes needed for new items.
    /// </summary>
    [CreateAssetMenu(menuName = "Game/Data/Projectile", fileName = "Projectile_New")]
    public sealed class ProjectileDefinition : ScriptableObject
    {
        [Header("Identity")]
        public string Id = "tennis_ball";
        public string DisplayName = "Tennis Ball";
        public ProjectileTier Tier = ProjectileTier.Common;
        public ProjectileFamily Family = ProjectileFamily.Sport;
        public Sprite Icon;
        public GameObject Prefab;            // pooled at run start
        public GameObject TrailPrefab;
        public AudioClip[] ImpactClipsSoft;
        public AudioClip[] ImpactClipsMedium;
        public AudioClip[] ImpactClipsCrit;

        [Header("Physics")]
        public float Mass = 0.06f;           // kg
        public float Bounciness = 0.85f;     // 0..1
        public float Friction = 0.45f;       // 0..1
        public float DragCoefficient = 0.42f; // unitless, drives custom aero
        public float CrossSectionArea = 0.05f; // m^2

        [Header("Ability")]
        public string AbilityId = "";         // empty => no ability
        public float AbilityCooldown = 0f;
        public Sprite AbilityIcon;

        [Header("Unlock")]
        public int RequiredPlayerLevel = 1;
        public bool UnlockedByDefault = false;

        [Header("Telemetry")]
        public string AnalyticsId => Id;
    }
}
