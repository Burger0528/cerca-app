import type { City } from './location';

/**
 * Catálogo del selector de ciudad.
 *
 * Vive en el cliente a propósito: es la alternativa a la ubicación, y tiene que funcionar
 * ANTES de la primera petición. Si dependiera de un endpoint, negar el permiso con mala
 * red dejaría al usuario sin ubicación y sin lista, que es justo el agujero que US-08
 * viene a tapar.
 *
 * TODO(sprint 2): moverlo a `GET /cities` cuando haya cobertura en más de un país, y dejar
 * esto como semilla del primer arranque.
 */
export const FALLBACK_CITIES: readonly City[] = [
  {
    id: 'mx-cdmx',
    name: 'Ciudad de México',
    countryCode: 'MX',
    coordinates: { latitude: 19.4326, longitude: -99.1332 },
  },
  {
    id: 'mx-gdl',
    name: 'Guadalajara',
    countryCode: 'MX',
    coordinates: { latitude: 20.6597, longitude: -103.3496 },
  },
  {
    id: 'mx-mty',
    name: 'Monterrey',
    countryCode: 'MX',
    coordinates: { latitude: 25.6866, longitude: -100.3161 },
  },
  {
    id: 'mx-pue',
    name: 'Puebla',
    countryCode: 'MX',
    coordinates: { latitude: 19.0414, longitude: -98.2063 },
  },
  {
    id: 'mx-tij',
    name: 'Tijuana',
    countryCode: 'MX',
    coordinates: { latitude: 32.5149, longitude: -117.0382 },
  },
  {
    id: 'mx-mid',
    name: 'Mérida',
    countryCode: 'MX',
    coordinates: { latitude: 20.9674, longitude: -89.5926 },
  },
  {
    id: 'mx-qro',
    name: 'Querétaro',
    countryCode: 'MX',
    coordinates: { latitude: 20.5888, longitude: -100.3899 },
  },
];

export function findCity(id: string): City | null {
  return FALLBACK_CITIES.find((city) => city.id === id) ?? null;
}
