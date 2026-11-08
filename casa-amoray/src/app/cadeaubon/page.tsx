import type { Metadata } from "next";
import { GiftCardForm } from "@/components/GiftCardForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { business, giftCards, mapsHref } from "@/content/site";

export const metadata: Metadata = {
  title: "Cadeaubon",
  description:
    "Geef een moment voor jezelf cadeau: een cadeaubon voor een postpartummassage of ontspanningsmassage bij Casa Amoray in Emmen. Online of in de salon te koop.",
  alternates: { canonical: "/cadeaubon" },
};

export default function Cadeaubon({ searchParams }: { searchParams: { bon?: string } }) {
  return (
    <>
      <Header />
      <main id="inhoud" className="page">
        <div className="container booking">
          <div>
            <p className="eyebrow">Cadeaubon</p>
            <h1>Geef een moment voor jezelf cadeau</h1>
            <p className="lead">{giftCards.intro}</p>
            <GiftCardForm options={giftCards.options()} initial={searchParams.bon} />
          </div>

          <aside className="booking__aside" aria-labelledby="bon-in-salon">
            <h2 id="bon-in-salon">Liever in de salon?</h2>
            <p>{giftCards.ways} Kom langs bij:</p>
            <p>
              <a href={mapsHref} rel="noopener" target="_blank">
                {business.street}
                <br />
                {business.postalCode} {business.city}
              </a>
            </p>
            <p>Elke avond van {business.hours.opens} tot {business.hours.closes}.</p>
            <p>
              Of bel of app: <a href={business.phoneHref}>{business.phone}</a>
              <br />
              Mail: <a href={`mailto:${business.email}`}>{business.email}</a>
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
