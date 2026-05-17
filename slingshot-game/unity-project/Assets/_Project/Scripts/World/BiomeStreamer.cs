using System.Collections.Generic;
using Game.Core;
using Game.Data;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

namespace Game.World
{
    /// <summary>
    /// Loads biome chunks via Addressables ahead of the projectile and unloads passed chunks. Maintains a sliding
    /// 3-chunk window: current, next, and a recycled previous (kept until projectile fully clears).
    /// </summary>
    public sealed class BiomeStreamer : MonoBehaviour
    {
        [SerializeField] private BiomeDefinition _biome;
        [SerializeField] private Transform _projectileTracker;
        [SerializeField] private float _chunkWidth = 60f;

        private readonly Queue<GameObject> _active = new();
        private int _nextChunkIndex;
        private float _spawnFrontier;

        private void Start() => SpawnInitial();

        private void Update()
        {
            if (_projectileTracker == null) return;
            float playerX = _projectileTracker.position.x;

            // Spawn ahead.
            while (_spawnFrontier < playerX + _chunkWidth * 2)
            {
                SpawnNextChunk();
            }

            // Despawn far behind.
            while (_active.Count > 0)
            {
                var first = _active.Peek();
                if (first == null) { _active.Dequeue(); continue; }
                if (first.transform.position.x + _chunkWidth < playerX - _chunkWidth * 1.5f)
                {
                    var dead = _active.Dequeue();
                    Addressables.ReleaseInstance(dead);
                }
                else break;
            }
        }

        private void SpawnInitial()
        {
            _spawnFrontier = 0f;
            for (int i = 0; i < 3; i++) SpawnNextChunk();
        }

        private void SpawnNextChunk()
        {
            if (_biome.ChunkAddresses == null || _biome.ChunkAddresses.Length == 0) return;
            string address = _biome.ChunkAddresses[_nextChunkIndex % _biome.ChunkAddresses.Length];
            var op = Addressables.InstantiateAsync(address, new Vector3(_spawnFrontier, 0, 0), Quaternion.identity, transform);
            op.Completed += OnChunkLoaded;
            _spawnFrontier += _chunkWidth;
            _nextChunkIndex++;
        }

        private void OnChunkLoaded(AsyncOperationHandle<GameObject> op)
        {
            if (op.Status != AsyncOperationStatus.Succeeded) { Logger.Error("Chunk failed to load"); return; }
            _active.Enqueue(op.Result);
        }
    }
}
