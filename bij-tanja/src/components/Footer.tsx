import Link from "next/link";
import { Logo } from "./Logo";
import { navigatie } from "./nav";
import { winkel, adresRegel, routeUrl } from "@/content/winkel";

export function Footer() {
  return (
    <footer className="grain relative bg-olive-deep text-room">
      <div className="relative mx-auto max-w-page px-4 pb-10 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo tone="light" size="lg" />
            <p className="mt-6 max-w-sm font-hand text-2xl leading-snug text-honey-soft">{winkel.kernboodschap}</p>
          </div>
          <div>
            <h2 className="label text-room/50">Rondkijken</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className="link-underline" href="/">Home</Link></li>
              {navigatie.map((n) => (
                <li key={n.href}>
                  <Link className="link-underline" href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="label text-room/50">Je vindt ons</h2>
            <address className="mt-5 not-italic leading-relaxed text-room/85">{adresRegel()}</address>
            <a href={routeUrl()} target="_blank" rel="noopener noreferrer" className="link-underline mt-3 inline-block text-honey-soft">
              Route plannen ↗
            </a>
            {winkel.social.length > 0 && (
              <ul className="mt-6 flex gap-4">
                {winkel.social.map((s) => (
                  <li key={s.url}>
                    <a className="link-underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.naam}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-room/10 pt-6 text-xs text-room/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {winkel.naam} · {winkel.ondertitel}</p>
          <p>{winkel.slogan} <span className="opacity-70">(vinden wij)</span></p>
        </div>
      </div>
    </footer>
  );
}
