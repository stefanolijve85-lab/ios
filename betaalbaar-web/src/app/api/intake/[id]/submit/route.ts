import { authDossier, submitDossier } from "@/lib/server/store";
import { isEmail, sanitizeIntake } from "@/lib/intake/schema";
import { clientIp, fail, json, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Definitieve inzending van de aanvraag (geen bestelling, geen betaling).
 * Idempotent: herhaalde aanroepen leveren hetzelfde dossier op.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!rateLimit(`submit:${clientIp(req)}`, 20, 60 * 60 * 1000)) return fail(429, "rate", "Te veel verzoeken. Probeer het later opnieuw.");
  const d = await authDossier(params.id, req.headers.get("x-intake-token"));
  if (!d) return fail(404, "not_found", "Aanvraag niet gevonden.");
  if (d.status !== "concept") return json({ ok: true, id: d.id, status: d.status, repeated: true });
  const body = await readJson(req);
  if (!body) return fail(400, "invalid", "Ongeldige invoer.");
  const intake = sanitizeIntake(body.intake);
  if (!intake.billing.contactName) return fail(422, "billing.contactName", "Vul je naam in zodat we weten met wie we contact opnemen.");
  if (!isEmail(intake.billing.email)) return fail(422, "billing.email", "Vul een geldig e-mailadres in voor je aanvraag.");
  try {
    const key = typeof body.submitKey === "string" ? body.submitKey : "";
    const { dossier, repeated } = await submitDossier(d, intake, key);
    return json({ ok: true, id: dossier.id, status: dossier.status, repeated });
  } catch {
    return fail(500, "storage", "Versturen is niet gelukt. Je antwoorden zijn bewaard; probeer het opnieuw.");
  }
}
