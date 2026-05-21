import type { RiskBand } from "./types";

export function money(cents: number | null | undefined, currency = "EUR"): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-EU", { style: "currency", currency }).format(cents / 100);
}

export function band(score: number | null | undefined): RiskBand {
  if (score == null) return "medium";
  if (score >= 90) return "trusted";
  if (score >= 75) return "low";
  if (score >= 55) return "medium";
  if (score >= 35) return "suspicious";
  if (score >= 15) return "high";
  return "critical";
}

export function bandTone(b: RiskBand | null | undefined): string {
  switch (b) {
    case "trusted": return "bg-accent-100 text-accent-800 ring-accent-200";
    case "low":     return "bg-accent-50 text-accent-700 ring-accent-200";
    case "medium":  return "bg-amber-50 text-amber-700 ring-amber-200";
    case "suspicious":
    case "high":    return "bg-orange-50 text-orange-700 ring-orange-200";
    case "critical":return "bg-red-50 text-red-700 ring-red-200";
    default:        return "bg-ink-100 text-ink-700 ring-ink-200";
  }
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString();
}
