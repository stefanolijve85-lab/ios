import type { Metadata } from "next";
import { contact } from "@/config/site";
import { Cta } from "@/components/Cta";
import { PriceBlock } from "@/components/Price";

export const metadata: Metadata = {
  title: "Contact en aanvraag",
  description: "Start je aanvraag voor een website via de visuele intake. Je ziet eerst je overzicht en de afspraken.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  const has = contact.email || contact.phone || contact.whatsapp;
  return (
    <section className="page-head">
      <div className="wrap two">
        <div>
          <p className="eyebrow">Contact / aanvraag</p>
          <h1>Start je aanvraag.</h1>
          <p className="lead">De snelste weg is de visuele intake: je kiest stap voor stap wat bij je bedrijf past en verstuurt je aanvraag. Je kunt tussendoor bewaren en later verdergaan.</p>
          <PriceBlock />
          <div className="btn-row"><Cta location="contact" label="Stel mijn website samen" /></div>
          <p className="small muted" style={{ marginTop: 14 }}>Een aanvraag versturen is geen bestelling. Je betaalt niets via deze website.</p>
        </div>
        <div>
          <h2>Rechtstreeks contact</h2>
          {has ? (
            <ul className="ticks plain">
              {contact.email && <li>E-mail: <a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
              {contact.phone && <li>Telefoon: <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>}
              {contact.whatsapp && <li>WhatsApp: <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}>{contact.whatsapp}</a></li>}
              {contact.address && <li>{contact.address}</li>}
            </ul>
          ) : (
            <p className="note">Onze contactgegevens worden nog toegevoegd. Tot die tijd bereik je ons via de aanvraag: daarin laat je je e-mailadres achter en nemen wij contact met je op.</p>
          )}
        </div>
      </div>
    </section>
  );
}
