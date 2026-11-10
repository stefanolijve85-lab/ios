import Link from "next/link";
import { projects, pricing, delivery, terms, contact, onRequest } from "@/config/site";
import { euro } from "@/lib/pricing";
import { Cta, TrackLink } from "./Cta";
import { Pair, StatusBadge } from "./Mockup";

export function ProjectCards() {
  return (
    <div className="projects">
      {projects.map((p) => (
        <article className="project" key={p.slug}>
          <Pair project={p} />
          <div><StatusBadge status={p.status} /></div>
          <h3><TrackLink href={`/voorbeelden/${p.slug}`} event="example_view" project={p.slug}>{p.name}</TrackLink></h3>
          <p className="kind">{p.kind}</p>
          <p>{p.summary}</p>
          <TrackLink href={`/voorbeelden/${p.slug}`} event="example_view" project={p.slug} className="more">Bekijk dit voorbeeld<span className="sr-only">: {p.name}</span> →</TrackLink>
        </article>
      ))}
    </div>
  );
}

export function Offer() {
  return (
    <>
      <div className="split">
        <div>
          <p className="eyebrow">Eenmalig</p>
          <p className="amount">{euro(pricing.oneOff)} <small>eenmalig</small></p>
          <ul className="ticks">
            <li>Je complete website binnen het basispakket</li>
            <li>Binnen {delivery.days} dagen vanaf de afgesproken start</li>
            <li>Ontworpen voor desktop én mobiel</li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Per maand</p>
          <p className="amount">{euro(pricing.monthly)} <small>per maand</small></p>
          <ul className="ticks">
            <li>Hosting van je website</li>
            <li>Service bij één aanspreekpunt</li>
            <li>Een vast maandbedrag</li>
          </ul>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 14 }}>
        {pricing.vatLabel}. Wat precies binnen het basispakket en de maandelijkse service valt, staat in je overzicht en bevestig je voordat je akkoord geeft.
      </p>
      <div className="two" style={{ marginTop: 36 }}>
        <div>
          <h3>Optioneel: naam en logo</h3>
          <p className="muted">Nog geen bedrijfsnaam of logo? Die kunnen we samen met je maken voor {euro(pricing.nameLogo)} extra, eenmalig. Geen terugkerende toeslag, en alleen als je er zelf voor kiest.</p>
        </div>
        <div>
          <h3>Op aanvraag</h3>
          <p className="muted">Deze onderdelen beoordelen we apart. Je krijgt eerst een prijsafspraak; ze vallen niet automatisch onder de standaardprijs of de 7 dagen.</p>
          <ul className="ticks plain">{onRequest.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      <div className="btn-row" style={{ marginTop: 32 }}>
        <Cta location="aanbod" />
        <span className="small muted">Bekijk eerst je aanvraag en de afspraken.</span>
      </div>
    </>
  );
}

export const STEPS = [
  { t: "Vertel over je bedrijf", p: "Wat je doet, voor wie en wat bezoekers op je website moeten kunnen doen." },
  { t: "Doorloop de visuele intake", p: "Kies een stijl, kleuren en pagina's, en lever de noodzakelijke gegevens en bestanden aan." },
  { t: "Controleer je overzicht", p: "Je bevestigt inhoud, prijs en planning. Je ziet de pakketinhoud, de totaalprijs, de terugkerende kosten en de voorwaarden die gelden." },
  { t: `Wij bouwen je website binnen ${delivery.days} dagen`, p: "Vanaf de afgesproken start, met afgesproken feedbackmomenten. " + delivery.startCondition },
  { t: "Hosting en service", p: "Na oplevering verzorgen we hosting en service volgens het gekozen pakket, voor een vast maandbedrag." },
];
export function Steps() {
  return <ol className="steps">{STEPS.map((s) => <li key={s.t}><div><h3>{s.t}</h3><p>{s.p}</p></div></li>)}</ol>;
}

/** Antwoorden uitsluitend uit bevestigde gegevens; onbevestigde punten worden zo benoemd. */
const pending = (key: string, intro: string) =>
  terms[key].value ?? `${intro} Dit leggen we vast in je afspraken; je ziet het in je overzicht voordat je akkoord geeft.`;

export const FAQ: { q: string; a: string }[] = [
  { q: "Waarom is de instapprijs laag?", a: `Je betaalt ${euro(pricing.oneOff)} om te starten en daarna ${euro(pricing.monthly)} per maand voor hosting en service. De kosten zijn dus verdeeld over de looptijd. Kijk daarom altijd naar de totale kosten over één en drie jaar; die zetten we op deze site naast elkaar.` },
  { q: `Wat krijg ik voor ${euro(pricing.oneOff)}?`, a: pending("packageScope", "Een complete website binnen het basispakket. De exacte omvang, zoals het aantal pagina's, wordt nog vastgesteld.") },
  { q: `Wat valt onder ${euro(pricing.monthly)} per maand?`, a: pending("supportHours", "Hosting van je website en service bij één aanspreekpunt. Wat de service precies omvat, wordt nog vastgesteld.") },
  { q: "Wat kosten wijzigingen?", a: pending("changeBudget", "Welke wijzigingen binnen je maandbedrag vallen, wordt nog vastgesteld.") + " Voor meerwerk krijg je altijd eerst een prijsafspraak." },
  { q: "Is een domeinnaam inbegrepen?", a: pending("domainAndEmail", "Of een domeinnaam en e-mail zijn inbegrepen, staat nog niet vast.") },
  { q: "Wie schrijft de teksten?", a: pending("copywriting", "In de intake geef je aan of je teksten zelf aanlevert, bestaande teksten gebruikt of een tekstvoorstel wilt. Of een tekstvoorstel is inbegrepen, wordt nog vastgesteld.") },
  { q: "Wie is eigenaar van de website?", a: pending("ownership", "De afspraken over eigendom en overdracht worden nog vastgesteld.") },
  { q: "Wat gebeurt er als ik opzeg?", a: pending("noticePeriod", "De minimumlooptijd, de opzegtermijn en wat er bij opzeggen met je website gebeurt, worden nog vastgesteld.") },
  { q: "Wanneer gaat mijn website live?", a: `We bouwen je complete website binnen ${delivery.days} dagen. ${delivery.startCondition} ${delivery.meaning ? `Daarmee bedoelen we ${delivery.meaning}.` : delivery.meaningFallback} Kies je voor naam en logo, dan keur je die eerst goed en start daarna de bouw.` },
  { q: "Kan ik een bestaande website vervangen?", a: "Ja. In de intake geef je aan dat het om een vervanging gaat en kun je het adres van je huidige website invullen. Wat er wordt overgenomen, bespreken we op basis van je aanvraag." },
];
export function Faq() {
  return (
    <div className="faq">
      {FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
    </div>
  );
}

export function Closing() {
  const hasContact = contact.email || contact.phone;
  return (
    <section className="section closing">
      <div className="wrap">
        <h2>Klaar voor een website die bij je bedrijf past?</h2>
        <div className="prices">
          <div><b>{euro(pricing.oneOff)}</b><span className="muted">eenmalig</span></div>
          <div><b>{euro(pricing.monthly)}</b><span className="muted">per maand</span></div>
        </div>
        <p className="muted small">{pricing.vatLabel}. {delivery.startCondition}</p>
        <div className="btn-row">
          <Cta location="afsluiting" />
          {hasContact && <Link href="/contact">Liever eerst contact?</Link>}
        </div>
      </div>
    </section>
  );
}
