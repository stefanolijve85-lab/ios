import { NextResponse } from "next/server";
import { business, euro, giftCards } from "@/content/site";
import { mailConfigured, sendMail } from "@/lib/server/mail";
import { getPayment, isPaymentId, mollieConfigured } from "@/lib/server/mollie";

/**
 * Mollie roept deze URL aan bij elke statuswijziging, met alleen het betaal-id.
 * We halen de echte status zelf op bij Mollie (de aanroep zelf is niet te vertrouwen)
 * en mailen de bestelling pas als de betaling 'paid' is.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const id = String(form?.get("id") ?? "");
  if (!isPaymentId(id) || !mollieConfigured()) return new NextResponse(null, { status: 200 });

  let payment;
  try {
    payment = await getPayment(id);
  } catch (e) {
    console.error("Webhook: betaling ophalen mislukt", e);
    return new NextResponse(null, { status: 500 }); // Mollie probeert het later opnieuw
  }

  const m = payment.metadata;
  if (payment.status !== "paid" || m?.type !== "cadeaubon") return new NextResponse(null, { status: 200 });
  if (!mailConfigured()) {
    console.error(`Cadeaubon ${id} is betaald, maar e-mail is niet geconfigureerd. Bekijk de betaling in Mollie.`);
    return new NextResponse(null, { status: 200 });
  }

  const option = giftCards.options().find((t) => t.id === m.bon);
  const bon = option ? `${option.name} (${euro(option.price!)})` : payment.description;
  const delivery = giftCards.delivery.find((d) => d.id === m.levering);
  const digital = m.levering === "digitaal";
  try {
    await sendMail({
      replyTo: m.email,
      subject: `Cadeaubon betaald: ${bon} (${m.naam})`,
      text: [
        `Er is online een cadeaubon besteld en betaald.`,
        ``,
        `Cadeaubon:      ${bon}`,
        `Bedrag:         € ${payment.amount.value.replace(".", ",")}`,
        `Mollie-id:      ${payment.id}`,
        ``,
        `Besteld door:   ${m.naam}`,
        `E-mail:         ${m.email}`,
        `Telefoon:       ${m.telefoon || "-"}`,
        `Voor:           ${m.voor || "-"}`,
        `Ontvangen:      ${delivery?.label ?? "onbekend"}${digital ? ` (naar ${m.email})` : ""}`,
        ``,
        `Persoonlijke boodschap:`,
        m.boodschap || "-",
        ``,
        digital
          ? `Stuur de cadeaubon digitaal naar ${m.email}.`
          : `De koper haalt de cadeaubon op in de salon. Leg hem klaar.`,
      ].join("\n"),
    });
  } catch (e) {
    console.error("Webhook: e-mail aan Casa Amoray mislukt", e);
    return new NextResponse(null, { status: 500 }); // opnieuw proberen
  }
  // Bevestiging aan de koper: een mislukking hier mag geen dubbele mail aan Winnie veroorzaken.
  try {
    await sendMail({
      to: m.email,
      subject: `Bedankt voor je cadeaubon van ${business.name}`,
      text: [
        `Hoi ${m.naam.split(" ")[0]},`,
        ``,
        `Bedankt voor je bestelling. Je betaling voor de cadeaubon "${bon}" is ontvangen.`,
        digital
          ? `Winnie stuurt de cadeaubon digitaal naar dit e-mailadres.`
          : `Je kunt de cadeaubon ophalen in de salon, elke avond tussen ${business.hours.opens} en ${business.hours.closes}.`,
        ``,
        `Hartelijke groet,`,
        `${business.name}`,
        `${business.street}, ${business.postalCode} ${business.city}`,
        `${business.phone}`,
      ].join("\n"),
    });
  } catch (e) {
    console.error("Webhook: bevestiging aan koper mislukt", e);
  }
  return new NextResponse(null, { status: 200 });
}
