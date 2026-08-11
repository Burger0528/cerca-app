/**
 * Geometría pura. Sin React, sin fetch, sin Expo: son números y se pueden probar sin
 * abrir un simulador.
 */
/**
 * La coordenada del DOMINIO de la app, con nombres largos.
 *
 * Vive aquí y no en el contrato a propósito: el backend habla de `lat`/`lng`
 * (`geoPointSchema`), y la traducción a esos nombres se hace en el gateway, en el borde.
 * Así un cambio de nomenclatura del servidor no se propaga por toda la app.
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Decimales a los que se redondea la coordenada antes de meterla en la clave de caché.
 *
 * 3 decimales ≈ 110 m. Es el número que hace que arrastrar el mapa dos calles NO dispare
 * una petición nueva: la clave de TanStack Query sigue siendo la misma, así que sirve la
 * respuesta que ya tenía. Bajarlo a 2 (≈ 1,1 km) cachea de más y el orden por distancia
 * empieza a mentir; subirlo a 4 (≈ 11 m) hace que temblar la mano pida datos otra vez.
 */
export const DEFAULT_GRID_PRECISION = 3;

/**
 * Encaja una coordenada en una rejilla fija.
 *
 * Es la pieza que separa "dónde estoy" de "qué le pido al servidor". La ubicación real
 * cambia cada segundo; la celda de la rejilla, no. La clave de caché usa la celda.
 */
export function snapToGrid(
  coordinates: Coordinates,
  precision: number = DEFAULT_GRID_PRECISION,
): Coordinates {
  return {
    latitude: snap(coordinates.latitude, precision),
    longitude: snap(coordinates.longitude, precision),
  };
}

/**
 * `toFixed` en vez de `Math.round(x * 10 ** n) / 10 ** n` porque el segundo arrastra el
 * error del binario y devuelve 19.432999999999996 donde debería devolver 19.433: dos
 * claves distintas para el mismo sitio, y la caché deja de servir.
 *
 * El `+ 0` normaliza el -0 que sale al redondear negativos pequeños: -0 y 0 son iguales
 * con ===, pero se serializan distinto en la clave (`-0` vs `0`).
 */
function snap(value: number, precision: number): number {
  return Number.parseFloat(value.toFixed(precision)) + 0;
}

/** Radio de la Tierra en metros, media del elipsoide WGS-84. */
const EARTH_RADIUS_METERS = 6_371_008.8;

/**
 * Distancia en metros por la fórmula del semiverseno.
 *
 * La distancia que se ENSEÑA la manda el servidor, que es quien conoce el origen real de
 * la búsqueda. Esta sirve para decisiones locales: "¿me he movido lo bastante como para
 * refrescar?".
 */
export function distanceInMeters(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
