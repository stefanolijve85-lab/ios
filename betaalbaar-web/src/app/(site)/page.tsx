import type { Metadata } from "next";
import Link from "next/link";
import { brand, projects } from "@/config/site";
import { Cta } from "@/components/Cta";
import { PriceBlock, StartCondition } from "@/components/Price";
import { Desktop, Phone } from "@/components/Mockup";
import { Closing, Faq, Offer, ProjectCards, Steps } from "@/components/Sections";
import { CostComparison } from "@/components/CostComparison";

export const metadata: Metadata = {
  title: { absolute: `Website laten maken: €99 + €59 p/m | ${brand.name}` },
  alternates: { canonical: "/" },
};

const benefits = [
  { t: "Een uitstraling die past bij je bedrijf.", p: "Stijl, kleuren en beeld kies je in de intake. Het ontwerp sluit aan op wat je doet en voor wie." },
  { t: "Een laag bedrag om te starten.", p: "Je begint met €99 eenmalig. Het vaste maandbedrag staat er vanaf het begin duidelijk naast." },
  { t: "Hosting en service bij één aanspreekpunt.", p: "Je website en de hosting zitten bij dezelfde partij, zodat je weet waar je terechtkunt." },
  { t: "Een duidelijke route naar contact.", p: "Elke pagina leidt naar één hoofdactie die jij kiest, zoals bellen, WhatsApp of een aanvraag." },
  { t: "Je aanbod helder op mobiel.", p: "De mobiele weergave wordt apart ontworpen: je aanbod en de contactknop staan direct in beeld." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="rise">
            <h1>Binnen 7 dagen een professionele website.</h1>
            <p className="tagline">{brand.tagline}</p>
            <p className="lead">
              Laat een website maken die laat zien wie je bent en wat je bedrijf te bieden heeft. Met hosting en service voor een vast maandbedrag.
            </p>
            <PriceBlock />
            <StartCondition />
            <div className="btn-row">
              <Cta location="hero" />
              <Link href="#voorbeelden" className="btn btn-secondary">Bekijk voorbeelden</Link>
            </div>
            <p className="process-line">Vertel ons wat je nodig hebt. Wij bouwen jouw website.</p>
          </div>
          <div className="rise d1">
            <div className="stack" role="img" aria-label="Schetsen van drie conceptvoorbeelden: Bij Tanja, Detepo en Casa Amoray">
              <Desktop theme={projects[2].theme} />
              <Desktop theme={projects[0].theme} />
              <div className="stack-phone"><Phone theme={projects[1].theme} /></div>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>Conceptvoorbeelden. Echte beelden volgen zodra ze zijn aangeleverd.</p>
          </div>
        </div>
      </section>

      <section className="section" id="voorbeelden">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Voorbeelden</p>
            <h2>Drie bedrijven, drie eigen gezichten.</h2>
            <p className="lead">Zo kan een website eruitzien voor een technologiemerk, een salon en een delicatessenwinkel. Dit zijn conceptvoorbeelden die de ontwerprichting laten zien.</p>
          </div>
          <ProjectCards />
        </div>
      </section>

      <section className="section" id="voordelen">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Wat je krijgt</p>
            <h2>Gemaakt vanuit jouw bedrijf.</h2>
          </div>
          <div className="rows">
            {benefits.map((b) => <div key={b.t}><h3>{b.t}</h3><p>{b.p}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section" id="aanbod">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Het aanbod</p>
            <h2>Eén pakket. Twee bedragen.</h2>
            <p className="lead">Een eenmalig bedrag voor je website en een vast maandbedrag voor hosting en service.</p>
          </div>
          <Offer />
        </div>
      </section>

      <section className="section" id="kosten">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Kosten</p>
            <h2>Vergelijk de totale kosten.</h2>
            <p className="lead">Een lage instapprijs zegt niet alles. Daarom tellen we het eenmalige bedrag en de maandbedragen bij elkaar op, over één en over drie jaar.</p>
          </div>
          <CostComparison />
        </div>
      </section>

      <section className="section" id="werkwijze">
        <div className="wrap two">
          <div className="head">
            <p className="eyebrow">Werkwijze</p>
            <h2>Van eerste keuze tot oplevering.</h2>
            <p className="lead">Je weet vooraf wat je krijgt, wat het kost en wanneer de bouw start.</p>
            <Link href="/werkwijze">Lees de hele werkwijze</Link>
          </div>
          <Steps />
        </div>
      </section>

      <section className="section" id="vragen">
        <div className="wrap two">
          <div className="head">
            <p className="eyebrow">Veelgestelde vragen</p>
            <h2>Goed om vooraf te weten.</h2>
            <p className="lead">Nog niet alle voorwaarden staan vast. Waar dat zo is, zeggen we dat erbij.</p>
          </div>
          <Faq />
        </div>
      </section>

      <Closing />
    </>
  );
}
