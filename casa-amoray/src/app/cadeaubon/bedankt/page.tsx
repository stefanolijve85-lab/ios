import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { business, giftCards } from "@/content/site";
import { getPayment, isPaymentId, mollieConfigured, type MolliePayment } from "@/lib/server/mollie";

export const metadata: Metadata = { title: "Cadeaubon", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Toont de échte betaalstatus, opgehaald bij Mollie. */
export default async function Bedankt({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id ?? "";
  let status: MolliePayment["status"] | "unknown" = "unknown";
  let levering: string | undefined;
  if (isPaymentId(id) && mollieConfigured()) {
    try {
      const p = await getPayment(id);
      status = p.status;
      levering = p.metadata?.levering;
    } catch {
      status = "unknown";
    }
  }

  const content =
    status === "paid"
      ? {
          title: "Dank je wel!",
          text: `Je betaling is gelukt en je cadeaubon is besteld. Je ontvangt een bevestiging per e-mail. ${
            giftCards.delivery.find((d) => d.id === levering)?.hint ?? ""
          }`,
        }
      : status === "open" || status === "pending" || status === "authorized"
        ? {
            title: "Je betaling wordt verwerkt",
            text: "Zodra de betaling rond is, ontvang je een bevestiging per e-mail. Ververs deze pagina over een minuutje om de status te zien.",
          }
        : status === "canceled" || status === "expired" || status === "failed"
          ? {
              title: "De betaling is niet gelukt",
              text: "Er is niets afgeschreven. Je kunt het opnieuw proberen, of de cadeaubon in de salon kopen.",
            }
          : {
              title: "We konden de status niet ophalen",
              text: `Twijfel je of je bestelling gelukt is? Neem contact op via ${business.phone}.`,
            };

  return (
    <>
      <Header />
      <main id="inhoud" className="page">
        <div className="container prose">
          <p className="eyebrow">Cadeaubon</p>
          <h1>{content.title}</h1>
          <p className="lead">{content.text}</p>
          {status !== "paid" && (
            <p>
              <a className="btn" href="/cadeaubon">
                Terug naar cadeaubonnen
              </a>
            </p>
          )}
          {status === "paid" && (
            <p>
              <a className="btn btn--outline" href="/">
                Terug naar de homepage
              </a>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
