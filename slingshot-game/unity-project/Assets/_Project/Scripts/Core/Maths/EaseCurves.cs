using UnityEngine;

namespace Game.Core.Maths
{
    /// <summary>
    /// Branded easing curves — every animation in the game picks from here so motion language stays cohesive.
    /// </summary>
    public static class EaseCurves
    {
        public static float OutQuad(float t)    { t = Mathf.Clamp01(t); return 1f - (1f - t) * (1f - t); }
        public static float OutCubic(float t)   { t = Mathf.Clamp01(t); return 1f - Mathf.Pow(1f - t, 3f); }
        public static float OutQuart(float t)   { t = Mathf.Clamp01(t); return 1f - Mathf.Pow(1f - t, 4f); }
        public static float InQuart(float t)    { t = Mathf.Clamp01(t); return t * t * t * t; }

        public static float OutBack(float t, float overshoot = 1.70158f)
        {
            t = Mathf.Clamp01(t);
            float c1 = overshoot, c3 = c1 + 1f;
            float p = t - 1f;
            return 1f + c3 * p * p * p + c1 * p * p;
        }

        public static float OutElastic(float t)
        {
            const float c4 = (2f * Mathf.PI) / 3f;
            if (t <= 0f) return 0f;
            if (t >= 1f) return 1f;
            return Mathf.Pow(2f, -10f * t) * Mathf.Sin((t * 10f - 0.75f) * c4) + 1f;
        }

        public static float SineInOut(float t) { t = Mathf.Clamp01(t); return -(Mathf.Cos(Mathf.PI * t) - 1f) / 2f; }

        public static float Smooth(float a, float b, float t) => Mathf.Lerp(a, b, Mathf.SmoothStep(0f, 1f, Mathf.Clamp01(t)));
    }
}
