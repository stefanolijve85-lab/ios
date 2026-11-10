import { pricing } from "../config/site.ts";

/** Eén rekenregel voor alle totalen: eenmalig + maanden × maandbedrag. */
export function total(oneOff: number, monthly: number, months: number): number {
  return oneOff + months * monthly;
}

export function euro(n: number): string {
  return "€" + n.toLocaleString("nl-NL");
}

export function oneOffFor(withNameLogo: boolean): number {
  return pricing.oneOff + (withNameLogo ? pricing.nameLogo : 0);
}

export function priceSummary(withNameLogo: boolean) {
  const oneOff = oneOffFor(withNameLogo);
  return {
    oneOff,
    monthly: pricing.monthly,
    year1: total(oneOff, pricing.monthly, 12),
    year3: total(oneOff, pricing.monthly, 36),
  };
}
