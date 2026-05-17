using System.Diagnostics;
using UnityEngine;

namespace Game.Core
{
    /// <summary>
    /// Lightweight logger that strips Verbose/Info in release builds (no string allocation cost).
    /// </summary>
    public static class Logger
    {
        [Conditional("UNITY_EDITOR"), Conditional("DEVELOPMENT_BUILD")]
        public static void Info(string msg) => UnityEngine.Debug.Log(msg);

        [Conditional("UNITY_EDITOR"), Conditional("DEVELOPMENT_BUILD")]
        public static void Warn(string msg) => UnityEngine.Debug.LogWarning(msg);

        public static void Error(string msg) => UnityEngine.Debug.LogError(msg);

        [Conditional("UNITY_EDITOR")]
        public static void Verbose(string msg) => UnityEngine.Debug.Log("[VRB] " + msg);
    }
}
