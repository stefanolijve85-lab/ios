import { addAsset, authDossier } from "@/lib/server/store";
import { checkUpload, MAX_FILE_BYTES, MAX_FILES } from "@/lib/server/uploads";
import { clientIp, fail, json, rateLimit, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const PURPOSES = ["logo", "foto", "huisstijl", "document"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  if (!rateLimit(`upload:${clientIp(req)}`, 80, 60 * 60 * 1000)) return fail(429, "rate", "Te veel uploads. Probeer het later opnieuw.");
  const d = await authDossier(params.id, req.headers.get("x-intake-token"));
  if (!d) return fail(404, "not_found", "Aanvraag niet gevonden.");
  if (d.status !== "concept") return fail(409, "locked", "Deze aanvraag is al verstuurd.");
  if (d.assets.length >= MAX_FILES) return fail(422, "too_many", `Je kunt maximaal ${MAX_FILES} bestanden toevoegen.`);
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_FILE_BYTES + 100_000) return fail(413, "too_large", "Het bestand is groter dan 8 MB.");

  let form: FormData;
  try { form = await req.formData(); } catch { return fail(400, "invalid", "De upload kon niet worden gelezen."); }
  const f = form.get("file");
  if (!(f instanceof File)) return fail(400, "invalid", "Geen bestand ontvangen.");
  if (f.size > MAX_FILE_BYTES) return fail(413, "too_large", "Het bestand is groter dan 8 MB.");
  const data = Buffer.from(await f.arrayBuffer());
  const checked = checkUpload(data);
  if (!checked.ok) return fail(422, "type", checked.message);

  const text = (k: string, max: number) => String(form.get(k) ?? "").slice(0, max).trim();
  const purpose = PURPOSES.includes(text("purpose", 20)) ? text("purpose", 20) : "foto";
  try {
    const asset = await addAsset(d, {
      name: f.name.replace(/[\u0000-\u001f\\/]/g, "_").slice(0, 120) || "bestand",
      mime: checked.mime, size: data.length, width: checked.width, height: checked.height,
      purpose, placement: text("placement", 120), description: text("description", 200),
    }, data);
    return json({ ok: true, asset }, 201);
  } catch {
    return fail(500, "storage", "Het bestand kon niet worden opgeslagen. Probeer het opnieuw.");
  }
}
