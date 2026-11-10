import { isAdmin } from "@/lib/server/auth";
import { getDossier, isAssetId, readAsset } from "@/lib/server/store";
import { downloadHeaders } from "@/lib/server/uploads";
import { fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string; assetId: string } }) {
  if (!isAdmin()) return fail(401, "auth", "Niet ingelogd.");
  const d = await getDossier(params.id);
  if (!d || !isAssetId(params.assetId)) return fail(404, "not_found", "Niet gevonden.");
  const r = await readAsset(d, params.assetId);
  if (!r) return fail(404, "not_found", "Niet gevonden.");
  return new Response(new Uint8Array(r.data), { headers: downloadHeaders(r.asset.name, r.asset.mime) });
}
