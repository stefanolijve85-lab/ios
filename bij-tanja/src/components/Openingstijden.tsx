"use client";
import { useEffect, useState } from "react";
import { dagen, winkel, type Tijden } from "@/content/winkel";

const tekst = (t: Tijden) => (t === "gesloten" ? "Gesloten" : `${t.open.replace(":", ".")} – ${t.dicht.replace(":", ".")}`);

/** Openingstijden met "vandaag" uitgelicht. Verwijst naar de bron zolang ze niet bevestigd zijn. */
export function Openingstijden({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [vandaag, setVandaag] = useState<number | null>(null);
  useEffect(() => setVandaag((new Date().getDay() + 6) % 7), []);
  const tijden = winkel.openingstijden;
  const zacht = tone === "dark" ? "text-ink-soft" : "text-room/70";

  if (!tijden) {
    return (
      <p className={`leading-relaxed ${zacht}`}>
        De actuele openingstijden vind je op{" "}
        <a href={winkel.bronpagina} target="_blank" rel="noopener noreferrer" className="link-underline font-semibold text-bordeaux">
          de pagina van {winkel.adres.winkelcentrum}
        </a>
        . Of loop gewoon even binnen als je in het winkelcentrum bent!
      </p>
    );
  }

  return (
    <>
      <table className="w-full text-left">
        <caption className="sr-only">Openingstijden van {winkel.naam}</caption>
        <tbody>
          {dagen.map((d, i) => {
            const nu = i === vandaag;
            return (
              <tr key={d} className={`border-b border-current/10 ${nu ? "font-semibold" : ""}`} aria-current={nu ? "date" : undefined}>
                <th scope="row" className="py-2.5 pr-4 font-normal capitalize">
                  {d}
                  {nu && <span className="ml-2 rounded-full bg-honey px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-ink">vandaag</span>}
                </th>
                <td className="py-2.5 text-right tabular-nums">{tekst(tijden[d])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {winkel.openingstijdenNotitie && <p className={`mt-3 text-sm ${zacht}`}>{winkel.openingstijdenNotitie}</p>}
    </>
  );
}
