import type { Metadata } from "next";
import { Closing, Faq, Offer } from "@/components/Sections";
import { CostComparison } from "@/components/CostComparison";
import { PriceBlock, StartCondition } from "@/components/Price";
import { pricing } from "@/config/site";
import { euro, priceSummary } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Prijzen: €99 eenmalig + €59 per maand",
  description: "Wat kost een website laten maken? €99 eenmalig en €59 per maand voor hosting en service, exclusief btw. Bekijk de totale kosten over 1 en 3 jaar.",
  alternates: { canonical: "/prijzen" },
};

export default function Page() {
  const a = priceSummary(false), b = priceSummary(true);
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Prijzen</p>
          <h1>Wat kost je website?</h1>
          <p className="lead">Eén pakket met een eenmalig bedrag en een vast maandbedrag. Hieronder zie je ook wat dat over één en drie jaar optelt.</p>
          <PriceBlock />
          <StartCondition />
        </div>
      </section>
      <section className="section"><div className="wrap"><Offer /></div></section>
      <section className="section">
        <div className="wrap">
          <div className="head"><h2>Zo telt het op.</h2></div>
          <div className="table-scroll">
            <table className="compare">
              <thead><tr><th scope="col">Keuze</th><th scope="col" className="num">Eenmalig</th><th scope="col" className="num">Per maand</th><th scope="col" className="num">Jaar 1</th><th scope="col" className="num">3 jaar</th></tr></thead>
              <tbody>
                <tr><th scope="row">Website</th><td className="num">{euro(a.oneOff)}</td><td className="num">{euro(a.monthly)}</td><td className="num tot">{euro(a.year1)}</td><td className="num tot">{euro(a.year3)}</td></tr>
                <tr><th scope="row">Website + naam en logo<span className="sub">{euro(pricing.oneOff)} + {euro(pricing.nameLogo)} eenmalig</span></th><td className="num">{euro(b.oneOff)}</td><td className="num">{euro(b.monthly)}</td><td className="num tot">{euro(b.year1)}</td><td className="num tot">{euro(b.year3)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>{pricing.vatLabel}, bij 12 respectievelijk 36 maanden en gelijkblijvende tarieven, zonder meerwerk. De minimumlooptijd wordt nog vastgesteld.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="head"><h2>Vergelijk de totale kosten.</h2></div>
          <CostComparison />
        </div>
      </section>
      <section className="section"><div className="wrap two"><div className="head"><h2>Vragen over de prijs.</h2></div><Faq /></div></section>
      <Closing />
    </>
  );
}
