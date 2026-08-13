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
 *
 * Las coordenadas son LAS MISMAS que las de `CITIES` en el seed del backend, a propósito.
 * Cuando no coincidían, elegir una ciudad del selector dejaba la búsqueda vacía: la app
 * preguntaba por servicios a 3.000 km de donde estaban los anuncios, y parecía rota.
 */
export const FALLBACK_CITIES: readonly City[] = [
  {
    id: 'co-bog',
    name: 'Bogotá',
    countryCode: 'CO',
    coordinates: { latitude: 4.711, longitude: -74.0721 },
  },
  {
    id: 'co-mde',
    name: 'Medellín',
    countryCode: 'CO',
    coordinates: { latitude: 6.2442, longitude: -75.5812 },
  },
  {
    id: 'co-clo',
    name: 'Cali',
    countryCode: 'CO',
    coordinates: { latitude: 3.4516, longitude: -76.532 },
  },
  {
    id: 'co-baq',
    name: 'Barranquilla',
    countryCode: 'CO',
    coordinates: { latitude: 10.9685, longitude: -74.7813 },
  },
  {
    id: 'co-ctg',
    name: 'Cartagena',
    countryCode: 'CO',
    coordinates: { latitude: 10.391, longitude: -75.4794 },
  },
];

export function findCity(id: string): City | null {
  return FALLBACK_CITIES.find((city) => city.id === id) ?? null;
}
