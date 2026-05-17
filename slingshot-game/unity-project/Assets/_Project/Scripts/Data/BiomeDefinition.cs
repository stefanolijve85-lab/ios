using UnityEngine;

namespace Game.Data
{
    [CreateAssetMenu(menuName = "Game/Data/Biome", fileName = "Biome_New")]
    public sealed class BiomeDefinition : ScriptableObject
    {
        [Header("Identity")]
        public string Id = "backyard";
        public string DisplayName = "Backyard Suburb";
        public Sprite Banner;

        [Header("Scene Streaming")]
        public string SceneAddress = "Biome_Backyard";   // Addressables key
        public string[] ChunkAddresses;                   // Addressables for biome chunks

        [Header("Physics Modifiers")]
        public Vector2 GravityOverride = new(0, -25f);
        [Range(0f, 2f)] public float GlobalFrictionMul = 1f;
        [Range(0f, 2f)] public float GlobalDragMul = 1f;
        public Vector2 AmbientWindForce = Vector2.zero;
        [Range(0f, 1f)] public float HazardChanceBoost = 0f;

        [Header("Audio / Lighting")]
        public AudioClip MusicStemDrone;
        public AudioClip MusicStemDrums;
        public AudioClip MusicStemHook;
        public AudioClip MusicStemTriumph;
        public AudioClip AmbienceLoop;
        public Color SkyColor = new Color(0.66f, 0.85f, 0.93f);
        public Color HorizonColor = new Color(0.94f, 0.88f, 0.80f);

        [Header("Unlock")]
        public int RequiredPlayerLevel = 1;
    }
}
