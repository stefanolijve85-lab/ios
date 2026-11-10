import type { Metadata } from "next";
import { winkel, dagen } from "@/content/winkel";
import { fotos } from "@/content/fotos";

export const basisUrl = () => winkel.siteUrl.replace(/\/$/, "");

export function paginaMeta({ titel, beschrijving, pad, foto }: { titel: string; beschrijving: string; pad: string; foto?: string }): Metadata {
  const beeld = fotos.find((f) => f.bestand === foto) ?? fotos.find((f) => f.hero)!;
  return {
    title: titel,
    description: beschrijving,
    alternates: { canonical: pad },
    openGraph: {
      title: titel,
      description: beschrijving,
      url: pad,
      siteName: winkel.naam,
      locale: "nl_NL",
      type: "website",
      images: [{ url: beeld.src, width: beeld.width, height: beeld.height, alt: beeld.alt }],
    },
    twitter: { card: "summary_large_image", title: titel, description: beschrijving, images: [beeld.src] },
  };
}

const schemaDag: Record<string, string> = {
  maandag: "Monday", dinsdag: "Tuesday", woensdag: "Wednesday", donderdag: "Thursday",
  vrijdag: "Friday", zaterdag: "Saturday", zondag: "Sunday",
};

/** LocalBusiness structured data — uitsluitend met gegevens die in winkel.ts bevestigd zijn. */
export function localBusinessJsonLd() {
  const base = basisUrl();
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${base}/#winkel`,
    name: winkel.naam,
    slogan: winkel.slogan,
    description: "Kaaswinkel met noten, wijn, bubbels, speciaalbier, sapjes, snoep, worstjes, delicatessen en cadeaupakketten in Winkelcentrum Angelslo, Emmen.",
    url: base,
    image: fotos.filter((f) => f.categorie === "winkel" || f.categorie === "kaas").map((f) => base + f.src),
    address: {
      "@type": "PostalAddress",
      ...(winkel.adres.straat ? { streetAddress: winkel.adres.straat } : {}),
      ...(winkel.adres.postcode ? { postalCode: winkel.adres.postcode } : {}),
      addressLocality: winkel.adres.plaats,
      addressRegion: winkel.adres.provincie,
      addressCountry: winkel.adres.land,
    },
    containedInPlace: { "@type": "ShoppingCenter", name: winkel.adres.winkelcentrum },
  };
  if (winkel.telefoon) data.telephone = winkel.telefoon;
  if (winkel.email) data.email = winkel.email;
  if (winkel.social.length) data.sameAs = winkel.social.map((s) => s.url);
  if (winkel.openingstijden) {
    const tijden = winkel.openingstijden;
    data.openingHoursSpecification = dagen
      .filter((d) => tijden[d] !== "gesloten")
      .map((d) => {
        const t = tijden[d] as { open: string; dicht: string };
        return { "@type": "OpeningHoursSpecification", dayOfWeek: schemaDag[d], opens: t.open, closes: t.dicht };
      });
  }
  return data;
}
