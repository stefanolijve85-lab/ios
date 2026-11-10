import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { Foto } from "./Foto";
import { Reveal } from "./Reveal";
import { Openingstijden } from "./Openingstijden";
import { teksten } from "@/content/teksten";
import { winkel, adresRegel, routeUrl } from "@/content/winkel";

/** Scène 9 — kom gezellig langs (adres, tijden, contact, route) */
export function Langskomen({ kopNiveau = "h2" }: { kopNiveau?: "h1" | "h2" }) {
  const t = teksten.langskomen;
  const Kop = kopNiveau;
  const contact = [
    winkel.telefoon && { icon: Phone, label: "Bel ons", waarde: winkel.telefoon, href: `tel:${winkel.telefoon.replace(/\s/g, "")}` },
    winkel.whatsapp && { icon: MessageCircle, label: "WhatsApp", waarde: "Stuur een appje", href: `https://wa.me/${winkel.whatsapp}` },
    winkel.email && { icon: Mail, label: "Mail", waarde: winkel.email, href: `mailto:${winkel.email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; waarde: string; href: string }[];

  return (
    <section id="langskomen" aria-labelledby="langskomen-titel" className="relative overflow-hidden bg-room-deep">
      <div className="mx-auto grid max-w-[96rem] md:grid-cols-2">
        <div className="relative min-h-[60svh] md:min-h-full">
          <Foto bestand="tanja-zwaait.jpg" sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d2214]/70 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#1d2214]/10" />
          <p className="absolute bottom-6 left-5 right-5 font-hand text-4xl leading-none text-room md:hidden">Tot zo!</p>
        </div>

        <div className="px-4 py-16 sm:px-10 md:py-28 lg:px-16">
          <Reveal>
            <p className="label text-bordeaux">{t.label}</p>
            <Kop id="langskomen-titel" className="display mt-5 text-[clamp(2.4rem,5.5vw,4.4rem)] leading-[1] text-olive-deep">
              We zien je graag <em className="text-bordeaux">Bij Tanja!</em>
            </Kop>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{t.sub}</p>
          </Reveal>

          <Reveal delay={0.08} className="mt-10 space-y-8">
            <div className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-bordeaux" aria-hidden />
              <div>
                <h3 className="label text-ink-soft">Adres</h3>
                <address className="mt-2 text-lg not-italic text-ink">{adresRegel()}</address>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-bordeaux" aria-hidden />
              <div className="flex-1">
                <h3 className="label text-ink-soft">Openingstijden</h3>
                <div className="mt-2 max-w-sm">
                  <Openingstijden />
                </div>
              </div>
            </div>
            {contact.length > 0 && (
              <ul className="flex flex-wrap gap-3">
                {contact.map((c) => (
                  <li key={c.label}>
                    <a href={c.href} className="btn btn-ghost-dark" {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <c.icon className="h-4 w-4" aria-hidden /> {c.waarde}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {winkel.social.length > 0 && (
              <p className="text-ink-soft">
                Volg ons op{" "}
                {winkel.social.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && " en "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-underline font-semibold text-bordeaux">{s.naam}</a>
                  </span>
                ))}
              </p>
            )}
          </Reveal>

          <Reveal delay={0.14}>
            <a href={routeUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-olive mt-12 w-full !min-h-[3.75rem] text-base sm:w-auto sm:!px-8">
              <Navigation className="h-5 w-5" aria-hidden /> {t.knop}
              <span className="sr-only"> (opent Google Maps)</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
