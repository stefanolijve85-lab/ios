"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_LABEL, PAYMENT_STATUSES, STATUSES, STATUS_LABEL } from "@/lib/intake/schema";

type Props = {
  id: string; status: string; paymentStatus: string; notes: string; submitted: boolean;
  customWorkReviewed: boolean; hasCustomWork: boolean;
  delivery: { startAt: string | null; deadline: string | null; customerStatus: string };
  briefingJson: string; prompt: string; promptReady: boolean;
};

export function DossierAdmin(p: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState(p.status);
  const [paymentStatus, setPayment] = useState(p.paymentStatus);
  const [notes, setNotes] = useState(p.notes);
  const [startAt, setStartAt] = useState(p.delivery.startAt ?? "");
  const [deadline, setDeadline] = useState(p.delivery.deadline ?? "");
  const [customerStatus, setCustomerStatus] = useState(p.delivery.customerStatus);
  const [reviewed, setReviewed] = useState(p.customWorkReviewed);
  const [briefing, setBriefing] = useState(p.briefingJson);
  const [versionNote, setVersionNote] = useState("");
  const [change, setChange] = useState({ description: "", planningImpact: "", priceImpact: "" });
  const [copied, setCopied] = useState(false);

  const save = async (body: Record<string, unknown>, okText: string) => {
    setMsg(null);
    const res = await fetch(`/api/beheer/dossiers/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) { setMsg({ ok: true, text: okText }); router.refresh(); return true; }
    setMsg({ ok: false, text: data?.message ?? "Opslaan is niet gelukt." });
    return false;
  };

  return (
    <>
      {msg && <p className={msg.ok ? "note info" : "note"} role="alert" data-testid="beheer-melding">{msg.text}</p>}

      <div className="panel">
        <h2>Status en planning</h2>
        <div className="grid2">
          <div className="field"><label htmlFor="st">Dossierstatus</label>
            <select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
          <div className="field"><label htmlFor="pay">Betalingsstatus (los van dossierstatus)</label>
            <select id="pay" value={paymentStatus} onChange={(e) => setPayment(e.target.value)}>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}</select></div>
          <div className="field"><label htmlFor="sa">Startmoment levertijd</label><input id="sa" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></div>
          <div className="field"><label htmlFor="dl">Afgesproken deadline</label><input id="dl" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="cs">Status zichtbaar voor de klant</label><input id="cs" type="text" value={customerStatus} onChange={(e) => setCustomerStatus(e.target.value)} /></div>
        {p.hasCustomWork && (
          <label className="check"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /><span>Maatwerkfuncties en conflicterende wensen zijn beoordeeld en apart afgesproken met de klant.</span></label>
        )}
        <div className="field"><label htmlFor="nt">Interne notities</label><textarea id="nt" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <p className="small muted">Betalen of indienen start de levertijd nooit automatisch: leg het startmoment hier bewust vast. &lsquo;Goedgekeurd voor bouw&rsquo; kan alleen als de essentiële checklist leeg is.</p>
        <button type="button" className="btn btn-primary" data-testid="beheer-opslaan"
          onClick={() => save({ status, paymentStatus, notes, customWorkReviewed: reviewed, delivery: { startAt: startAt || null, deadline: deadline || null, customerStatus } }, "Opgeslagen.")}>
          Opslaan
        </button>
      </div>

      <div className="panel">
        <h2>Bouwprompt {p.promptReady ? <span className="pill ok">bouwklaar</span> : <span className="pill warn">concept — niet bouwklaar</span>}</h2>
        <p className="small muted">Deterministisch gegenereerd uit het dossier, zonder externe AI. Bevat geen administratieve persoonsgegevens.</p>
        <pre className="code" tabIndex={0} data-testid="bouwprompt">{p.prompt}</pre>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={() => navigator.clipboard.writeText(p.prompt).then(() => setCopied(true))}>{copied ? "Gekopieerd" : "Kopieer bouwprompt"}</button>
          <a className="btn btn-secondary" href={`/api/beheer/dossiers/${p.id}/export?type=prompt`}>Download bouwprompt</a>
          <a className="btn btn-secondary" href={`/api/beheer/dossiers/${p.id}/export?type=briefing`}>Download klantbriefing (.md)</a>
          <a className="btn btn-secondary" href={`/api/beheer/dossiers/${p.id}/export?type=json`}>Download JSON</a>
        </div>
      </div>

      {p.submitted && (
        <div className="panel">
          <h2>Bewerkte briefing</h2>
          <p className="small muted">Corrigeer hier fouten. De oorspronkelijke antwoorden van de klant blijven ongewijzigd bewaard en elke wijziging wordt een nieuwe versie. Onbekende velden en ongeldige waarden worden bij opslaan verwijderd.</p>
          <div className="field"><label htmlFor="bj">Briefing (JSON)</label><textarea id="bj" className="json" spellCheck={false} value={briefing} onChange={(e) => setBriefing(e.target.value)} /></div>
          <div className="field"><label htmlFor="vn">Wat heb je gewijzigd?</label><input id="vn" type="text" value={versionNote} onChange={(e) => setVersionNote(e.target.value)} /></div>
          <button type="button" className="btn btn-secondary" onClick={() => {
            let parsed: unknown;
            try { parsed = JSON.parse(briefing); } catch { setMsg({ ok: false, text: "De briefing is geen geldige JSON. Er is niets opgeslagen." }); return; }
            void save({ briefing: parsed, versionNote }, "Briefing opgeslagen als nieuwe versie.");
          }}>Sla briefing op als nieuwe versie</button>
        </div>
      )}

      <div className="panel">
        <h2>Wijziging na akkoord vastleggen</h2>
        <div className="field"><label htmlFor="cd">Wat verandert er?</label><textarea id="cd" value={change.description} onChange={(e) => setChange({ ...change, description: e.target.value })} /></div>
        <div className="grid2">
          <div className="field"><label htmlFor="cp">Invloed op planning</label><input id="cp" type="text" value={change.planningImpact} onChange={(e) => setChange({ ...change, planningImpact: e.target.value })} /></div>
          <div className="field"><label htmlFor="cr">Invloed op prijs</label><input id="cr" type="text" value={change.priceImpact} onChange={(e) => setChange({ ...change, priceImpact: e.target.value })} /></div>
        </div>
        <button type="button" className="btn btn-secondary" disabled={!change.description.trim()} onClick={async () => { if (await save({ change }, "Wijziging vastgelegd.")) setChange({ description: "", planningImpact: "", priceImpact: "" }); }}>Leg wijziging vast</button>
      </div>
    </>
  );
}
