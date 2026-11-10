import type { Metadata } from "next";
import { brand, terms, pricing, delivery } from "@/config/site";
import { euro } from "@/lib/pricing";

export const metadata: Metadata = { title: "Voorwaarden (concept)", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <section className="page-head">
      <div className="wrap prose">
        <p className="eyebrow">Concept</p>
        <h1>Voorwaarden</h1>
        <p className="note">Dit is een conceptpagina, geen geldende algemene voorwaarden. Zolang de onderstaande punten niet zijn vastgesteld, kun je via deze website alleen een aanvraag versturen en niet bestellen of betalen. Deze pagina wordt niet geïndexeerd.</p>
        <h2>Wat vaststaat</h2>
        <ul>
          <li>Prijs: {euro(pricing.oneOff)} eenmalig + {euro(pricing.monthly)} per maand voor hosting en service.</li>
          <li>Optioneel naam en logo: {euro(pricing.nameLogo)} extra, eenmalig, alleen op eigen keuze.</li>
          <li>Belofte: een complete website binnen {delivery.days} dagen.</li>
          <li>Meerwerk: altijd eerst een prijsafspraak.</li>
        </ul>
        <h2>Voorgesteld, nog te bevestigen</h2>
        <ul>
          <li>{delivery.startCondition}</li>
          <li>{pricing.vatLabel}.</li>
          <li>Bij naam en logo: eerst goedkeuring van naam en logo, daarna start de websitebouw.</li>
        </ul>
        <h2>Nog vast te stellen door {brand.name}</h2>
        <ul>{Object.values(terms).filter((t) => t.value === null).map((t) => <li key={t.label}>{t.label}</li>)}</ul>
      </div>
    </section>
  );
}
