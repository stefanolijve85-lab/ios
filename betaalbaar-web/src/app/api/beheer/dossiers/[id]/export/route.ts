import { isAdmin } from "@/lib/server/auth";
import { getDossier } from "@/lib/server/store";
import { briefingMarkdown, buildPrompt, exportJson } from "@/lib/intake/exports";
import { fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return fail(401, "auth", "Niet ingelogd.");
  const d = await getDossier(params.id);
  if (!d) return fail(404, "not_found", "Dossier niet gevonden.");
  const type = new URL(req.url).searchParams.get("type");
  let body: string, name: string, mime = "text/markdown; charset=utf-8";
  if (type === "briefing") { body = briefingMarkdown(d); name = `${d.id}-briefing.md`; }
  else if (type === "json") { body = JSON.stringify(exportJson(d), null, 2); name = `${d.id}.json`; mime = "application/json; charset=utf-8"; }
  else if (type === "prompt") {
    const p = buildPrompt(d);
    body = p.markdown; name = `${d.id}-bouwprompt${p.ready ? "" : "-CONCEPT"}.md`;
  } else return fail(400, "invalid", "Onbekend exporttype.");
  return new Response(body, {
    headers: { "Content-Type": mime, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
