/**
 * OWNER: Salvador.
 *
 * Los criterios de aceptación de dinero y distancia del enunciado, en código.
 *
 * NOTA sobre los espacios: ICU separa el importe del símbolo con un espacio DURO (U+00A0),
 * no con uno normal. Por eso las expectativas llevan `<U+00A0>` escrito con escape — con un
 * espacio normal fallarían, y el diff no enseñaría ninguna diferencia. No es manía: es la
 * causa número uno de tests de formato que "fallan sin motivo".
 *
 * Ojo con Node: hace falta `Intl` completo para que `de-DE` no caiga a `en-US` en silencio.
 * Node 24 lo trae de serie (full-icu).
 */
import { describe, expect, it } from 'vitest';

import { formatDistance, usesImperialUnits } from './distance.ts';
import { DEFAULT_MINOR_UNIT_DIGITS, formatMoney, minorUnitDigits } from './format.ts';

const MXN_1299_90 = { amountMinor: 129990, currency: 'MXN' } as const;

describe('formatMoney', () => {
  it('129990 MXN in es-MX reads $1,299.90', () => {
    expect(formatMoney(MXN_1299_90, 'es-MX')).toBe('$1,299.90');
  });

  it('129990 MXN in en-US reads MX$1,299.90', () => {
    // El mismo importe, otro locale: en Estados Unidos el peso se desambigua con `MX$`.
    expect(formatMoney(MXN_1299_90, 'en-US')).toBe('MX$1,299.90');
  });

  it('129990 MXN in de-DE reads 1.299,90 MX$', () => {
    // Puntos de millar, coma decimal y el símbolo DETRÁS. El precio se escribe así aunque
    // los textos de la app estén en inglés: lo manda el locale, no el idioma.
    expect(formatMoney(MXN_1299_90, 'de-DE')).toBe('1.299,90 MX$');
  });

  it('a JPY amount is not divided by 100', () => {
    // 1200 minor units de JPY son 1200 yenes, no 12.
    expect(formatMoney({ amountMinor: 1200, currency: 'JPY' }, 'en-US')).toBe('¥1,200');
    expect(minorUnitDigits('JPY')).toBe(0);
  });

  it('a KWD amount is divided by 1000', () => {
    // El dinar kuwaití tiene TRES decimales.
    expect(formatMoney({ amountMinor: 1299900, currency: 'KWD' }, 'en-US')).toBe('KWD 1,299.900');
    expect(minorUnitDigits('KWD')).toBe(3);
  });

  it('an unknown currency falls back to two minor-unit digits', () => {
    expect(minorUnitDigits('XYZ')).toBe(DEFAULT_MINOR_UNIT_DIGITS);
    expect(formatMoney({ amountMinor: 129990, currency: 'XYZ' }, 'en-US')).toBe('XYZ 1,299.90');
  });

  it('is case-insensitive on the currency code', () => {
    expect(minorUnitDigits('jpy')).toBe(0);
  });

  it('drops a fraction that is exactly zero, so a card reads $450 and not $450.00', () => {
    const perHour = { amountMinor: 45000, currency: 'MXN' } as const;

    expect(formatMoney(perHour, 'es-MX')).toBe('$450');
    // Un importe CON decimales no se toca: solo desaparecen los ceros que no dicen nada.
    expect(formatMoney(MXN_1299_90, 'es-MX')).toBe('$1,299.90');
  });

  it('keeps the zeros when asked, for a column of amounts that has to line up', () => {
    expect(
      formatMoney({ amountMinor: 45000, currency: 'MXN' }, 'es-MX', { trailingZeros: 'keep' }),
    ).toBe('$450.00');
  });

  it('formats zero without breaking', () => {
    expect(formatMoney({ amountMinor: 0, currency: 'MXN' }, 'es-MX')).toBe('$0');
  });
});

describe('formatDistance', () => {
  it('shows kilometres in es-MX and de-DE', () => {
    // México usa el punto decimal; Alemania la coma. Los dos, kilómetros.
    expect(formatDistance({ meters: 4800 }, 'es-MX')).toBe('4.8 km');
    expect(formatDistance({ meters: 4800 }, 'de-DE')).toBe('4,8 km');
  });

  it('shows miles in en-US', () => {
    expect(formatDistance({ meters: 4800 }, 'en-US')).toBe('3.0 mi');
    expect(formatDistance({ meters: 3701 }, 'en-US')).toBe('2.3 mi');
  });

  it('shows metres below one kilometre instead of 0.4 km', () => {
    expect(formatDistance({ meters: 450 }, 'es-MX')).toBe('450 m');
    expect(formatDistance({ meters: 447 }, 'de-DE')).toBe('450 m');
  });

  it('shows feet below a tenth of a mile in imperial locales', () => {
    expect(formatDistance({ meters: 120 }, 'en-US')).toBe('390 ft');
  });

  it('drops the decimal past ten units, where it is noise', () => {
    expect(formatDistance({ meters: 13700 }, 'es-MX')).toBe('14 km');
  });

  it('picks the unit system by region, not by language', () => {
    // Alguien con el teléfono en español viviendo en Estados Unidos ve millas.
    expect(usesImperialUnits('es-US')).toBe(true);
    expect(usesImperialUnits('en-AU')).toBe(false);
    expect(usesImperialUnits('en')).toBe(false);
    expect(formatDistance({ meters: 4800 }, 'es-US')).toBe('3.0 mi');
  });

  it('never renders a negative distance', () => {
    expect(formatDistance({ meters: -5 }, 'es-MX')).toBe('0 m');
  });
});
