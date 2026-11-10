"use client";
import { flags } from "@/config/site";

/**
 * Analytics-events zonder persoonsgegevens. Er is nog geen provider gekoppeld:
 * events worden alleen doorgegeven als analytics is ingeschakeld in de
 * configuratie én de bezoeker toestemming gaf (localStorage 'bw-consent' = 'ja').
 */
export type EventName = "cta_click" | "example_view" | "form_start" | "request_success" | "purchase_confirmed";
type Props = { location?: string; project?: string; step?: string; withNameLogo?: boolean };

export function track(name: EventName, props: Props = {}) {
  if (!flags.analyticsEnabled || typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem("bw-consent") !== "ja") return;
  } catch {
    return;
  }
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event: name, ...props });
}
