"use client";

import { useEffect, useRef, useState } from "react";
import { bookingHref, nav } from "@/content/site";

/**
 * Navigatie. Op de homepage ligt hij transparant over de hero en wordt hij
 * na het scrollen crèmekleurig. De knop "Reserveren" is altijd bereikbaar.
 */
export function Header({ overlay = false }: { overlay?: boolean }) {
  const [solid, setSolid] = useState(!overlay);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  // Menu: Escape sluit, focus blijft in het menu, pagina scrollt niet mee.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current!;
    const focusables = () => Array.from(menu.querySelectorAll<HTMLElement>("a, button"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Tab") {
        const f = focusables();
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

  const light = !solid && !open;

  return (
    <header className={`site-header ${solid ? "is-solid" : ""} ${light ? "is-light" : ""}`}>
      <a className="skip-link" href="#inhoud">
        Naar de inhoud
      </a>
      <div className="site-header__bar">
        <a className="site-header__logo" href="/#top" aria-label="Casa Amoray, naar de homepage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={light ? "/media/brand/wordmark-cream.png" : "/media/brand/wordmark-dark.png"} alt="" width={591} height={253} />
        </a>

        <nav className="site-nav" aria-label="Hoofdmenu">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a className={`btn btn--small ${light ? "btn--light" : ""}`} href={bookingHref}>
          Reserveren
        </a>
        <button
          ref={buttonRef}
          className="menu-button"
          aria-expanded={open}
          aria-controls="mobiel-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="menu-button__icon" aria-hidden="true" />
          <span className="visually-hidden">{open ? "Menu sluiten" : "Menu openen"}</span>
        </button>
      </div>

      <div
        ref={menuRef}
        id="mobiel-menu"
        className={`mobile-menu ${open ? "is-open" : ""}`}
        hidden={!open}
      >
        <nav aria-label="Mobiel menu">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="btn btn--block" href={bookingHref} onClick={() => setOpen(false)}>
          Boek jouw moment
        </a>
        <button className="mobile-menu__close" onClick={() => setOpen(false)}>
          Sluiten
        </button>
      </div>
    </header>
  );
}

/**
 * Subtiele, zwevende boekknop op mobiel. Verschijnt na de hero en
 * verdwijnt zodra het reserveringsblok in beeld is.
 */
export function StickyBooking() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const end = document.getElementById("reserveren");
    let pastHero = false;
    let atEnd = false;
    const update = () => setShow(pastHero && !atEnd);
    const onScroll = () => {
      pastHero = window.scrollY > window.innerHeight * 0.9;
      update();
    };
    const io = end
      ? new IntersectionObserver((e) => {
          atEnd = e[0].isIntersecting;
          update();
        })
      : null;
    if (end) io!.observe(end);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);
  return (
    <div className={`sticky-booking ${show ? "is-visible" : ""}`} aria-hidden={!show}>
      <a className="btn btn--block" href={bookingHref} tabIndex={show ? 0 : -1}>
        Boek jouw moment
      </a>
    </div>
  );
}
