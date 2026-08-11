/**
 * OWNER: Salvador.
 *
 * Los criterios de aceptación de la tarjeta, sin montar la tarjeta.
 *
 * Se inicializa un i18next de verdad con los JSON de verdad: probar esto con un `t` falso
 * que devuelva la clave no demostraría nada de lo que hay que demostrar, que es justamente
 * que los plurales y la interpolación están bien puestos.
 */
import type { Money, Pricing } from '@cerca/contract';
import i18next, { type TFunction } from 'i18next';

import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';

import { priceFromLabel, pricingLabel, ratingLabel } from './listing-labels';

async function translatorFor(language: 'en' | 'es'): Promise<TFunction> {
  const instance = i18next.createInstance();

  await instance.init({
    lng: language,
    fallbackLng: 'en',
    resources: { en: { translation: en }, es: { translation: es } },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return instance.t;
}

const MXN_450: Money = { amountMinor: 45000, currency: 'MXN' };

const PER_HOUR_WITH_MINIMUM: Pricing = {
  model: 'hourly',
  hourlyRate: MXN_450,
  minimumHours: 2,
};

describe('pricingLabel', () => {
  it('reads "$450 / hora · mínimo 2 h" and not just "$450"', async () => {
    const t = await translatorFor('es');

    expect(pricingLabel(PER_HOUR_WITH_MINIMUM, 'es-MX', t)).toBe('$450 / hora · mínimo 2 h');
  });

  it('translates the unit but keeps the locale of the number', async () => {
    const t = await translatorFor('en');

    // Textos en inglés, importe en formato alemán: son dos ejes distintos. El separador
    // antes de `MX$` es U+00A0, el espacio duro que mete ICU.
    expect(pricingLabel(PER_HOUR_WITH_MINIMUM, 'de-DE', t)).toBe('450 MX$ / hour · minimum 2 h');
  });

  it('hides a minimum of one, which adds nothing', async () => {
    const t = await translatorFor('es');

    expect(pricingLabel({ ...PER_HOUR_WITH_MINIMUM, minimumHours: 1 }, 'es-MX', t)).toBe(
      '$450 / hora',
    );
  });

  it('a fixed price has no unit to show', async () => {
    const t = await translatorFor('es');

    expect(pricingLabel({ model: 'fixed', price: MXN_450 }, 'es-MX', t)).toBe('$450');
  });

  it('a quote says so, with or without a floor', async () => {
    const t = await translatorFor('es');

    expect(pricingLabel({ model: 'quote' }, 'es-MX', t)).toBe('A consultar');
    expect(pricingLabel({ model: 'quote', startingFrom: MXN_450 }, 'es-MX', t)).toBe('Desde $450');
  });
});

describe('priceFromLabel', () => {
  it('says "desde" because the search endpoint does not send the pricing model', async () => {
    const t = await translatorFor('es');

    expect(priceFromLabel(MXN_450, 'es-MX', t)).toBe('Desde $450');
  });

  it('falls back to "a consultar" when there is no price to sort by', async () => {
    const t = await translatorFor('es');

    expect(priceFromLabel(null, 'es-MX', t)).toBe('A consultar');
  });
});

describe('ratingLabel', () => {
  it('reads "4.8 · 200 reseñas", with the count and not only the average', async () => {
    const t = await translatorFor('es');

    // El separador decimal sale del locale: México usa el punto, Alemania la coma.
    expect(ratingLabel(4.8, 200, 'es-MX', t)).toBe('4.8 · 200 reseñas');
    expect(ratingLabel(4.8, 200, 'de-DE', t)).toBe('4,8 · 200 reseñas');
  });

  it('gets the plural right at 0, 1 and 2', async () => {
    const t = await translatorFor('es');

    // En 0 no hay media que enseñar: un "0,0" se lee como una valoración pésima.
    expect(ratingLabel(0, 0, 'es-MX', t)).toBe('Sin reseñas todavía');
    expect(ratingLabel(5, 1, 'es-MX', t)).toBe('5.0 · 1 reseña');
    expect(ratingLabel(4.5, 2, 'es-MX', t)).toBe('4.5 · 2 reseñas');
  });

  it('gets the plural right at 0, 1 and 2 in English too', async () => {
    const t = await translatorFor('en');

    expect(ratingLabel(0, 0, 'en-US', t)).toBe('No reviews yet');
    expect(ratingLabel(5, 1, 'en-US', t)).toBe('5.0 · 1 review');
    expect(ratingLabel(4.5, 2, 'en-US', t)).toBe('4.5 · 2 reviews');
  });

  it('always shows one decimal, so the column does not jump', async () => {
    const t = await translatorFor('es');

    expect(ratingLabel(5, 10, 'es-MX', t)).toBe('5.0 · 10 reseñas');
  });
});
