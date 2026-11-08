import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Placeholder } from "@/components/Placeholder";
import { Footer } from "@/components/Sections";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacyverklaring",
  description: "Hoe Casa Amoray omgaat met je persoonsgegevens.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <>
      <Header />
      <main id="inhoud" className="page">
        <div className="container prose">
          <p className="eyebrow">Privacy</p>
          <h1>Privacyverklaring</h1>
          <Placeholder>
            Concepttekst. Laat deze controleren en vul de bedrijfsgegevens (adres, KvK, contact) aan vóór livegang.
          </Placeholder>

          <h2>Welke gegevens</h2>
          <p>
            Als je via deze website een afspraak aanvraagt, ontvangt {business.name} je naam, e-mailadres,
            telefoonnummer, de gekozen behandeling, je voorkeursdatum en -tijd en eventuele opmerkingen. Deel in
            opmerkingen alleen wat nodig is; gezondheidsinformatie gebruiken we uitsluitend om de behandeling op jou
            af te stemmen.
          </p>

          <h2>Waarvoor</h2>
          <p>
            Uitsluitend om je aanvraag af te handelen, je afspraak te bevestigen en contact met je op te nemen over
            die afspraak. We gebruiken je gegevens niet voor nieuwsbrieven of reclame en verkopen ze nooit aan
            derden.
          </p>

          <h2>Hoe</h2>
          <p>
            Je aanvraag wordt per e-mail naar {business.name} gestuurd. De website zelf slaat je gegevens niet op in
            een database en gebruikt geen tracking- of advertentiecookies.
          </p>

          <h2>Bewaren en jouw rechten</h2>
          <p>
            Je mag altijd vragen welke gegevens we van je hebben, en vragen om ze aan te passen of te verwijderen.
          </p>
          <Placeholder>Bewaartermijn, contactgegevens voor privacyvragen en verwerker (e-maildienst) invullen.</Placeholder>
        </div>
      </main>
      <Footer />
    </>
  );
}
