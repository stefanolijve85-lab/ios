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
            Concepttekst. Laat deze controleren en vul KvK-nummer en e-mailadres aan vóór livegang.
          </Placeholder>

          <h2>Welke gegevens</h2>
          <p>
            Als je via deze website een afspraak aanvraagt, ontvangt {business.name} je naam, e-mailadres,
            telefoonnummer, de gekozen behandeling, je voorkeursdatum en -tijd en eventuele opmerkingen. Deel in
            opmerkingen alleen wat nodig is; gezondheidsinformatie gebruiken we uitsluitend om de behandeling op jou
            af te stemmen.
          </p>

          <p>
            Bestel je een cadeaubon, dan ontvangen we je naam, e-mailadres, eventueel je telefoonnummer, voor wie de
            bon is en je persoonlijke boodschap. De betaling loopt via betaaldienst Mollie; je betaalgegevens
            (zoals je bankrekening) worden door Mollie verwerkt en niet door deze website opgeslagen.
          </p>

          <h2>Waarvoor</h2>
          <p>
            Uitsluitend om je aanvraag of bestelling af te handelen: je afspraak bevestigen, je cadeaubon leveren en
            contact met je opnemen daarover. We gebruiken je gegevens niet voor nieuwsbrieven of reclame en verkopen ze nooit aan
            derden.
          </p>

          <h2>Hoe</h2>
          <p>
            Je aanvraag of bestelling wordt per e-mail naar {business.name} gestuurd. De website zelf slaat je gegevens niet op in
            een database en gebruikt geen tracking- of advertentiecookies.
          </p>

          <h2>Bewaren en jouw rechten</h2>
          <p>
            Je mag altijd vragen welke gegevens we van je hebben, en vragen om ze aan te passen of te verwijderen.
          </p>
          <p>
            Vragen over privacy? Neem contact op met {business.name}, {business.street}, {business.postalCode}{" "}
            {business.city}, telefoon {business.phone}.
          </p>
          <Placeholder>Bewaartermijn, e-mailadres en KvK-nummer aanvullen; verwerkers: Resend (e-mail) en Mollie (betalingen).</Placeholder>
        </div>
      </main>
      <Footer />
    </>
  );
}
