using Game.Data;
using NUnit.Framework;
using UnityEngine;

namespace Game.Tests
{
    public class UpgradeFormulasTests
    {
        [Test]
        public void Cost_Tier1_EqualsBase()
        {
            var def = ScriptableObject.CreateInstance<UpgradeTrackDefinition>();
            def.BaseCost = 100; def.CostGrowth = 1.18f;
            Assert.AreEqual(100, def.CostAtTier(1));
        }

        [Test]
        public void Cost_Tier10_MatchesDoc()
        {
            var def = ScriptableObject.CreateInstance<UpgradeTrackDefinition>();
            def.BaseCost = 100; def.CostGrowth = 1.18f;
            // 100 * 1.18^9 ≈ 459
            Assert.AreEqual(459, def.CostAtTier(10));
        }

        [Test]
        public void Effect_ScalesLinearly()
        {
            var def = ScriptableObject.CreateInstance<UpgradeTrackDefinition>();
            def.PerTierEffect = 0.03f;
            Assert.AreEqual(0.30f, def.EffectAtTier(10), 0.0001f);
        }
    }
}
