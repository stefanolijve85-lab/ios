import clsx from "clsx";
import { band, bandTone } from "@/lib/format";

export function TrustScoreRing({
  score,
  size = 96,
}: {
  score: number | null | undefined;
  size?: number;
}) {
  const v = Math.max(0, Math.min(100, score ?? 0));
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  const b = band(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor" strokeWidth={6}
          className="text-ink-100 dark:text-ink-800"
          fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor" strokeWidth={6}
          className={clsx("transition-[stroke-dashoffset]",
            b === "trusted" && "text-accent-500",
            b === "low" && "text-accent-500",
            b === "medium" && "text-amber-500",
            (b === "suspicious" || b === "high") && "text-orange-500",
            b === "critical" && "text-red-500",
          )}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xl font-semibold tabular-nums">{score ?? "—"}</div>
          <div className={`mt-0.5 text-[10px] font-medium uppercase tracking-wide rounded px-1.5 py-0.5 ring-1 ring-inset ${bandTone(b)}`}>
            {b}
          </div>
        </div>
      </div>
    </div>
  );
}
