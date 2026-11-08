"use client";

import { useRef, useState } from "react";
import { euro, type Treatment } from "@/content/site";

type Errors = Partial<Record<"bon" | "naam" | "email" | "toestemming", string>>;

/**
 * Cadeaubon bestellen. Na verzenden gaat de bezoekster naar de beveiligde
 * betaalpagina van Mollie (iDEAL e.d.). Er wordt niets als 'betaald' getoond
 * voordat Mollie dat bevestigt.
 */
export function GiftCardForm({ options, initial }: { options: Treatment[]; initial?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const failRef = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState(options.find((o) => o.id === initial)?.id ?? "");

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    const s = (k: string) => String(data.get(k) ?? "").trim();
    const e: Errors = {};
    if (!options.some((o) => o.id === s("bon"))) e.bon = "Kies een cadeaubon.";
    if (s("naam").length < 2) e.naam = "Vul je naam in.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s("email"))) e.email = "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.";
    if (!data.get("toestemming")) e.toestemming = "Geef toestemming om je gegevens voor deze bestelling te gebruiken.";
    setErrors(e);
    setFailure(null);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/cadeaubon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok && body.checkoutUrl) {
        window.location.assign(body.checkoutUrl);
        return;
      }
      setFailure(body.message || "Er ging iets mis bij het starten van de betaling.");
    } catch {
      setFailure("Er is geen verbinding. Controleer je internet en probeer het opnieuw.");
    }
    setSending(false);
    requestAnimationFrame(() => failRef.current?.focus());
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p className="error" id={`${k}-fout`}>
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `${k}-fout` : undefined,
  });
  const price = options.find((o) => o.id === chosen)?.price;
  const errorList = Object.entries(errors);

  return (
    <form className="form" noValidate onSubmit={onSubmit}>
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} className="notice notice--error" role="alert">
          <strong>Controleer de volgende {errorList.length === 1 ? "invoer" : `${errorList.length} invoervelden`}:</strong>
          <ul>
            {errorList.map(([k, msg]) => (
              <li key={k}>
                <a href={`#bon-${k}`}>{msg}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {failure && (
        <div ref={failRef} tabIndex={-1} className="notice notice--error" role="alert">
          <strong>Er is niets afgerekend.</strong> {failure}
        </div>
      )}

      <fieldset className="fieldset" aria-describedby={errors.bon ? "bon-fout" : undefined}>
        <legend id="bon-bon" tabIndex={-1}>Kies de cadeaubon *</legend>
        <div className="choice-list">
          {options.map((o) => (
            <label key={o.id} className="choice">
              <input type="radio" name="bon" value={o.id} checked={chosen === o.id} onChange={() => setChosen(o.id)} />
              <span className="choice__box">
                <span className="choice__name">{o.name}</span>
                <span className="choice__meta">
                  {o.minutes} min · {euro(o.price!)}
                </span>
              </span>
            </label>
          ))}
        </div>
        {err("bon")}
      </fieldset>

      <div className="row-2">
        <div className="field">
          <label className="label" htmlFor="bon-naam">Jouw naam *</label>
          <input className="input" id="bon-naam" name="naam" autoComplete="name" {...a11y("naam")} />
          {err("naam")}
        </div>
        <div className="field">
          <label className="label" htmlFor="bon-email">Jouw e-mailadres *</label>
          <input className="input" id="bon-email" name="email" type="email" inputMode="email" autoComplete="email" {...a11y("email")} />
          {err("email")}
        </div>
      </div>

      <div className="row-2">
        <div className="field">
          <label className="label" htmlFor="bon-telefoon">Telefoonnummer</label>
          <input className="input" id="bon-telefoon" name="telefoon" type="tel" inputMode="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label className="label" htmlFor="bon-voor">Voor wie is de bon?</label>
          <input className="input" id="bon-voor" name="voor" autoComplete="off" />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="bon-boodschap">Persoonlijke boodschap</label>
        <p className="hint" id="boodschap-hint">Optioneel, maximaal 300 tekens.</p>
        <textarea className="input" id="bon-boodschap" name="boodschap" rows={3} maxLength={300} aria-describedby="boodschap-hint" />
      </div>

      <div className="hp" aria-hidden="true">
        <label>
          Laat dit veld leeg
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="field">
        <label className="check" id="bon-toestemming">
          <input type="checkbox" name="toestemming" value="ja" {...a11y("toestemming")} />
          <span>
            Ik geef toestemming om mijn gegevens te gebruiken voor het afhandelen van deze bestelling. Lees de{" "}
            <a href="/privacy">privacyverklaring</a>. *
          </span>
        </label>
        {err("toestemming")}
      </div>

      <button className="btn btn--large btn--block" type="submit" disabled={sending}>
        {sending ? "Je gaat naar de betaalpagina…" : price ? `Bestellen en betalen · ${euro(price)}` : "Bestellen en betalen"}
      </button>
      <p className="hint">Je betaalt veilig via Mollie (bijvoorbeeld met iDEAL).</p>
    </form>
  );
}
