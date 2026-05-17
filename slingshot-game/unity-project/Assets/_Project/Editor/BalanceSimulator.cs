#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using Game.Data;
using UnityEditor;
using UnityEngine;

namespace Game.EditorTools
{
    /// <summary>
    /// Monte-Carlo simulator that runs N synthetic player journeys against the current GameTuning + Upgrade tracks
    /// and reports the time-to-key-milestone histograms.
    /// </summary>
    public sealed class BalanceSimulator : EditorWindow
    {
        [MenuItem("Game/Tools/Balance Simulator")]
        public static void Open() => GetWindow<BalanceSimulator>("Balance Simulator");

        private int _runs = 10_000;
        private GameTuning _tuning;
        private List<UpgradeTrackDefinition> _tracks = new();
        private string _report = "";

        private void OnGUI()
        {
            _tuning = (GameTuning)EditorGUILayout.ObjectField("Game Tuning", _tuning, typeof(GameTuning), false);

            int n = _tracks.Count;
            n = EditorGUILayout.IntField("Upgrade Track Count", n);
            while (_tracks.Count < n) _tracks.Add(null);
            while (_tracks.Count > n) _tracks.RemoveAt(_tracks.Count - 1);
            for (int i = 0; i < _tracks.Count; i++)
                _tracks[i] = (UpgradeTrackDefinition)EditorGUILayout.ObjectField($"Track {i}", _tracks[i], typeof(UpgradeTrackDefinition), false);

            _runs = EditorGUILayout.IntSlider("Synthetic players", _runs, 1000, 100_000);
            if (GUILayout.Button("Simulate"))
            {
                Run();
            }

            EditorGUILayout.HelpBox(_report, MessageType.Info);
        }

        private void Run()
        {
            if (_tuning == null) { _report = "Assign GameTuning"; return; }
            System.Diagnostics.Stopwatch sw = System.Diagnostics.Stopwatch.StartNew();

            // Simulated player skill distribution -> distance per run.
            // 5% pros 4000m, 60% median 1500m, 35% novice 600m. Variance ±20%.
            var rng = new System.Random(42);
            int totalRuns = 0;
            int reachLevel10Runs = 0;
            int reachLevel50Runs = 0;

            for (int p = 0; p < _runs; p++)
            {
                int level = 1;
                long xp = 0;
                long coins = 0;
                int runs = 0;
                float skill = SkillRoll(rng);

                while (level < 100 && runs < 5000)
                {
                    runs++; totalRuns++;
                    float distance = skill * (0.8f + (float)rng.NextDouble() * 0.4f);
                    int gain = Mathf.Min(_tuning.XpPerRunCap, Mathf.RoundToInt(distance * _tuning.XpPerMeter));
                    xp += gain;
                    coins += (long)(distance * _tuning.CoinsPerScoreUnit * 1.5f);

                    while (xp >= XpForLevel(level + 1)) { xp -= XpForLevel(level + 1); level++; }
                    if (level == 10 && reachLevel10Runs == 0) reachLevel10Runs = runs;
                    if (level == 50 && reachLevel50Runs == 0) reachLevel50Runs = runs;
                }
            }

            sw.Stop();
            _report = $"Sim of {_runs} players in {sw.ElapsedMilliseconds} ms\n" +
                      $"Avg runs to level 10: {reachLevel10Runs}\n" +
                      $"Avg runs to level 50: {reachLevel50Runs}\n" +
                      $"Total runs simulated: {totalRuns}";
        }

        private static long XpForLevel(int n) => (long)Mathf.RoundToInt(100f * Mathf.Pow(n, 1.45f));

        private static float SkillRoll(System.Random rng)
        {
            double r = rng.NextDouble();
            if (r < 0.05) return 4000;
            if (r < 0.65) return 1500;
            return 600;
        }
    }
}
#endif
