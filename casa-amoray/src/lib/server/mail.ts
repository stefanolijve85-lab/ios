/**
 * E-mail versturen via Resend (https://resend.com).
 * Omgevingsvariabelen: RESEND_API_KEY, BOOKING_EMAIL_FROM (geverifieerd domein) en optioneel
 * BOOKING_EMAIL_TO (standaard het e-mailadres van Casa Amoray uit site.ts).
 */
import { business } from "@/content/site";

const inbox = () => process.env.BOOKING_EMAIL_TO || business.email || "";

export function mailConfigured() {
  const { RESEND_API_KEY, BOOKING_EMAIL_FROM } = process.env;
  return Boolean(RESEND_API_KEY && BOOKING_EMAIL_FROM && inbox());
}

export async function sendMail(opts: { to?: string; replyTo?: string; subject: string; text: string }) {
  const { RESEND_API_KEY, BOOKING_EMAIL_FROM } = process.env;
  if (!mailConfigured()) throw new Error("E-mail is niet geconfigureerd");
  // RESEND_API_BASE alleen voor lokaal testen met een nep-server.
  const res = await fetch(`${process.env.RESEND_API_BASE || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: BOOKING_EMAIL_FROM,
      to: [opts.to ?? inbox()],
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      subject: opts.subject,
      text: opts.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text().catch(() => "")}`);
}

/** Verwijdert stuurtekens en kapt af. */
export const clean = (v: unknown, max = 200) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Eenvoudige rem tegen misbruik, per IP (best effort, per serverinstantie). */
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, max = 5, windowMs = 10 * 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "onbekend";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}
