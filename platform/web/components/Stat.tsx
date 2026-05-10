import clsx from "clsx";

export function Stat({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const toneClass = {
    default: "text-ink-900 dark:text-ink-50",
    good: "text-accent-600",
    warn: "text-amber-600",
    danger: "text-red-600",
  }[tone];

  return (
    <div className="card p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className={clsx("mt-2 text-3xl font-semibold tabular-nums", toneClass)}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-ink-500">{sublabel}</div>}
    </div>
  );
}
