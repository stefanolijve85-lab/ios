import { NextResponse } from "next/server";
import { business, giftCards, siteUrl } from "@/content/site";
import { clean, EMAIL_RE, rateLimited } from "@/lib/server/mail";
import { createPayment, mollieConfigured, updateRedirect } from "@/lib/server/mollie";

/**
 * Start de online betaling van een cadeaubon via Mollie.
 * De bestelgegevens gaan mee als metadata van de betaling (geen eigen database nodig).
 * Pas als Mollie de betaling als 'paid' meldt (webhook), krijgt Casa Amoray de bestelling per e-mail.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Ongeldige aanvraag." }, { status: 400 });
  }
  if (clean(body.website)) return NextResponse.json({ ok: false, message: "Ongeldige aanvraag." }, { status: 400 });
  if (rateLimited(req)) {
    return NextResponse.json({ ok: false, message: "Te veel pogingen achter elkaar. Probeer het later opnieuw." }, { status: 429 });
  }

  const option = giftCards.options().find((t) => t.id === clean(body.bon));
  const data = {
    naam: clean(body.naam, 100),
    email: clean(body.email, 150),
    telefoon: clean(body.telefoon, 30),
    voor: clean(body.voor, 80),
    boodschap: clean(body.boodschap, 300),
  };
  if (!option || data.naam.length < 2 || !EMAIL_RE.test(data.email) || !body.toestemming) {
    return NextResponse.json({ ok: false, message: "Niet alle gegevens zijn correct ingevuld." }, { status: 422 });
  }

  if (!mollieConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: `Online betalen is nog niet geactiveerd; er is niets afgeschreven of opgeslagen. Je kunt een cadeaubon kopen in de salon (${business.street}, ${business.city}) of bellen naar ${business.phone}.`,
      },
      { status: 503 },
    );
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl);
  try {
    const payment = await createPayment({
      amount: option.price!,
      description: `Cadeaubon Casa Amoray: ${option.name}`,
      redirectUrl: `${siteUrl}/cadeaubon/bedankt`,
      // Mollie kan localhost niet bereiken; lokaal testen werkt dan zonder webhook-mail.
      webhookUrl: isLocal ? undefined : `${siteUrl}/api/cadeaubon/webhook`,
      metadata: {
        type: "cadeaubon",
        bon: option.id,
        naam: data.naam,
        email: data.email,
        telefoon: data.telefoon,
        voor: data.voor,
        boodschap: data.boodschap,
      },
    });
    await updateRedirect(payment.id, `${siteUrl}/cadeaubon/bedankt?id=${payment.id}`);
    const checkout = payment._links.checkout?.href;
    if (!checkout) throw new Error("Geen checkout-link");
    return NextResponse.json({ ok: true, checkoutUrl: checkout });
  } catch (e) {
    console.error("Cadeaubon-betaling aanmaken mislukt", e);
    return NextResponse.json(
      { ok: false, message: `Het starten van de betaling is mislukt. Probeer het later opnieuw of bel ${business.phone}.` },
      { status: 502 },
    );
  }
}
