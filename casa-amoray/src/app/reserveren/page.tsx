import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { business, treatmentNote } from "@/content/site";

export const metadata: Metadata = {
  title: "Reserveren",
  description: "Vraag eenvoudig je postpartummassage of ontspanningsmassage aan bij Casa Amoray in Emmen.",
  alternates: { canonical: "/reserveren" },
};

/** Optioneel extern boekingssysteem (bijv. Salonized). Als dit is ingesteld, staat het bovenaan. */
const externalBookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

export default function Reserveren({ searchParams }: { searchParams: { behandeling?: string } }) {
  return (
    <>
      <Header />
      <main id="inhoud" className="page">
        <div className="container booking">
          <div>
            <p className="eyebrow">Reserveren</p>
            <h1>Boek jouw moment</h1>
            <p className="lead">
              Kies een behandeling en je voorkeursmoment. Winnie neemt persoonlijk contact met je op om je afspraak
              te bevestigen.
            </p>
            {externalBookingUrl && (
              <p>
                <a className="btn btn--large" href={externalBookingUrl} rel="noopener">
                  Bekijk de agenda en boek direct
                </a>
              </p>
            )}
            <BookingForm initialTreatment={searchParams.behandeling} />
          </div>

          <aside className="booking__aside" aria-labelledby="goed-om-te-weten">
            <h2 id="goed-om-te-weten">Goed om te weten</h2>
            <ul>
              <li>{treatmentNote}</li>
              <li>{business.availabilityNote}</li>
              <li>{business.name} is er uitsluitend voor vrouwen.</li>
            </ul>
            <p className="booking__contact">
              Liever bellen of appen? <a href={business.phoneHref}>{business.phone}</a>
              <br />
              {business.street}, {business.postalCode} {business.city}
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
