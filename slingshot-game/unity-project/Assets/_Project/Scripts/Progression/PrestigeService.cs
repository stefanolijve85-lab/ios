using Game.Core;
using Game.Save;

namespace Game.Progression
{
    /// <summary>
    /// Soft-reset progression in exchange for a permanent multiplier. Eligibility = level 45+, launcher tier 4+.
    /// </summary>
    public sealed class PrestigeService
    {
        private readonly SaveService _save;

        public PrestigeService(SaveService save) { _save = save; }

        public bool IsEligible() => _save.Data.Level >= 45 && _save.Data.UnlockedLauncherIds.Contains("launcher_pneumatic");

        public bool TryPrestige()
        {
            if (!IsEligible()) return false;
            _save.Data.Level = 1;
            _save.Data.Xp = 0;
            _save.Data.Coins = 0;
            _save.Data.UpgradeTiers.Clear();
            _save.Data.PrestigeCount++;
            _save.MarkDirty();
            EventBus<PrestigeTriggered>.Publish(new PrestigeTriggered(_save.Data.PrestigeCount));
            return true;
        }
    }
}
