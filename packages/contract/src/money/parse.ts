import { minorUnitDigits } from './format.ts';
import type { Money } from './money.ts';

export const SUPPORTED_CURRENCIES = ['MXN', 'USD', 'EUR', 'COP'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const MAJOR_AMOUNT = /^\d{1,12}([.,]\d{1,3})?$/;

/**
 * Lo que teclea quien publica (`1299,90`) al entero de la divisa (`129990`).
 *
 * Devuelve `null` en vez de lanzar: quien llama es un formulario, y un importe a medio
 * escribir es un estado normal, no un error.
 */
export function moneyFromMajor(amount: string, currency: string): Money | null {
  const normalized = amount.trim().replace(',', '.');
  if (!MAJOR_AMOUNT.test(normalized)) return null;

  const digits = minorUnitDigits(currency);
  const amountMinor = Math.round(Number(normalized) * 10 ** digits);

  return { amountMinor, currency };
}
