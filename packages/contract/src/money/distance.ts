/**
 * OWNER: Salvador.
 *
 * Kilómetros o millas según el locale. La app siempre guarda metros; la conversión y el
 * redondeo viven aquí para que ninguna pantalla haga `/ 1000` por su cuenta.
 */

/** Distancia siempre en metros. Igual que Money: nunca un `number` suelto sin unidad. */
export interface Distance {
  readonly meters: number;
}

const METERS_PER_MILE = 1609.344;
const METERS_PER_FOOT = 0.3048;

/**
 * Regiones que miden distancias de carretera en millas.
 *
 * Va por REGIÓN y no por idioma: un teléfono en `es-US` es de alguien que vive en Estados
 * Unidos, y "3,2 km" no le dice nada. `en-AU` es al revés, inglés y kilómetros.
 */
const IMPERIAL_REGIONS: ReadonlySet<string> = new Set(['US', 'GB', 'LR', 'MM']);

/**
 * La región del locale, sin `Intl.Locale`.
 *
 * `new Intl.Locale()` existe en Node pero su soporte en Hermes es irregular según la
 * versión de React Native. La etiqueta se parte a mano: es una regla de BCP-47 estable
 * (`es-MX`, `en-US`, `zh-Hans-CN`) y así esto no depende del motor.
 */
function regionOf(locale: string): string | null {
  for (const subtag of locale.split(/[-_]/).slice(1)) {
    if (/^[A-Za-z]{2}$/.test(subtag)) return subtag.toUpperCase();
    if (/^\d{3}$/.test(subtag)) return subtag;
  }
  return null;
}

export function usesImperialUnits(locale: string): boolean {
  const region = regionOf(locale);
  return region !== null && IMPERIAL_REGIONS.has(region);
}

const numberFormatterCache = new Map<string, Intl.NumberFormat>();

function numberFormatterFor(locale: string, digits: number): Intl.NumberFormat {
  const key = `${locale} ${digits}`;

  const cached = numberFormatterCache.get(key);
  if (cached !== undefined) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  numberFormatterCache.set(key, formatter);
  return formatter;
}

/**
 * Distancia legible: `450 m`, `4,8 km`, `2.3 mi`.
 *
 * El número se formatea con `Intl` (el separador decimal es distinto en cada locale) pero
 * la unidad se concatena a mano en vez de usar `style: 'unit'`. Ese estilo depende de los
 * datos de ICU que traiga el motor, y en Hermes no está garantizado; `km`, `m`, `mi` y
 * `ft` son símbolos del SI y se escriben igual en los locales que soportamos.
 *
 * Por debajo de un kilómetro se enseñan METROS: "0,4 km" es una precisión que nadie usa
 * al buscar un fontanero a la vuelta de la esquina.
 */
export function formatDistance(distance: Distance, locale: string): string {
  const meters = Math.max(0, distance.meters);

  if (usesImperialUnits(locale)) {
    const miles = meters / METERS_PER_MILE;

    if (miles < 0.1) {
      const feet = roundToNearest(meters / METERS_PER_FOOT, 10);
      return `${numberFormatterFor(locale, 0).format(feet)} ft`;
    }

    return `${numberFormatterFor(locale, decimalsFor(miles)).format(miles)} mi`;
  }

  if (meters < 1000) {
    return `${numberFormatterFor(locale, 0).format(roundToNearest(meters, 10))} m`;
  }

  const kilometers = meters / 1000;
  return `${numberFormatterFor(locale, decimalsFor(kilometers)).format(kilometers)} km`;
}

/**
 * Un decimal cerca, ninguno lejos.
 *
 * "1,2 km" ayuda a decidir; "13,7 km" es ruido — a esa distancia da igual el decimal, y
 * quita sitio en una tarjeta donde el precio importa más.
 */
function decimalsFor(value: number): number {
  return value < 10 ? 1 : 0;
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}
