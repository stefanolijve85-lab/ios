#if UNITY_EDITOR
using System.IO;
using System.Text;
using Game.Data;
using UnityEditor;
using UnityEngine;

namespace Game.EditorTools.Tools
{
    /// <summary>
    /// Exports the active GameTuning ScriptableObject into a JSON file ready to paste into Unity Remote Config.
    /// Keeps designers' source-of-truth (the SO) in sync with live ops.
    /// </summary>
    public static class RemoteConfigKeyExporter
    {
        [MenuItem("Game/Tools/Export Remote Config")]
        public static void Export()
        {
            string[] guids = AssetDatabase.FindAssets("t:GameTuning");
            if (guids.Length == 0) { Debug.LogError("No GameTuning found"); return; }
            var tuning = AssetDatabase.LoadAssetAtPath<GameTuning>(AssetDatabase.GUIDToAssetPath(guids[0]));

            var sb = new StringBuilder();
            sb.AppendLine("{");
            sb.AppendLine($"  \"baseImpulse\": {tuning.BaseImpulse},");
            sb.AppendLine($"  \"maxDragMagnitude\": {tuning.MaxDragMagnitude},");
            sb.AppendLine($"  \"comboStep\": {tuning.ComboStep},");
            sb.AppendLine($"  \"multiplierStep\": {tuning.MultiplierStep},");
            sb.AppendLine($"  \"multiplierCap\": {tuning.MultiplierCap},");
            sb.AppendLine($"  \"comboDecaySeconds\": {tuning.ComboDecaySeconds},");
            sb.AppendLine($"  \"boostWindowSeconds\": {tuning.BoostWindowSeconds},");
            sb.AppendLine($"  \"coinsPerScoreUnit\": {tuning.CoinsPerScoreUnit},");
            sb.AppendLine($"  \"prestigeMultPerLevel\": {tuning.PrestigeMultiplierPerLevel},");
            sb.AppendLine($"  \"baseObstacleDensity\": {tuning.BaseObstacleDensity},");
            sb.AppendLine($"  \"densityIncreasePerPhase\": {tuning.DensityIncreasePerPhase},");
            sb.AppendLine($"  \"cratesPityThreshold\": {tuning.CratesWithoutEpicBeforePity}");
            sb.AppendLine("}");

            string output = Path.Combine(Application.dataPath, "../RemoteConfig.json");
            File.WriteAllText(output, sb.ToString());
            Debug.Log("Exported to " + output);
            AssetDatabase.Refresh();
        }
    }
}
#endif
