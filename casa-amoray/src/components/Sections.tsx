import { bookingHref, business, euro, nav, treatmentNote, treatments } from "@/content/site";
import { Placeholder } from "@/components/Placeholder";
import { Star } from "@/components/Star";

/** Scène 7 — Behandelingen. */
export function Treatments() {
  return (
    <section className="section section--cream section--sheet" id="behandelingen" aria-labelledby="behandelingen-titel">
      <div className="container">
        <header className="section__intro reveal">
          <p className="eyebrow">07 · Behandelingen</p>
          <h2 id="behandelingen-titel">Kies jouw moment</h2>
          <p className="lead">{treatmentNote}</p>
        </header>

        <ul className="cards" role="list">
          {treatments.map((t, i) => (
            <li
              key={t.id}
              className={`card reveal ${t.comingSoon ? "card--soon" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className="card__top">
                <h3 className="card__title">{t.name}</h3>
                {t.comingSoon ? (
                  <span className="badge">Binnenkort</span>
                ) : (
                  <p className="card__meta">
                    <span>{t.minutes} minuten</span>
                    <span aria-hidden="true"> · </span>
                    <strong>{t.price !== null ? euro(t.price) : ""}</strong>
                  </p>
                )}
              </div>
              <p className="card__short">{t.short}</p>
              {t.description && <p className="card__text">{t.description}</p>}
              {t.bookable && (
                <a className="btn btn--outline" href={`${bookingHref}?behandeling=${t.id}`}>
                  Reserveer<span className="visually-hidden"> {t.name.toLowerCase()}</span>
                </a>
              )}
            </li>
          ))}
        </ul>

        <p className="fine-print reveal">
          Ben je kort geleden bevallen, zwanger of heb je medische klachten? Overleg bij twijfel eerst met je
          verloskundige of huisarts, en vertel het Winnie vooraf.
        </p>
      </div>
    </section>
  );
}

/** Scène 8 — Over Winnie. */
export function AboutWinnie() {
  return (
    <section className="section section--beige" id="over-winnie" aria-labelledby="winnie-titel">
      <div className="container about">
        <figure className="about__photo reveal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="about__img"
            src="/media/winnie/winnie-portret.webp"
            alt="Winnie, eigenaresse van Casa Amoray, lacht vriendelijk in de camera."
            width={640}
            height={800}
            loading="lazy"
            decoding="async"
          />
        </figure>

        <div className="about__text reveal" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="eyebrow">08 · Over Winnie</p>
          <h2 id="winnie-titel">Persoonlijk ontvangen door Winnie</h2>
          <p className="lead">
            Bij {business.name} word je ontvangen door Winnie, de eigenaresse. Ze neemt de tijd voor je: eerst
            een kopje thee en een rustig gesprek over wat jij nodig hebt, daarna je massage.
          </p>
          <p>
            {business.name} is er speciaal voor vrouwen en moeders. Een plek waar je even niets hoeft, en waar
            je in alle rust en vertrouwen kunt ontspannen.
          </p>
          <Placeholder>Hier komt een persoonlijke tekst van Winnie zelf: waarom ze Casa Amoray begon en wat ze belangrijk vindt.</Placeholder>
        </div>
      </div>
    </section>
  );
}

/** Cadeaubon en contact. */
export function GiftAndContact() {
  const contact = [
    business.street && `${business.street}, ${business.postalCode ?? ""} ${business.city}`,
    business.phone,
    business.email,
  ].filter(Boolean);

  return (
    <section className="section section--cream" aria-label="Cadeaubon en contact">
      <div className="container split">
        <div id="cadeaubon" className="panel reveal">
          <Star className="panel__star" />
          <h2>Cadeaubon</h2>
          <p>Gun iemand anders een moment voor zichzelf. Een cadeaubon van {business.name} is een warm cadeau voor een nieuwe moeder, een vriendin of je eigen moeder.</p>
          <Placeholder>Hoe je een cadeaubon bestelt, volgt. Tot die tijd kun je contact opnemen.</Placeholder>
        </div>

        <div id="contact" className="panel reveal" style={{ "--i": 1 } as React.CSSProperties}>
          <Star className="panel__star" />
          <h2>Contact</h2>
          <p>
            {business.name} ligt in {business.city}. {business.availabilityNote}
          </p>
          {contact.length > 0 ? (
            <ul className="contact-list">
              {contact.map((c) => (
                <li key={c as string}>{c}</li>
              ))}
            </ul>
          ) : (
            <Placeholder>Adres, telefoonnummer en e-mailadres volgen.</Placeholder>
          )}
          <a className="text-link" href={bookingHref}>
            Een afspraak aanvragen
          </a>
        </div>

        <div className="panel panel--soon reveal" style={{ "--i": 2 } as React.CSSProperties}>
          <span className="badge">Binnenkort</span>
          <h2>Headspa</h2>
          <p>Er komt een nieuwe behandeling aan bij {business.name}. Meer informatie volgt.</p>
        </div>
      </div>
    </section>
  );
}

/** Scène 9 — Reserveren. */
export function FinalCta() {
  return (
    <section className="final-cta" id="reserveren" aria-labelledby="reserveren-titel">
      <div className="container final-cta__inner reveal">
        <Star className="final-cta__star" />
        <h2 id="reserveren-titel">Gun jezelf een moment van rust.</h2>
        <p>Kies je behandeling en een voorkeursmoment. Winnie bevestigt je afspraak persoonlijk.</p>
        <a className="btn btn--light btn--large" href={bookingHref}>
          Boek jouw moment
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="site-footer__logo" src="/media/brand/wordmark-cream.png" alt="Casa Amoray" width={591} height={253} loading="lazy" />
        <p className="site-footer__tag">
          {business.slogan}. {business.tagline}, in {business.city}.
        </p>
        <nav aria-label="Footer">
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
            <li>
              <a href="/privacy">Privacy</a>
            </li>
          </ul>
        </nav>
        <p className="site-footer__small">© {new Date().getFullYear()} {business.name}</p>
      </div>
    </footer>
  );
}
