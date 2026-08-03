// Money + number formatting for the slot UI.

export function money(amount: number, currency = 'EUR', symbol = '€'): string {
  const v = Math.abs(amount) >= 1000
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toFixed(2);
  return `${symbol}${v}`;
}

export function compact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k`;
  return amount.toFixed(0);
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', BRL: 'R$', JPY: '¥',
};
