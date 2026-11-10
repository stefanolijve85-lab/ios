import type { Metadata } from "next";
import { Closing, Offer, ProjectCards, Steps } from "@/components/Sections";
import { PriceBlock, StartCondition } from "@/components/Price";
import { Cta } from "@/components/Cta";

export const metadata: Metadata = {
  title: "Professionele website laten maken voor je bedrijf",
  description: "Een professionele website laten maken als zzp'er, winkel, salon of dienstverlener. €99 eenmalig + €59 per maand voor hosting en service, exclusief btw.",
  alternates: { canonical: "/website-laten-maken" },
};

const who = [
  { t: "Zzp'ers en dienstverleners", p: "Laat zien wat je doet, in welk gebied je werkt en hoe een klant je bereikt of een offerte aanvraagt." },
  { t: "Winkels", p: "Je assortiment, de sfeer van je winkel, openingstijden en route: wat een bezoeker nodig heeft om langs te komen." },
  { t: "Salons", p: "Een rustige presentatie van je behandelingen, met een duidelijke weg naar een afspraak." },
];
const parts = [
  { t: "Ontwerp dat jij kiest", p: "In de visuele intake kies je uit zes stijlen, een kleurpalet en de sfeer van je website. Je ziet direct een indicatief stijlvoorbeeld." },
  { t: "Pagina's die bij je bedrijf horen", p: "Je geeft aan welke pagina's je wilt, zoals Home, Diensten, Over ons en Contact. Wat binnen het basispakket past, bevestigen we in je overzicht." },
  { t: "Eén hoofdactie voor je bezoeker", p: "Bellen, WhatsApp, een offerte of een afspraak aanvragen: de website stuurt op de actie die voor jou telt." },
  { t: "Apart ontworpen voor mobiel", p: "De mobiele versie is geen verkleinde desktop. Aanbod en contactknop staan direct in beeld." },
  { t: "Hosting en service", p: "Na oplevering blijft je website bij ons draaien, met één aanspreekpunt en een vast maandbedrag." },
];

export default function Page() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Website laten maken</p>
          <h1>Een professionele website laten maken, zonder hoge instap.</h1>
          <p className="lead">Voor ondernemers die een verzorgde website willen en vooraf willen weten wat het kost. Jij vertelt wat je nodig hebt, wij bouwen.</p>
          <PriceBlock />
          <StartCondition />
          <Cta location="website-laten-maken" />
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="head"><h2>Voor wie we bouwen.</h2></div>
          <div className="rows">{who.map((b) => <div key={b.t}><h3>{b.t}</h3><p>{b.p}</p></div>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="head"><h2>Wat je krijgt.</h2></div>
          <div className="rows">{parts.map((b) => <div key={b.t}><h3>{b.t}</h3><p>{b.p}</p></div>)}</div>
        </div>
      </section>
      <section className="section"><div className="wrap"><div className="head"><h2>Het aanbod.</h2></div><Offer /></div></section>
      <section className="section"><div className="wrap"><div className="head"><h2>Voorbeelden.</h2></div><ProjectCards /></div></section>
      <section className="section"><div className="wrap two"><div className="head"><h2>Zo werkt het.</h2></div><Steps /></div></section>
      <Closing />
    </>
  );
}
