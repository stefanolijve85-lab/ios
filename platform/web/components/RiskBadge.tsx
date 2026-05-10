import { bandTone } from "@/lib/format";
import type { RiskBand } from "@/lib/types";

export function RiskBadge({ band }: { band: RiskBand | null | undefined }) {
  const label = (band ?? "—").toString();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${bandTone(band)}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
