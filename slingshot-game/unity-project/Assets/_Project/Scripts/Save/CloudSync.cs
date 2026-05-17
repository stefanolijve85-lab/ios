using System;
using System.Threading.Tasks;
using Game.Core;

namespace Game.Save
{
    /// <summary>
    /// Thin wrapper over Unity Cloud Save. Conflict resolution: max() for currencies,
    /// set-union for cosmetic ids, last-write for settings, server-side authoritative for IAP-derived state.
    /// </summary>
    public sealed class CloudSync
    {
        private readonly SaveService _save;
        private DateTime _lastPush = DateTime.MinValue;
        private static readonly TimeSpan PushThrottle = TimeSpan.FromSeconds(5);

        public CloudSync(SaveService save)
        {
            _save = save;
            _save.OnSaved += QueuePush;
        }

        public void Dispose() { _save.OnSaved -= QueuePush; }

        private async void QueuePush()
        {
            if (DateTime.UtcNow - _lastPush < PushThrottle) return;
            _lastPush = DateTime.UtcNow;
            try { await PushAsync(); }
            catch (Exception e) { Logger.Error($"CloudSync push failed: {e}"); }
        }

        public Task PushAsync()
        {
            // Real impl: Unity Services CloudSaveService.Instance.Data.SaveAsync(dict, opts)
            // Stubbed here to keep the scaffolding compile-clean without the SDK.
            return Task.CompletedTask;
        }

        public Task<bool> PullAndMergeAsync()
        {
            // Real impl: pull remote, merge per-key, write local through SaveService.
            return Task.FromResult(false);
        }
    }
}
