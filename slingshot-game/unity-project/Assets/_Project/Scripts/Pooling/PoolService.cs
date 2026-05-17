using System.Collections.Generic;
using UnityEngine;

namespace Game.Pooling
{
    /// <summary>
    /// Indexed registry of pools by prefab. Designers drop prefabs in editor and we pool them on first use.
    /// </summary>
    public sealed class PoolService
    {
        private readonly Dictionary<int, ObjectPool<Component>> _pools = new();
        private readonly Transform _root;

        public PoolService(Transform root) { _root = root; }

        public T Spawn<T>(T prefab, Vector3 pos, Quaternion rot, int prewarm = 8) where T : Component
        {
            int key = prefab.GetInstanceID();
            if (!_pools.TryGetValue(key, out var pool))
            {
                pool = new ObjectPool<Component>(prefab, prewarm, _root);
                _pools[key] = pool;
            }
            return (T)pool.Get(pos, rot);
        }

        public void Despawn<T>(T prefab, T instance) where T : Component
        {
            int key = prefab.GetInstanceID();
            if (_pools.TryGetValue(key, out var pool)) pool.Return(instance);
            else Object.Destroy(instance.gameObject);
        }

        public void ClearAll()
        {
            foreach (var p in _pools.Values) p.Clear();
            _pools.Clear();
        }
    }
}
