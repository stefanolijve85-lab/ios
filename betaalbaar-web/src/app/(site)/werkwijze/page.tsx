import type { Metadata } from "next";
import { Closing, Steps } from "@/components/Sections";
import { StartCondition } from "@/components/Price";
import { delivery } from "@/config/site";

export const metadata: Metadata = {
  title: "Werkwijze: van intake tot website in 7 dagen",
  description: "Zo laat je een website maken: visuele intake, overzicht met prijs en planning, bouw binnen 7 dagen vanaf de afgesproken start, daarna hosting en service.",
  alternates: { canonical: "/werkwijze" },
};

export default function Page() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Werkwijze</p>
          <h1>In vijf stappen naar je website.</h1>
          <p className="lead">Je kiest en vertelt, wij bouwen. Voordat er iets start, zie je wat je krijgt, wat het kost en wat we nog van je nodig hebben.</p>
        </div>
      </section>
      <section className="section plain" style={{ paddingTop: 0 }}><div className="wrap" style={{ maxWidth: 820 }}><Steps /></div></section>
      <section className="section">
        <div className="wrap two">
          <div>
            <h2>Wanneer gaan de {delivery.days} dagen in?</h2>
            <StartCondition />
            <ul className="ticks plain">
              <li>Een verstuurde aanvraag of een betaling start de termijn niet vanzelf: eerst moet de noodzakelijke input compleet zijn.</li>
              <li>In je overzicht zie je precies wat nog ontbreekt.</li>
              <li>Feedbackmomenten en de omvang van het werk spreken we vooraf af.</li>
              <li>Kies je voor naam en logo, dan keur je die eerst goed. Daarna start de bouw van de website.</li>
              <li>Onderdelen op aanvraag, zoals een webshop of gekoppelde agenda, vallen buiten de 7 dagen en krijgen een eigen planning.</li>
            </ul>
          </div>
          <div>
            <h2>Wat staat er in je overzicht?</h2>
            <ul className="ticks">
              <li>De inhoud van je pakket</li>
              <li>De totaalprijs en de terugkerende kosten</li>
              <li>De planning en het startmoment</li>
              <li>De voorwaarden die voor jouw aanvraag gelden</li>
              <li>Eventueel meerwerk, altijd eerst met een prijsafspraak</li>
            </ul>
          </div>
        </div>
      </section>
      <Closing />
    </>
  );
}
