import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/server/auth";
import { buildBlockers, currentIntake, getDossier } from "@/lib/server/store";
import { buildPrompt } from "@/lib/intake/exports";
import { missingFields, STATUS_LABEL } from "@/lib/intake/schema";
import { priceSummary, euro } from "@/lib/pricing";
import { DossierAdmin } from "@/components/admin/DossierAdmin";

export default async function Page({ params }: { params: { id: string } }) {
  if (!isAdmin()) redirect("/beheer");
  const d = await getDossier(params.id);
  if (!d) notFound();
  const i = currentIntake(d);
  const blockers = buildBlockers(d);
  const other = missingFields(i, d.assets.length).filter((m) => !m.critical);
  const prompt = buildPrompt(d);
  const price = priceSummary(i.extras.nameLogo);
  return (
    <>
      <p><Link href="/beheer">← Alle aanvragen</Link></p>
      <h1 style={{ fontSize: "2rem" }}>{i.business.businessName || "(geen naam)"} <span className="muted" style={{ fontWeight: 400 }}>· {d.id}</span></h1>
      <p><span className="pill">{STATUS_LABEL[d.status]}</span> · aangemaakt {d.createdAt.slice(0, 10)} · ingediend {d.submittedAt?.slice(0, 10) ?? "nog niet"}</p>

      <div className="panel">
        <h2>Checklist essentiële informatie</h2>
        {blockers.length === 0 ? <p className="status-ok">Alle essentiële onderdelen zijn aanwezig.</p> : (
          <ul className="ticks plain" data-testid="blockers">{blockers.map((b) => <li key={b.key}><strong>{b.label}</strong></li>)}</ul>
        )}
        {other.length > 0 && <><p className="small muted" style={{ marginTop: 14 }}>Niet essentieel, wel handig:</p><ul className="ticks plain small">{other.map((b) => <li key={b.key}>{b.label}</li>)}</ul></>}
      </div>

      <div className="panel">
        <h2>Administratie (niet in de bouwprompt)</h2>
        <p>{i.billing.contactName || "—"} · {i.billing.email || d.resumeEmail || "—"} · {i.billing.phone || "—"} · {i.billing.companyName || "—"}</p>
        {i.billing.notes && <p className="muted">{i.billing.notes}</p>}
        <p>Prijs: {euro(price.oneOff)} eenmalig + {euro(price.monthly)} per maand · jaar 1: {euro(price.year1)} (excl. btw, nog te bevestigen){i.extras.nameLogo && " · inclusief naam en logo"}</p>
      </div>

      <div className="panel">
        <h2>Bestanden ({d.assets.length})</h2>
        {d.assets.length === 0 ? <p className="muted">Geen bestanden.</p> : (
          <ul className="ticks plain">
            {d.assets.map((a) => (
              <li key={a.id}><a href={`/api/beheer/dossiers/${d.id}/files/${a.id}`}>{a.name}</a> <span className="small muted">· {a.id} · {a.mime}{a.width ? ` · ${a.width}×${a.height}` : ""} · {a.purpose}{a.placement && ` · ${a.placement}`}</span></li>
            ))}
          </ul>
        )}
      </div>

      <DossierAdmin
        id={d.id} status={d.status} paymentStatus={d.paymentStatus} notes={d.notes} submitted={!!d.original}
        customWorkReviewed={d.approvals.customWorkReviewed} hasCustomWork={i.media.extraFeatures.length > 0}
        delivery={d.delivery} briefingJson={JSON.stringify(i, null, 2)} prompt={prompt.markdown} promptReady={prompt.ready}
      />

      <div className="panel">
        <h2>Geschiedenis</h2>
        <p className="small muted">Oorspronkelijke antwoorden: {d.original ? "bewaard" : "nog niet ingediend"} · {d.versions.length} eerdere versie(s) van de briefing</p>
        <ul className="ticks plain small">
          {d.versions.map((v, k) => <li key={k}>{v.at.slice(0, 16).replace("T", " ")} — {v.note}</li>)}
          {d.changes.map((c, k) => <li key={`c${k}`}>{c.at.slice(0, 10)} — wijziging na akkoord: {c.description} (planning: {c.planningImpact || "—"}; prijs: {c.priceImpact || "—"})</li>)}
        </ul>
        {d.original && <details><summary>Bekijk oorspronkelijke antwoorden</summary><pre className="code">{JSON.stringify(d.original, null, 2)}</pre></details>}
      </div>
    </>
  );
}
