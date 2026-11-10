import { adminConfigured, checkPassword, startSession } from "@/lib/server/auth";
import { clientIp, fail, json, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!adminConfigured()) return fail(503, "not_configured", "Beheer is niet geconfigureerd.");
  if (!rateLimit(`login:${clientIp(req)}`, 8, 15 * 60 * 1000)) return fail(429, "rate", "Te veel pogingen. Wacht een kwartier.");
  const body = await readJson(req, 2000);
  if (!checkPassword(typeof body?.password === "string" ? body.password : "")) return fail(401, "auth", "Onjuist wachtwoord.");
  startSession();
  return json({ ok: true });
}
