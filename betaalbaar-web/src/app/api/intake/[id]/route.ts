import { authDossier, saveDraft, StoreError } from "@/lib/server/store";
import { clientIp, fail, json, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!rateLimit(`save:${clientIp(req)}`, 300, 60 * 60 * 1000)) return fail(429, "rate", "Te veel verzoeken. Probeer het later opnieuw.");
  const d = await authDossier(params.id, req.headers.get("x-intake-token"));
  if (!d) return fail(404, "not_found", "Aanvraag niet gevonden.");
  const body = await readJson(req);
  if (!body) return fail(400, "invalid", "Ongeldige invoer.");
  try {
    await saveDraft(d, body.intake);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof StoreError) return fail(409, e.code, e.message);
    return fail(500, "storage", "Opslaan is niet gelukt. Probeer het opnieuw.");
  }
}
