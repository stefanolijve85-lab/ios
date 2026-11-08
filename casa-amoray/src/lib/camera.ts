import type { CameraKey } from "@/content/scenes";

const ease = (t: number) => t * t * (3 - 2 * t);

/** Zet een camerapad om in een CSS-transform voor voortgang p (0..1). */
export function cameraTransform(keys: CameraKey[] | undefined, p: number): string | null {
  if (!keys || keys.length === 0) return null;
  let a = keys[0];
  let b = keys[keys.length - 1];
  if (p <= a.at) b = a;
  else if (p >= b.at) a = b;
  else
    for (let i = 0; i < keys.length - 1; i++)
      if (p >= keys[i].at && p <= keys[i + 1].at) {
        a = keys[i];
        b = keys[i + 1];
        break;
      }
  const t = a === b ? 0 : ease((p - a.at) / (b.at - a.at));
  const lerp = (x = 0, y = 0) => x + (y - x) * t;
  const s = lerp(a.scale, b.scale);
  return `translate3d(${lerp(a.x, b.x).toFixed(3)}%, ${lerp(a.y, b.y).toFixed(3)}%, 0) scale(${s.toFixed(4)})`;
}
