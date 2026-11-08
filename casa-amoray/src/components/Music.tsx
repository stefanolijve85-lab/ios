"use client";

import { useEffect, useState } from "react";
import { isOn, start, subscribe, toggle, wantsMusic } from "@/lib/ambientMusic";

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

  // Koos de bezoeker eerder voor muziek? Start dan bij de eerste tik ergens op de pagina
  // (browsers staan geluid pas na een gebruikersactie toe).
  useEffect(() => {
    if (!wantsMusic()) return;
    const resume = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-music-toggle]")) return;
      if (!isOn()) start();
      off();
    };
    const off = () => {
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("keydown", resume, true);
    };
    window.addEventListener("pointerdown", resume, true);
    window.addEventListener("keydown", resume, true);
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
