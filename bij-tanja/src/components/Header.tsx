"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { navigatie } from "./nav";
import { winkel } from "@/content/winkel";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const knop = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        knop.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled && !open;
  const light = !solid; // lichte tekst over foto of over open menu

  return (
    <>
      <a
        href="#inhoud"
        className="sr-only z-[70] rounded-full bg-honey px-5 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Direct naar de inhoud
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-soft ${
          solid ? "bg-room/90 shadow-[0_1px_0_rgba(42,36,29,.08)] backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent transition-opacity duration-500 ${
            solid || open ? "opacity-0" : "opacity-100"
          }`}
        />
        <nav aria-label="Hoofdmenu" className="relative mx-auto flex h-[var(--header-h)] max-w-page items-center justify-between px-4 sm:px-6 lg:px-10">
          <Logo tone={light ? "light" : "dark"} />

          <ul className="hidden items-center gap-1 lg:flex">
            {navigatie.map((n) => {
              const actief = pathname === n.href;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={actief ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-[0.92rem] font-medium transition-colors ${
                      light ? "text-room/90 hover:bg-white/10 hover:text-room" : "text-ink/80 hover:bg-ink/5 hover:text-ink"
                    } ${actief ? (light ? "bg-white/15 text-room" : "bg-ink/[.06] text-ink") : ""}`}
                  >
                    {n.kort ?? n.label}
                  </Link>
                </li>
              );
            })}
            <li className="ml-2">
              <Link href="/contact#langskomen" className="btn btn-honey !min-h-[2.6rem] !px-5 text-sm">
                <MapPin className="h-4 w-4" aria-hidden /> Kom langs
              </Link>
            </li>
          </ul>

          <button
            ref={knop}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobiel-menu"
            className={`relative z-[60] -mr-2 flex h-12 items-center gap-2 rounded-full px-3 text-sm font-semibold lg:hidden ${
              light ? "text-room" : "text-ink"
            }`}
          >
            <span>{open ? "Sluiten" : "Menu"}</span>
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobiel-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="grain fixed inset-0 z-40 flex flex-col bg-olive-deep text-room lg:hidden"
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.6, ease: [0.22, 0.8, 0.24, 1] }}
          >
            <div className="relative flex flex-1 flex-col justify-center px-6 pt-[var(--header-h)]">
              <p className="font-hand text-2xl text-honey-soft">Waar wil je naartoe?</p>
              <ul className="mt-6 space-y-1">
                {[{ href: "/", label: "Home", hint: "Terug naar de voordeur" }, ...navigatie].map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 0.8, 0.24, 1] }}
                  >
                    <Link
                      href={n.href}
                      aria-current={pathname === n.href ? "page" : undefined}
                      className="group flex items-baseline justify-between gap-4 border-b border-room/10 py-4"
                    >
                      <span className="display text-[2rem] leading-tight group-aria-[current=page]:text-honey">
                        {"kort" in n && n.kort ? n.kort : n.label}
                      </span>
                      <span className="text-right text-xs text-room/55">{n.hint}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="relative px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <p className="text-sm text-room/60">
                {winkel.adres.winkelcentrum}, {winkel.adres.plaats}
              </p>
              <Link href="/contact#langskomen" className="btn btn-honey mt-4 w-full">
                <MapPin className="h-4 w-4" aria-hidden /> Kom gezellig langs
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
