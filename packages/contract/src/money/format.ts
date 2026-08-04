/**
 * OWNER: Salvador.
 *
 * Criterios de aceptación que tiene que probar con test:
 *   formatMoney({ amountMinor: 129990, currency: 'MXN' }, 'es-MX') === '$1,299.90'
 *   formatMoney({ amountMinor: 129990, currency: 'MXN' }, 'en-US') === 'MX$1,299.90'
 *   formatMoney({ amountMinor: 129990, currency: 'MXN' }, 'de-DE') === '1.299,90 MX$'
 *   JPY no se divide entre 100. KWD se divide entre 1000.
 */
import type { Money } from './money.ts';

/**
 * Dígitos de la unidad menor por divisa. JPY 0, MXN 2, KWD 3.
 * TODO(salvador): completar con las divisas del enunciado y un `DEFAULT_MINOR_UNIT_DIGITS = 2`.
 */
export const MINOR_UNIT_DIGITS: Readonly<Record<string, number>> = {
  JPY: 0,
  MXN: 2,
  KWD: 3,
};

export function minorUnitDigits(_currency: string): number {
  throw new Error(
    'TODO(salvador): implementar minorUnitDigits() — packages/contract/src/money/format.ts',
  );
}

export function formatMoney(_money: Money, _locale: string): string {
  throw new Error(
    'TODO(salvador): implementar formatMoney() — packages/contract/src/money/format.ts',
  );
}
