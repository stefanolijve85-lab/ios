import type { Metadata } from "next";
import { brand, contact } from "@/config/site";

export const metadata: Metadata = { title: "Privacy (concept)", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <section className="page-head">
      <div className="wrap prose">
        <p className="eyebrow">Concept</p>
        <h1>Privacy</h1>
        <p className="note">Dit is een conceptpagina. De definitieve privacyverklaring volgt zodra de bedrijfsgegevens van {brand.name} zijn ingevuld en de tekst juridisch is gecontroleerd. Deze pagina wordt niet geïndexeerd.</p>
        <h2>Wat deze website nu doet</h2>
        <ul>
          <li>De intake slaat je antwoorden pas op een server op nadat je daar zelf toestemming voor geeft en je e-mailadres invult, of wanneer je je aanvraag verstuurt.</li>
          <li>Bestanden die je uploadt worden afgeschermd opgeslagen en zijn alleen na inloggen door het bureau te downloaden.</li>
          <li>We vragen in de intake nooit om wachtwoorden.</li>
          <li>Er is op dit moment geen analytics of tracking actief.</li>
          <li>Gegevens voor de administratie worden apart gehouden van de gegevens die op jouw website komen.</li>
        </ul>
        <h2>Nog in te vullen</h2>
        <ul>
          <li>Verwerkingsverantwoordelijke: {contact.legalName ?? "nog niet ingevuld"}</li>
          <li>Contact voor privacyvragen: {contact.email ?? "nog niet ingevuld"}</li>
          <li>Bewaartermijnen, verwerkers en je rechten: nog vast te stellen</li>
        </ul>
      </div>
    </section>
  );
}
