/**
 * Minimale Mollie-koppeling (https://docs.mollie.com) voor cadeaubonnen.
 * Omgevingsvariabele: MOLLIE_API_KEY (test_... om te testen, live_... voor echt).
 */
// MOLLIE_API_BASE alleen voor lokaal testen met een nep-server.
const API = process.env.MOLLIE_API_BASE || "https://api.mollie.com/v2";

export type MolliePayment = {
  id: string;
  status: "open" | "pending" | "authorized" | "paid" | "canceled" | "expired" | "failed";
  amount: { currency: string; value: string };
  description: string;
  metadata: Record<string, string> | null;
  _links: { checkout?: { href: string } };
};

export const mollieConfigured = () => Boolean(process.env.MOLLIE_API_KEY);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mollie ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json() as Promise<T>;
}

export function createPayment(body: {
  amount: number;
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
  metadata: Record<string, string>;
}) {
  return call<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: { currency: "EUR", value: body.amount.toFixed(2) },
      description: body.description,
      redirectUrl: body.redirectUrl,
      ...(body.webhookUrl ? { webhookUrl: body.webhookUrl } : {}),
      locale: "nl_NL",
      metadata: body.metadata,
    }),
  });
}

/** Zet na het aanmaken de betaal-id in de terugkeer-URL, zodat de bedankpagina de echte status kan tonen. */
export function updateRedirect(id: string, redirectUrl: string) {
  return call<MolliePayment>(`/payments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ redirectUrl }),
  });
}

export function getPayment(id: string) {
  return call<MolliePayment>(`/payments/${encodeURIComponent(id)}`);
}

export const isPaymentId = (id: string) => /^tr_[A-Za-z0-9]{6,32}$/.test(id);
