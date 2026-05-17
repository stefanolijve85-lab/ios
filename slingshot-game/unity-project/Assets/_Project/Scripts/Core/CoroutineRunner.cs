using System.Collections;
using UnityEngine;

namespace Game.Core
{
    /// <summary>
    /// Allows pure-C# services (no MonoBehaviour) to run Unity coroutines via a shared host. Registered by Bootstrapper.
    /// </summary>
    public sealed class CoroutineRunner : MonoBehaviour
    {
        public Coroutine Run(IEnumerator routine) => StartCoroutine(routine);
        public void Stop(Coroutine routine) { if (routine != null) StopCoroutine(routine); }
    }
}
