#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;

namespace Game.EditorTools.Validators
{
    /// <summary>
    /// Enforces the folder rules in docs/04-folder-structure.md. Logs (and optionally fails import) when
    /// scripts land in non-script folders.
    /// </summary>
    public sealed class FolderValidator : AssetPostprocessor
    {
        private static readonly HashSet<string> ScriptDisallowedRoots = new()
        {
            "Assets/_Project/Art",
            "Assets/_Project/Audio",
            "Assets/_Project/Prefabs",
            "Assets/_Project/Scenes",
        };

        private static void OnPostprocessAllAssets(
            string[] imported, string[] deleted, string[] moved, string[] movedFrom)
        {
            foreach (var path in imported)
            {
                if (!path.EndsWith(".cs")) continue;
                foreach (var bad in ScriptDisallowedRoots)
                {
                    if (path.StartsWith(bad))
                    {
                        UnityEngine.Debug.LogError(
                            $"[FolderValidator] Script '{path}' is in '{bad}'. " +
                            "Move it under Assets/_Project/Scripts/<feature>/");
                    }
                }
            }
        }
    }
}
#endif
