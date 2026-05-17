using Game.Core;
using UnityEngine;

#if UNITY_IOS
using UnityEngine.iOS;
#endif

namespace Game.Input
{
    public enum HapticStyle { Selection, Light, Medium, Heavy, Soft, Success, Warning, Error }

    /// <summary>
    /// Cross-platform haptic abstraction. iOS uses UIImpactFeedbackGenerator equivalents, Android uses VibrationEffects.
    /// </summary>
    public sealed class HapticService
    {
        public bool Enabled { get; set; } = true;

        public void Play(HapticStyle style)
        {
            if (!Enabled) return;
#if UNITY_IOS && !UNITY_EDITOR
            switch (style)
            {
                case HapticStyle.Selection: Device.SystemHaptic(Device.SystemHapticType.SelectionChange); break;
                case HapticStyle.Light:     Device.SystemHaptic(Device.SystemHapticType.ImpactLight);     break;
                case HapticStyle.Medium:    Device.SystemHaptic(Device.SystemHapticType.ImpactMedium);    break;
                case HapticStyle.Heavy:     Device.SystemHaptic(Device.SystemHapticType.ImpactHeavy);     break;
                case HapticStyle.Soft:      Device.SystemHaptic(Device.SystemHapticType.ImpactSoft);      break;
                case HapticStyle.Success:   Device.SystemHaptic(Device.SystemHapticType.NotificationSuccess); break;
                case HapticStyle.Warning:   Device.SystemHaptic(Device.SystemHapticType.NotificationWarning); break;
                case HapticStyle.Error:     Device.SystemHaptic(Device.SystemHapticType.NotificationError);   break;
            }
#elif UNITY_ANDROID && !UNITY_EDITOR
            // Real impl: use AndroidJavaObject to invoke Vibrator.vibrate(VibrationEffect)
            Handheld.Vibrate();
#else
            Logger.Verbose($"[Haptic] {style}");
#endif
        }
    }
}
