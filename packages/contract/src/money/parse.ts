import { minorUnitDigits } from './format.ts';
import type { Money } from './money.ts';

/** La primera es la que el formulario ofrece por defecto: el mercado donde opera Cerca. */
export const SUPPORTED_CURRENCIES = ['COP', 'USD', 'EUR', 'MXN'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const MAJOR_AMOUNT = /^\d{1,12}([.,]\d{1,3})?$/;

/**
 * Lo que teclea quien publica (`1299,90`) al entero de la divisa (`129990`).
 *
 * Devuelve `null` en vez de lanzar: quien llama es un formulario, y un importe a medio
 * escribir es un estado normal, no un error.
 */
/** El camino de vuelta, para rellenar el formulario de edición con lo que ya hay guardado. */
export function majorFromMoney(money: Money): string {
  const digits = minorUnitDigits(money.currency);
  if (digits === 0) return String(money.amountMinor);

  return (money.amountMinor / 10 ** digits).toFixed(digits);
}

export function moneyFromMajor(amount: string, currency: string): Money | null {
  const normalized = amount.trim().replace(',', '.');
  if (!MAJOR_AMOUNT.test(normalized)) return null;

  const digits = minorUnitDigits(currency);
  const amountMinor = Math.round(Number(normalized) * 10 ** digits);

  return { amountMinor, currency };
}
