import { NextResponse } from "next/server";
import { business, treatments } from "@/content/site";
import { clean, EMAIL_RE, mailConfigured, rateLimited, sendMail } from "@/lib/server/mail";

/**
 * Ontvangt een reserveringsaanvraag en mailt die naar Casa Amoray (zie lib/server/mail.ts).
 * Zonder e-mailinstellingen wordt NIETS opgeslagen of verstuurd en krijgt de
 * bezoekster dat eerlijk te zien, met het telefoonnummer als alternatief.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Ongeldige aanvraag." }, { status: 400 });
  }

  // Honeypot: doe alsof het gelukt is, maar verstuur niets.
  if (clean(body.website)) return NextResponse.json({ ok: true });

  if (rateLimited(req)) {
    return NextResponse.json({ ok: false, message: "Te veel aanvragen achter elkaar. Probeer het later opnieuw." }, { status: 429 });
  }

  const treatment = treatments.find((t) => t.bookable && t.id === clean(body.behandeling));
  const data = {
    datum: clean(body.datum, 10),
    tijd: clean(body.tijd, 5),
    naam: clean(body.naam, 120),
    email: clean(body.email, 200),
    telefoon: clean(body.telefoon, 40),
    opmerkingen: clean(body.opmerkingen, 1500),
  };
  const valid =
    treatment &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.datum) &&
    (!data.tijd ||
      (/^\d{2}:\d{2}$/.test(data.tijd) && data.tijd >= business.hours.opens && data.tijd <= business.hours.closes)) &&
    data.naam.length >= 2 &&
    EMAIL_RE.test(data.email) &&
    data.telefoon.replace(/\D/g, "").length >= 9 &&
    body.toestemming;
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Niet alle gegevens zijn correct ingevuld." }, { status: 422 });
  }

  if (!mailConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: `Online aanvragen is nog niet geactiveerd. Je gegevens zijn niet verstuurd of opgeslagen. Bel of app Casa Amoray voorlopig op ${business.phone}.`,
      },
      { status: 503 },
    );
  }

  const datumNl = new Date(`${data.datum}T12:00:00`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const text = [
    `Nieuwe reserveringsaanvraag via de website`,
    ``,
    `Behandeling:    ${treatment!.name} (${treatment!.minutes} min, €${treatment!.price})`,
    `Voorkeursdatum: ${datumNl}`,
    `Voorkeurstijd:  ${data.tijd || "geen voorkeur"}`,
    ``,
    `Naam:           ${data.naam}`,
    `E-mail:         ${data.email}`,
    `Telefoon:       ${data.telefoon}`,
    ``,
    `Opmerkingen:`,
    data.opmerkingen || "-",
    ``,
    `Let op: de afspraak is nog niet bevestigd. Neem contact op met de klant.`,
  ].join("\n");

  try {
    await sendMail({ replyTo: data.email, subject: `Aanvraag: ${treatment!.name} op ${datumNl} (${data.naam})`, text });
  } catch (e) {
    console.error("Reservering versturen mislukt", e);
    return NextResponse.json(
      { ok: false, message: `Het versturen is mislukt. Probeer het later opnieuw of bel ${business.phone}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
