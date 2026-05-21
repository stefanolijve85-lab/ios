import { cookies } from "next/headers";
import type {
  Alert, InsightsOverview, InvoiceBrief, InvoiceDetail, SupplierBrief,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/v1";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jar = await cookies();
  const tok = jar.get("tl_access")?.value;
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(tok ? { authorization: `Bearer ${tok}` } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} on ${path}`);
  return r.json() as Promise<T>;
}

export const api = {
  invoices: {
    list: (q: Record<string, string> = {}) => {
      const qs = new URLSearchParams(q).toString();
      return call<InvoiceBrief[]>(`/invoices${qs ? "?" + qs : ""}`);
    },
    get: (id: string) => call<InvoiceDetail>(`/invoices/${id}`),
  },
  suppliers: {
    list: () => call<SupplierBrief[]>("/suppliers"),
  },
  alerts: {
    list: (state = "open") => call<Alert[]>(`/alerts?state=${state}`),
  },
  insights: {
    overview: (days = 30) => call<InsightsOverview>(`/insights/overview?days=${days}`),
  },
};
