import { Header, StickyBooking } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JourneyProgress, RevealObserver } from "@/components/scrolly/Ambient";
import { SceneStage } from "@/components/scrolly/SceneStage";
import { AboutWinnie, Faq, FinalCta, Footer, GiftAndContact, Treatments } from "@/components/Sections";
import { scenes } from "@/content/scenes";
import { business, faqs, siteUrl, treatments } from "@/content/site";

function JsonLd() {
  // Alleen feiten die vaststaan. Adres/telefoon worden toegevoegd zodra ze bekend zijn.
  const data = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: business.name,
    slogan: business.slogan,
    url: siteUrl,
    image: `${siteUrl}/media/og-casa-amoray.jpg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.city,
      addressCountry: business.country,
      ...(business.street ? { streetAddress: business.street, postalCode: business.postalCode } : {}),
    },
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: business.hours.days,
      opens: business.hours.opens,
      closes: business.hours.closes,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Massages",
      itemListElement: treatments
        .filter((t) => t.bookable && t.price !== null)
        .map((t) => ({
          "@type": "Offer",
          price: t.price,
          priceCurrency: "EUR",
          itemOffered: { "@type": "Service", name: t.name, description: t.short },
        })),
    },
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}

export default function Home() {
  return (
    <>
      <Header overlay />
      <main id="inhoud">
        <Hero />
        <section className="journey" aria-labelledby="beleving-titel">
          {/* Anker valt op het moment dat scène 2 volledig in beeld is (na de overgang). */}
          <span id="beleving" className="journey__anchor" aria-hidden="true" />
          <div className="journey__intro container">
            <h2 id="beleving-titel" className="visually-hidden">
              De beleving: een bezoek aan Casa Amoray
            </h2>
            <a className="skip-journey" href="#behandelingen">
              Sla de beleving over en ga naar de behandelingen
            </a>
          </div>
          {scenes.map((scene, i) => (
            <SceneStage key={scene.id} scene={scene} index={i} isLast={i === scenes.length - 1} />
          ))}
        </section>
        <Treatments />
        <AboutWinnie />
        <Faq />
        <GiftAndContact />
        <FinalCta />
      </main>
      <Footer />
      <StickyBooking />
      <JourneyProgress />
      <RevealObserver />
      <JsonLd />
    </>
  );
}
