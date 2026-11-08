"use client";

import { useEffect, useRef, useState } from "react";
import { business, euro, treatments } from "@/content/site";

type Errors = Partial<Record<"behandeling" | "datum" | "tijd" | "naam" | "email" | "telefoon" | "toestemming", string>>;
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; name: string }
  | { kind: "failed"; message: string };

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function validate(f: FormData): Errors {
  const e: Errors = {};
  const s = (k: string) => String(f.get(k) ?? "").trim();
  if (!treatments.some((t) => t.bookable && t.id === s("behandeling"))) e.behandeling = "Kies een behandeling.";
  if (!s("datum")) e.datum = "Kies een voorkeursdatum.";
  else if (s("datum") < today()) e.datum = "Kies een datum vanaf vandaag.";
  const { opens, closes } = business.hours;
  if (s("tijd") && (s("tijd") < opens || s("tijd") > closes))
    e.tijd = `Kies een tijd tussen ${opens} en ${closes}; dan is Casa Amoray open.`;
  if (s("naam").length < 2) e.naam = "Vul je naam in.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s("email"))) e.email = "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.";
  if (s("telefoon").replace(/[^\d]/g, "").length < 9) e.telefoon = "Vul een geldig telefoonnummer in.";
  if (!f.get("toestemming")) e.toestemming = "Geef toestemming om je gegevens voor deze aanvraag te gebruiken.";
  return e;
}

/**
 * Reserveringsaanvraag. Er worden GEEN tijdsloten verzonnen: de bezoekster
 * geeft een voorkeur op en Winnie bevestigt persoonlijk. Het formulier meldt
 * alleen succes als de server de aanvraag echt heeft verstuurd.
 */
export function BookingForm({ initialTreatment }: { initialTreatment?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const initial = treatments.find((t) => t.bookable && t.id === initialTreatment)?.id;

  useEffect(() => {
    if (status.kind === "sent" || status.kind === "failed") resultRef.current?.focus();
  }, [status]);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/reservering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setStatus({ kind: "sent", name: String(data.get("naam")).split(" ")[0] });
        form.reset();
      } else {
        setStatus({ kind: "failed", message: body.message || "Er ging iets mis bij het versturen." });
      }
    } catch {
      setStatus({ kind: "failed", message: "Er is geen verbinding. Controleer je internet en probeer het opnieuw." });
    }
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p className="error" id={`${k}-fout`}>
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof Errors, hint?: string) => ({
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": [hint, errors[k] ? `${k}-fout` : ""].filter(Boolean).join(" ") || undefined,
  });

  if (status.kind === "sent") {
    return (
      <div ref={resultRef} tabIndex={-1} className="notice notice--success" role="status">
        <h2>Dank je wel, {status.name}.</h2>
        <p>
          Je aanvraag is verstuurd. Winnie neemt persoonlijk contact met je op om je afspraak te bevestigen. Je
          afspraak staat pas vast na die bevestiging.
        </p>
        <button className="btn btn--outline" onClick={() => setStatus({ kind: "idle" })}>
          Nog een aanvraag doen
        </button>
      </div>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form ref={formRef} className="form" noValidate onSubmit={onSubmit} aria-describedby="form-uitleg">
      <p id="form-uitleg" className="hint">
        Velden met * zijn verplicht. Dit is een aanvraag: Winnie bevestigt je afspraak persoonlijk.
      </p>

      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} className="notice notice--error" role="alert">
          <strong>Controleer de volgende {errorList.length === 1 ? "invoer" : `${errorList.length} invoervelden`}:</strong>
          <ul>
            {errorList.map(([k, msg]) => (
              <li key={k}>
                <a href={`#veld-${k}`}>{msg}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status.kind === "failed" && (
        <div ref={resultRef} tabIndex={-1} className="notice notice--error" role="alert">
          <strong>Je aanvraag is niet verstuurd.</strong> {status.message}
        </div>
      )}

      <fieldset className="fieldset" aria-describedby={errors.behandeling ? "behandeling-fout" : undefined}>
        <legend id="veld-behandeling" tabIndex={-1}>Behandeling *</legend>
        <div className="choice-list">
          {treatments.map((t) => (
            <label key={t.id} className="choice">
              <input
                type="radio"
                name="behandeling"
                value={t.id}
                defaultChecked={t.id === initial}
                disabled={!t.bookable}
              />
              <span className="choice__box">
                <span className="choice__name">{t.name}</span>
                <span className="choice__meta">
                  {t.comingSoon ? "Binnenkort" : `${t.minutes} min · ${t.price !== null ? euro(t.price) : ""}`}
                </span>
              </span>
            </label>
          ))}
        </div>
        {err("behandeling")}
      </fieldset>

      <div className="row-2">
        <div className="field">
          <label className="label" htmlFor="veld-datum">Voorkeursdatum *</label>
          <input className="input" id="veld-datum" name="datum" type="date" min={today()} {...a11y("datum")} />
          {err("datum")}
        </div>
        <div className="field">
          <label className="label" htmlFor="veld-tijd">Voorkeurstijd</label>
          <p className="hint" id="tijd-hint">
            Optioneel, tussen {business.hours.opens} en {business.hours.closes}. Winnie stemt de precieze tijd met je af.
          </p>
          <input
            className="input"
            id="veld-tijd"
            name="tijd"
            type="time"
            min={business.hours.opens}
            max={business.hours.closes}
            step={900}
            aria-invalid={errors.tijd ? true : undefined}
            aria-describedby={`tijd-hint${errors.tijd ? " tijd-fout" : ""}`}
          />
          {err("tijd")}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="veld-naam">Naam *</label>
        <input className="input" id="veld-naam" name="naam" autoComplete="name" {...a11y("naam")} />
        {err("naam")}
      </div>

      <div className="row-2">
        <div className="field">
          <label className="label" htmlFor="veld-email">E-mailadres *</label>
          <input className="input" id="veld-email" name="email" type="email" inputMode="email" autoComplete="email" {...a11y("email")} />
          {err("email")}
        </div>
        <div className="field">
          <label className="label" htmlFor="veld-telefoon">Telefoonnummer *</label>
          <input className="input" id="veld-telefoon" name="telefoon" type="tel" inputMode="tel" autoComplete="tel" {...a11y("telefoon")} />
          {err("telefoon")}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="veld-opmerkingen">Opmerkingen</label>
        <p className="hint" id="opm-hint">
          Bijvoorbeeld hoe lang geleden je bevallen bent, of iets waar Winnie rekening mee kan houden.
        </p>
        <textarea className="input" id="veld-opmerkingen" name="opmerkingen" rows={4} maxLength={1500} aria-describedby="opm-hint" />
      </div>

      {/* Honeypot tegen spam — onzichtbaar voor mensen */}
      <div className="hp" aria-hidden="true">
        <label>
          Laat dit veld leeg
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="field">
        <label className="check" id="veld-toestemming">
          <input type="checkbox" name="toestemming" value="ja" {...a11y("toestemming")} />
          <span>
            Ik geef toestemming om mijn gegevens, inclusief eventuele gezondheidsinformatie die ik zelf deel, te gebruiken voor het afhandelen van deze aanvraag. Lees de{" "}
            <a href="/privacy">privacyverklaring</a>. *
          </span>
        </label>
        {err("toestemming")}
      </div>

      <button className="btn btn--large btn--block" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Bezig met versturen…" : "Verstuur aanvraag"}
      </button>
    </form>
  );
}
