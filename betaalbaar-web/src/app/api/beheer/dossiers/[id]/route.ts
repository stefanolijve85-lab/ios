import { isAdmin } from "@/lib/server/auth";
import { adminUpdate, getDossier, StoreError, type AdminUpdate } from "@/lib/server/store";
import { fail, json, readJson, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!isAdmin()) return fail(401, "auth", "Niet ingelogd.");
  const d = await getDossier(params.id);
  if (!d) return fail(404, "not_found", "Dossier niet gevonden.");
  const body = await readJson(req, 400_000);
  if (!body) return fail(400, "invalid", "Ongeldige invoer.");
  try {
    const updated = await adminUpdate(d, body as AdminUpdate);
    return json({ ok: true, status: updated.status });
  } catch (e) {
    if (e instanceof StoreError) return fail(e.code === "blocked" ? 409 : 422, e.code, e.message);
    return fail(500, "storage", "Opslaan is niet gelukt.");
  }
}
