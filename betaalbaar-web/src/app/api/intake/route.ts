import { createDraft } from "@/lib/server/store";
import { isEmail } from "@/lib/intake/schema";
import { clientIp, fail, json, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Maakt een concept aan. Alleen na uitdrukkelijke toestemming om voortgang te bewaren. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!rateLimit(`create:${clientIp(req)}`, 10, 60 * 60 * 1000))
    return fail(429, "rate", "Te veel aanvragen vanaf dit adres. Probeer het over een uur opnieuw.");
  const body = await readJson(req);
  if (!body) return fail(400, "invalid", "Ongeldige invoer.");
  // Honeypot: echte bezoekers laten dit veld leeg.
  if (typeof body.website === "string" && body.website !== "") return fail(400, "invalid", "Ongeldige invoer.");
  if (body.consent !== true) return fail(422, "consent", "Geef toestemming om je voortgang te bewaren.");
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!isEmail(email)) return fail(422, "email", "Vul een geldig e-mailadres in.");
  try {
    const { dossier, token } = await createDraft(body.intake, email);
    return json({ ok: true, id: dossier.id, token }, 201);
  } catch {
    return fail(500, "storage", "Opslaan is niet gelukt. Je antwoorden staan nog in dit venster; probeer het opnieuw.");
  }
}
