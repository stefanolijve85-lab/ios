import { NextResponse } from "next/server";
import { treatments } from "@/content/site";

/**
 * Ontvangt een reserveringsaanvraag en mailt die naar Casa Amoray.
 *
 * Verzending via Resend (https://resend.com). Benodigde omgevingsvariabelen:
 *   RESEND_API_KEY       API-sleutel van Resend
 *   BOOKING_EMAIL_TO     e-mailadres van Winnie
 *   BOOKING_EMAIL_FROM   afzender op een geverifieerd domein, bv. "Casa Amoray <reserveren@jouwdomein.nl>"
 *
 * Zonder deze instellingen wordt NIETS opgeslagen of verstuurd en krijgt de
 * bezoekster dat eerlijk te zien. Er is dus nooit een schijnbevestiging.
 */

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v: unknown, max = 200) => String(v ?? "").replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, max);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Ongeldige aanvraag." }, { status: 400 });
  }

  // Honeypot: doe alsof het gelukt is, maar verstuur niets.
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "onbekend";
  if (rateLimited(ip)) {
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
    (!data.tijd || /^\d{2}:\d{2}$/.test(data.tijd)) &&
    data.naam.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email) &&
    data.telefoon.replace(/\D/g, "").length >= 9 &&
    body.toestemming;
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Niet alle gegevens zijn correct ingevuld." }, { status: 422 });
  }

  const { RESEND_API_KEY, BOOKING_EMAIL_TO, BOOKING_EMAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !BOOKING_EMAIL_TO || !BOOKING_EMAIL_FROM) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Online aanvragen is nog niet geactiveerd. Je gegevens zijn niet verstuurd of opgeslagen. Neem voorlopig rechtstreeks contact op met Casa Amoray.",
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: BOOKING_EMAIL_FROM,
        to: [BOOKING_EMAIL_TO],
        reply_to: data.email,
        subject: `Aanvraag: ${treatment!.name} op ${datumNl} (${data.naam})`,
        text,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
  } catch (e) {
    console.error("Reservering versturen mislukt", e);
    return NextResponse.json(
      { ok: false, message: "Het versturen is mislukt. Probeer het later opnieuw of neem rechtstreeks contact op." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
