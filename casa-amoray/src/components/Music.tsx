"use client";

import { useEffect, useState } from "react";
import { autoStartAllowed, isOn, start, subscribe, toggle } from "@/lib/ambientMusic";

function useMusic() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const unsub = subscribe(setOn);
    return () => {
      unsub();
    };
  }, []);
  return on;
}

/** Klein rond knopje in de menubalk: muziek aan/uit. */
export function MusicButton() {
  const on = useMusic();

  // Start de muziek bij de eerste tik ergens op de pagina (tenzij de bezoeker hem eerder
  // zelf uitzette). Scrollen telt niet: browsers staan geluid pas toe na een echte tik/klik
  // of toetsaanslag. Op iOS geldt dat bij het loslaten (touchend/pointerup), niet bij aanraken.
  useEffect(() => {
    if (!autoStartAllowed()) return;
    const events = ["pointerup", "touchend", "click", "keydown"] as const;
    let busy = false;
    const off = () => events.forEach((ev) => window.removeEventListener(ev, tryStart, true));
    const tryStart = (e: Event) => {
      if (busy || isOn()) return off();
      if ((e.target as HTMLElement | null)?.closest?.("[data-music-toggle]")) return;
      busy = true;
      start(true).then((ok) => {
        busy = false;
        if (ok) off(); // gelukt; anders blijven luisteren (bv. na een veeg in plaats van een tik)
      });
    };
    events.forEach((ev) => window.addEventListener(ev, tryStart, true));
    return off;
  }, []);

  return (
    <button
      type="button"
      className={`music-button ${on ? "is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Rustige muziek uitzetten" : "Rustige muziek aanzetten"}
      title={on ? "Muziek uit" : "Muziek aan"}
      data-music-toggle
      onClick={() => toggle()}
    >
      <span className="music-button__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}

/** Uitnodiging in de opening. */
export function MusicInvite({ className = "" }: { className?: string }) {
  const on = useMusic();
  return (
    <button
      type="button"
      className={`music-invite ${className}`}
      aria-pressed={on}
      aria-label={on ? "Rustige muziek uitzetten" : "Rustige muziek aanzetten"}
      data-music-toggle
      onClick={() => toggle()}
    >
      <span aria-hidden="true">♪ </span>
      {on ? "Muziek uit" : "Rustige muziek"}
    </button>
  );
}
