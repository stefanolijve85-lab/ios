import Link from "next/link";
import { brand, nav, contact, pricing, flags } from "@/config/site";
import { euro } from "@/lib/pricing";
import { Cta } from "./Cta";

export function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo" aria-label={`${brand.name}, naar de homepage`}>
          <span className="logo-mark" aria-hidden="true" />
          {brand.name}
        </Link>
        <nav className="nav" aria-label="Hoofdnavigatie">
          {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </nav>
        <span className="header-cta"><Cta location="header" small /></span>
        <details className="menu">
          <summary aria-label="Menu openen of sluiten">Menu</summary>
          <nav className="menu-panel" aria-label="Mobiele navigatie">
            {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            <Link href="/contact">Contact</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function Footer() {
  const hasContact = contact.email || contact.phone;
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div>
          <p><strong style={{ color: "var(--ink)" }}>{brand.name}</strong><br />{brand.descriptor}</p>
          <p>{euro(pricing.oneOff)} eenmalig + {euro(pricing.monthly)} per maand. {pricing.vatLabel}.</p>
          {hasContact && (
            <p>
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.email && contact.phone && " · "}
              {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>}
            </p>
          )}
        </div>
        <ul>
          {nav.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <ul>
          <li><Link href="/privacy">Privacy (concept)</Link></li>
          <li><Link href="/voorwaarden">Voorwaarden (concept)</Link></li>
        </ul>
      </div>
    </footer>
  );
}

export function PreviewBanner() {
  if (flags.indexable) return null;
  return <div className="preview-banner" role="note">Preview — nog niet openbaar. Voorwaarden en bedrijfsgegevens worden nog bevestigd.</div>;
}

export function MobileBar() {
  return (
    <div className="mobile-bar">
      <div className="p"><b>{euro(pricing.oneOff)} + {euro(pricing.monthly)} p/m</b>excl. btw</div>
      <Cta location="mobiele-balk" small />
    </div>
  );
}
