using System;
using System.Collections.Generic;

namespace Game.Core
{
    /// <summary>
    /// Minimal service locator. Register from Bootstrapper, resolve from anywhere. Not thread-safe by design — Unity
    /// runs services on the main thread. For testing, call <see cref="Reset"/> between tests and inject fakes.
    /// </summary>
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> _map = new(capacity: 32);

        public static void Register<T>(T service) where T : class
        {
            if (service == null) throw new ArgumentNullException(nameof(service));
            _map[typeof(T)] = service;
        }

        public static T Get<T>() where T : class
        {
            if (_map.TryGetValue(typeof(T), out var v)) return (T)v;
            throw new InvalidOperationException($"Service '{typeof(T).Name}' not registered. Did Bootstrapper run?");
        }

        public static bool TryGet<T>(out T service) where T : class
        {
            if (_map.TryGetValue(typeof(T), out var v)) { service = (T)v; return true; }
            service = null;
            return false;
        }

        public static void Reset() => _map.Clear();
    }
}
