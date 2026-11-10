import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/server/auth";
import { buildBlockers, currentIntake, listDossiers } from "@/lib/server/store";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/intake/schema";
import { openItems, flags } from "@/config/site";
import { Login, Logout } from "@/components/admin/Login";

export default async function Page() {
  if (!adminConfigured())
    return (
      <>
        <h1>Beheer is uitgeschakeld</h1>
        <p className="note">Stel <code>ADMIN_PASSWORD</code> (minimaal 12 tekens) en <code>SESSION_SECRET</code> (minimaal 32 tekens) in als omgevingsvariabelen om het beheerscherm te activeren. Zonder deze instellingen zijn dossiers en bestanden voor niemand opvraagbaar.</p>
      </>
    );
  if (!isAdmin()) return <Login />;
  const list = await listDossiers();
  return (
    <>
      <div className="btn-row" style={{ justifyContent: "space-between" }}><h1 style={{ margin: 0 }}>Aanvragen</h1><Logout /></div>
      <div className="table-scroll" style={{ margin: "24px 0 40px" }}>
        <table className="list">
          <thead><tr><th>Dossier</th><th>Bedrijf</th><th>Status</th><th>Betaling</th><th>Essentieel open</th><th>Bijgewerkt</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="muted">Nog geen aanvragen.</td></tr>}
            {list.map((d) => {
              const open = buildBlockers(d).length;
              return (
                <tr key={d.id}>
                  <td><Link href={`/beheer/${d.id}`}>{d.id}</Link></td>
                  <td>{currentIntake(d).business.businessName || <span className="muted">(geen naam)</span>}</td>
                  <td><span className="pill">{STATUS_LABEL[d.status]}</span></td>
                  <td>{PAYMENT_LABEL[d.paymentStatus]}</td>
                  <td>{open > 0 ? <span className="pill warn">{open}</span> : <span className="pill ok">compleet</span>}</td>
                  <td>{d.updatedAt.slice(0, 16).replace("T", " ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h2>Configuratietaken: nog niet bevestigde commerciële gegevens</h2>
        <p className="muted small">Deze punten staan in <code>src/config/site.ts</code>. Zolang ze open zijn, toont de website geen invulling ervan en blijft echte betaling uit ({flags.paymentsEnabled ? "betaling staat AAN" : "betaling staat uit"}).</p>
        <ul className="ticks plain">{openItems().map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </>
  );
}
