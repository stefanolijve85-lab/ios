import { authDossier } from "@/lib/server/store";
import { clientIp, fail, json, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!rateLimit(`resume:${clientIp(req)}`, 30, 15 * 60 * 1000)) return fail(429, "rate", "Te veel pogingen. Probeer het later opnieuw.");
  const body = await readJson(req);
  const d = await authDossier(String(body?.id ?? ""), typeof body?.token === "string" ? body.token : null);
  if (!d) return fail(404, "not_found", "Deze hervatlink is niet (meer) geldig.");
  return json({ ok: true, id: d.id, status: d.status, intake: d.draft, assets: d.assets, email: d.resumeEmail });
}
