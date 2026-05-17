using Game.Core;
using Game.Save;
using UnityEngine;

namespace Game.Progression
{
    /// <summary>
    /// Player XP, level, level-up rewards. Curve: <c>xpForLevel(n) = 100 * n^1.45</c>.
    /// </summary>
    public sealed class ProgressionService
    {
        private readonly SaveService _save;

        public ProgressionService(SaveService save)
        {
            _save = save;
            EventBus<XpGained>.Subscribe(OnXpGained);
        }

        public int Level => _save.Data.Level;
        public long Xp => _save.Data.Xp;
        public long XpToNext => XpForLevel(_save.Data.Level + 1);
        public float ProgressToNext => Mathf.Clamp01((float)Xp / XpToNext);

        public static long XpForLevel(int n) => (long)Mathf.RoundToInt(100f * Mathf.Pow(n, 1.45f));

        private void OnXpGained(XpGained evt)
        {
            _save.Data.Xp += evt.Amount;
            while (_save.Data.Xp >= XpForLevel(_save.Data.Level + 1))
            {
                _save.Data.Xp -= XpForLevel(_save.Data.Level + 1);
                _save.Data.Level++;
                EventBus<LeveledUp>.Publish(new LeveledUp(_save.Data.Level));
            }
            _save.MarkDirty();
        }
    }
}
