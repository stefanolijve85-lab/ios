using System.Reflection;
using Game.Combo;
using Game.Core;
using Game.Data;
using NUnit.Framework;
using UnityEngine;

namespace Game.Tests
{
    public class ComboServiceTests
    {
        private GameTuning _tuning;
        private ComboService _svc;
        private int _lastCombo;
        private float _lastMultiplier;

        [SetUp]
        public void Setup()
        {
            ClearBus<ComboChanged>();
            ClearBus<BounceOccurred>();
            ClearBus<RunStarted>();
            ClearBus<ProjectileSettled>();
            ClearBus<BoostTriggered>();
            ClearBus<RingPassed>();
            ClearBus<CriticalHit>();
            ClearBus<ComboBroken>();

            _tuning = ScriptableObject.CreateInstance<GameTuning>();
            _svc = new ComboService(_tuning);
            EventBus<ComboChanged>.Subscribe(e => { _lastCombo = e.Combo; _lastMultiplier = e.Multiplier; });
            EventBus<RunStarted>.Publish(new RunStarted("p", "l", "b"));
        }

        [Test]
        public void Multiplier_StartsAtOne()
        {
            Assert.AreEqual(0, _lastCombo);
            Assert.AreEqual(1f, _lastMultiplier);
        }

        [Test]
        public void Multiplier_StepsAtComboStep()
        {
            for (int i = 0; i < 4; i++)
                EventBus<BounceOccurred>.Publish(new BounceOccurred(Vector2.zero, 10f, "p", "ground"));
            Assert.AreEqual(4, _lastCombo);
            Assert.AreEqual(1.5f, _lastMultiplier, 0.01f);
        }

        [Test]
        public void Multiplier_CapsAtTen()
        {
            for (int i = 0; i < 200; i++)
                EventBus<BounceOccurred>.Publish(new BounceOccurred(Vector2.zero, 1, "p", "ground"));
            Assert.AreEqual(10f, _lastMultiplier);
        }

        private static void ClearBus<T>() where T : struct
        {
            var m = typeof(EventBus<T>).GetMethod("ClearAll", BindingFlags.Static | BindingFlags.NonPublic);
            m?.Invoke(null, null);
        }
    }
}
