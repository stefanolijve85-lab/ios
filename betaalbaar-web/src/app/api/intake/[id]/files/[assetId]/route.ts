import { authDossier, readAsset, removeAsset, isAssetId, StoreError } from "@/lib/server/store";
import { downloadHeaders } from "@/lib/server/uploads";
import { fail, json, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";
type P = { params: { id: string; assetId: string } };

/** Thumbnail voor de eigenaar van het concept (token vereist). */
export async function GET(req: Request, { params }: P) {
  const d = await authDossier(params.id, req.headers.get("x-intake-token"));
  if (!d || !isAssetId(params.assetId)) return fail(404, "not_found", "Niet gevonden.");
  const r = await readAsset(d, params.assetId);
  if (!r) return fail(404, "not_found", "Niet gevonden.");
  return new Response(new Uint8Array(r.data), { headers: downloadHeaders(r.asset.name, r.asset.mime, true) });
}

export async function DELETE(req: Request, { params }: P) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  const d = await authDossier(params.id, req.headers.get("x-intake-token"));
  if (!d || !isAssetId(params.assetId)) return fail(404, "not_found", "Niet gevonden.");
  try {
    await removeAsset(d, params.assetId);
    return json({ ok: true });
  } catch (e) {
    return e instanceof StoreError ? fail(409, e.code, e.message) : fail(500, "storage", "Verwijderen is niet gelukt.");
  }
}
