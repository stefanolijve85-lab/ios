"use client";
import { useState } from "react";
import { comparison, pricing } from "@/config/site";
import { euro, total } from "@/lib/pricing";

export function CostComparison() {
  const [months, setMonths] = useState<12 | 36>(12);
  const rows = comparison.rows.map((r) => ({ ...r, total: total(r.oneOff, r.monthly, months) }));
  const lowest = Math.min(...rows.map((r) => r.total));
  const period = months === 12 ? "1 jaar" : "3 jaar";
  const ill = comparison.illustrative;
  return (
    <div>
      <fieldset className="toggle">
        <legend className="sr-only">Periode voor de vergelijking</legend>
        {([12, 36] as const).map((m) => (
          <label key={m}>
            <input type="radio" name="periode" checked={months === m} onChange={() => setMonths(m)} />
            <span>{m === 12 ? "1 jaar" : "3 jaar"}</span>
          </label>
        ))}
      </fieldset>
      <div className="table-scroll">
        <table className="compare">
          <caption className="sr-only">Totale kosten over {period}, per aanbieder</caption>
          <thead>
            <tr>
              <th scope="col">Aanbieder en pakket</th>
              <th scope="col" className="num">Eenmalig</th>
              <th scope="col" className="num">Per maand</th>
              <th scope="col" className="num">Totaal {period}</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map((r) => (
              <tr key={r.id} className={r.own ? "own" : undefined}>
                <th scope="row">
                  {r.name}
                  <span className="sub">
                    {r.detail}
                    {r.source && <> · <a href={r.source} rel="noopener nofollow" target="_blank">bron<span className="sr-only"> {r.name} (opent in nieuw venster)</span></a></>}
                  </span>
                </th>
                <td className="num">{euro(r.oneOff)}</td>
                <td className="num">{euro(r.monthly)}</td>
                <td className="num tot">
                  {euro(r.total)}
                  {r.total === lowest && <span className="lowest">laagste</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 16, maxWidth: "80ch" }}>
        {pricing.vatLabel}, bij gelijkblijvende tarieven, inclusief het genoemde maandpakket en zonder meerwerk. Berekend als eenmalig bedrag +{" "}
        {months} × maandbedrag. Prijzen van andere aanbieders zijn een momentopname van {comparison.checkedOn}. De pakketten verschillen in
        inhoud, eigendom, looptijd en service en zijn dus geen identieke producten; de omvang van ons basispakket wordt nog vastgelegd. Welke
        aanbieder het laagst uitkomt, hangt af van de periode: schakel tussen 1 en 3 jaar om dat te zien.
      </p>
      <p className="small muted" style={{ maxWidth: "80ch" }}>
        <strong>Illustratief rekenvoorbeeld:</strong> een website van {euro(ill.oneOff)} met {euro(ill.monthly)} per maand kost in jaar 1{" "}
        {euro(ill.oneOff)} + 12 × {euro(ill.monthly)} = {euro(total(ill.oneOff, ill.monthly, 12))}. Dit is een rekenvoorbeeld, geen marktgemiddelde.
      </p>
    </div>
  );
}
