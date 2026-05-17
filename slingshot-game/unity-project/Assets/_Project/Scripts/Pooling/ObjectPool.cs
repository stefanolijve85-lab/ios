using System.Collections.Generic;
using UnityEngine;

namespace Game.Pooling
{
    /// <summary>
    /// Generic, allocation-free GameObject pool. Designed for high-throughput effects (shards, coins, popups).
    /// Pre-warm during loading screens, never instantiate from hot paths.
    /// </summary>
    public sealed class ObjectPool<T> where T : Component
    {
        private readonly Stack<T> _stack;
        private readonly T _prefab;
        private readonly Transform _root;
        private readonly int _hardCap;

        public int CountInPool => _stack.Count;

        public ObjectPool(T prefab, int prewarm, Transform root, int hardCap = 256)
        {
            _prefab = prefab;
            _root = root;
            _hardCap = hardCap;
            _stack = new Stack<T>(capacity: prewarm);

            for (int i = 0; i < prewarm; i++)
            {
                var instance = Object.Instantiate(prefab, root);
                instance.gameObject.SetActive(false);
                _stack.Push(instance);
            }
        }

        public T Get()
        {
            T item;
            if (_stack.Count > 0)
                item = _stack.Pop();
            else
                item = Object.Instantiate(_prefab, _root);

            item.gameObject.SetActive(true);
            return item;
        }

        public T Get(Vector3 position, Quaternion rotation)
        {
            var item = Get();
            var tr = item.transform;
            tr.SetPositionAndRotation(position, rotation);
            return item;
        }

        public void Return(T item)
        {
            if (item == null) return;
            item.gameObject.SetActive(false);
            if (_stack.Count < _hardCap)
            {
                item.transform.SetParent(_root, false);
                _stack.Push(item);
            }
            else
            {
                // exceeded cap, free permanently
                Object.Destroy(item.gameObject);
            }
        }

        public void Clear()
        {
            while (_stack.Count > 0)
            {
                var go = _stack.Pop();
                if (go != null) Object.Destroy(go.gameObject);
            }
        }
    }
}
