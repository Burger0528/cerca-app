/**
 * OWNER: Salvador.
 *
 * Las cadenas que lee una tarjeta, en un sitio y no dentro del JSX.
 *
 * Están fuera del componente para poder probarlas sin montar nada: son funciones puras que
 * reciben `t` y el locale. Los criterios de aceptación del precio y de la valoración se
 * comprueban contra estas funciones directamente.
 */
import type { Money, Pricing } from '@cerca/contract';
import { formatDistance, formatMoney } from '@cerca/contract';
import type { TFunction } from 'i18next';

/**
 * El precio de un resultado de BÚSQUEDA.
 *
 * La lista solo recibe `priceFrom`, no el modelo de precio, así que no puede escribir
 * "$450 / hora": no sabe si esos 450 son la hora, el día o el trabajo entero. "Desde $450"
 * es lo único cierto que se puede decir con este dato. Cuando `toSearchItem` del backend
 * incluya `pricing` —punto 4 de `docs/contract-delta.md`— la tarjeta pasa a usar
 * `pricingLabel` y el criterio del enunciado se cumple tal cual está escrito.
 */
export function priceFromLabel(priceFrom: Money | null, locale: string, t: TFunction): string {
  if (priceFrom === null) return t('listing.price.quote');

  return t('listing.price.from', { price: formatMoney(priceFrom, locale) });
}

/**
 * `$450 / hora · mínimo 2 h`
 *
 * El precio completo, a partir de la unión `Pricing` del contrato. Hoy solo llega en el
 * detalle de un anuncio; la búsqueda no lo trae.
 *
 * El precio nunca se enseña pelado: sin la unidad, "$450" puede ser la hora o el trabajo
 * entero, y esa diferencia es la que hace que alguien reserve o no.
 */
export function pricingLabel(pricing: Pricing, locale: string, t: TFunction): string {
  if (pricing.model === 'fixed') {
    return t('listing.price.fixed', { price: formatMoney(pricing.price, locale) });
  }

  if (pricing.model === 'hourly') {
    const rate = t('listing.price.hourly', { price: formatMoney(pricing.hourlyRate, locale) });

    // "mínimo 1 h" en un precio por hora no dice nada que el propio precio no diga ya; a
    // partir de 2 sí cambia lo que el cliente va a pagar.
    if (pricing.minimumHours <= 1) return rate;

    const minimum = t('listing.price.minimumHours', { count: pricing.minimumHours });
    return `${rate}${t('listing.price.separator')}${minimum}`;
  }

  return pricing.startingFrom === undefined
    ? t('listing.price.quote')
    : t('listing.price.quoteFrom', { price: formatMoney(pricing.startingFrom, locale) });
}

const ratingFormatterCache = new Map<string, Intl.NumberFormat>();

function ratingFormatterFor(locale: string): Intl.NumberFormat {
  const cached = ratingFormatterCache.get(locale);
  if (cached !== undefined) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  ratingFormatterCache.set(locale, formatter);
  return formatter;
}

/**
 * `4,8 · 200 reseñas`
 *
 * La media sin el recuento miente: un 5,0 de una sola reseña se lee como un 5,0 de
 * doscientas. El plural sale de i18next, que aplica las reglas del idioma — y en 0 la media
 * no se enseña, porque no hay ninguna.
 *
 * Recibe los dos campos sueltos porque así los manda el backend (`ratingAvg`, `ratingCount`),
 * y agruparlos en un objeto solo para desagruparlos aquí no aporta nada.
 */
export function ratingLabel(average: number, count: number, locale: string, t: TFunction): string {
  if (count === 0) return t('listing.rating.none');

  const formatted = ratingFormatterFor(locale).format(average);
  const reviews = t('listing.rating.reviews', { count });

  return `${formatted}${t('listing.price.separator')}${reviews}`;
}

/** `450 m` / `3.0 mi`. El backend siempre manda distancia: la calcula PostGIS. */
export function distanceLabel(meters: number, locale: string): string {
  return formatDistance({ meters }, locale);
}
