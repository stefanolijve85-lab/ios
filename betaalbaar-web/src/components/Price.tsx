import { pricing, delivery } from "@/config/site";
import { euro } from "@/lib/pricing";

export function PriceBlock() {
  return (
    <div className="price" aria-label="Prijs">
      <div className="price-main">
        <span><b>{euro(pricing.oneOff)}</b> eenmalig</span>
        <span className="price-plus" aria-hidden="true">+</span>
        <span><b>{euro(pricing.monthly)}</b> per maand</span>
      </div>
      <div className="price-note">{pricing.vatLabel}. Maandbedrag voor hosting en service.</div>
    </div>
  );
}

export function VatNote() {
  return <p className="small muted">{pricing.vatLabel}.</p>;
}

/** De startvoorwaarde hoort altijd direct bij de 7-dagenbelofte. */
export function StartCondition() {
  return (
    <p className="condition">
      {delivery.startCondition} {delivery.meaning ? `Met 'binnen 7 dagen' bedoelen we ${delivery.meaning}.` : delivery.meaningFallback}
    </p>
  );
}
