import type { Project } from "@/config/site";

/**
 * CSS-getekend conceptvoorbeeld. Dit zijn bewust géén screenshots: zolang er
 * geen aangeleverde beelden zijn, tonen we een gelabelde schets met
 * fotoplaatshouders in plaats van verzonnen 'echt werk'.
 */
function Body({ theme, compact }: { theme: Project["theme"]; compact?: boolean }) {
  if (theme === "detepo")
    return (
      <div className="mock-body">
        <div className="mock-nav"><span>DETEPO</span>{!compact && <span><i>Product</i><i>Contact</i></span>}</div>
        <div className="mock-title">Weet hoeveel bezoekers er binnenkomen.</div>
        <div className="bars">{[35, 55, 42, 70, 88, 64, 78, 50].map((h, k) => <i key={k} style={{ height: `${h}%` }} />)}</div>
        <div className="cols"><span>Tellen</span>{!compact && <><span>Inzicht</span><span>Rapport</span></>}</div>
        <span className="mock-btn">Neem contact op</span>
      </div>
    );
  if (theme === "casa")
    return (
      <div className="mock-body">
        <div className="mock-nav"><span>Casa Amoray</span>{!compact && <span><i>Behandelingen</i><i>Reserveren</i></span>}</div>
        <div className="arch ph">foto volgt</div>
        <div className="mock-title">Even tijd voor jezelf</div>
        {!compact && <div className="treat"><span><i>Behandeling</i><i>—</i></span><span><i>Behandeling</i><i>—</i></span></div>}
        <span className="mock-btn">Reserveer</span>
      </div>
    );
  return (
    <div className="mock-body">
      <div className="mock-nav"><span>Bij Tanja</span>{!compact && <span><i>Assortiment</i><i>Contact</i></span>}</div>
      <div className="inner">
        <div className="mock-title">Kaas &amp; delicatessen</div>
        <div className="tiles">{(compact ? [0, 1] : [0, 1, 2, 3]).map((k) => <span key={k} className="ph">foto</span>)}</div>
        <span className="hours">Openingstijden</span>
      </div>
    </div>
  );
}

export function Desktop({ theme }: { theme: Project["theme"] }) {
  return (
    <div className={`mock t-${theme}`}>
      <div className="mock-bar"><i /><i /><i /></div>
      <Body theme={theme} />
    </div>
  );
}
export function Phone({ theme }: { theme: Project["theme"] }) {
  return <div className={`phone t-${theme}`}><Body theme={theme} compact /></div>;
}
export function Pair({ project }: { project: Project }) {
  return (
    <div className="pair" role="img" aria-label={`Schets van de ${project.status === "concept" ? "conceptwebsite" : "website"} van ${project.name}, op desktop en mobiel`}>
      <Desktop theme={project.theme} />
      <Phone theme={project.theme} />
    </div>
  );
}
export function StatusBadge({ status }: { status: Project["status"] }) {
  return <span className={`badge${status === "gerealiseerd" ? " real" : ""}`}>{status === "gerealiseerd" ? "Gerealiseerd" : "Conceptvoorbeeld"}</span>;
}
