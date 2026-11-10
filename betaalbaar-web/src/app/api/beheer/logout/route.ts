import { endSession } from "@/lib/server/auth";
import { fail, json, sameOrigin } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "origin", "Verzoek geweigerd.");
  endSession();
  return json({ ok: true });
}
