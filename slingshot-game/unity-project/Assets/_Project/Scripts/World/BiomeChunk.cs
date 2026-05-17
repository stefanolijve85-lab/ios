using UnityEngine;

namespace Game.World
{
    /// <summary>
    /// Tagged root of a streamed biome chunk. Provides bookkeeping for streamer + obstacle activation profile.
    /// </summary>
    public sealed class BiomeChunk : MonoBehaviour
    {
        public enum Difficulty { Easy, Medium, Hard, Boss }

        [SerializeField] private Difficulty _difficulty = Difficulty.Easy;
        [SerializeField] private float _length = 60f;

        public Difficulty Tier => _difficulty;
        public float Length => _length;
    }
}
