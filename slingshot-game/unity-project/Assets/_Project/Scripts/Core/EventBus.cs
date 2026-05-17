using System;
using System.Collections.Generic;

namespace Game.Core
{
    /// <summary>
    /// Strongly-typed, zero-GC event bus. One <see cref="EventBus{T}"/> per event type.
    /// Subscribers register on enable and must unregister on disable to avoid leaks.
    /// </summary>
    public static class EventBus<T> where T : struct
    {
        private static readonly List<Action<T>> _subs = new(capacity: 16);

        public static void Subscribe(Action<T> handler)
        {
            if (handler == null) throw new ArgumentNullException(nameof(handler));
            _subs.Add(handler);
        }

        public static void Unsubscribe(Action<T> handler)
        {
            // Linear scan is fine - subscriber counts stay tiny (under ~20 per event).
            for (int i = _subs.Count - 1; i >= 0; i--)
            {
                if (_subs[i] == handler) { _subs.RemoveAt(i); return; }
            }
        }

        public static void Publish(in T evt)
        {
            // Iterate snapshot length to allow unsubscribe-during-iterate safely.
            int n = _subs.Count;
            for (int i = 0; i < n && i < _subs.Count; i++)
            {
                try { _subs[i](evt); }
                catch (Exception e) { Logger.Error($"EventBus<{typeof(T).Name}> handler threw: {e}"); }
            }
        }

        // Test hook only.
        internal static void ClearAll() => _subs.Clear();
    }
}
