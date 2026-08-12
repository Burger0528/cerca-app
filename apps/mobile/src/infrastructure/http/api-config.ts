/**
 * Configuración pública de la API.
 *
 * Todo lo que empieza por `EXPO_PUBLIC_` lo inserta Metro EN CLARO en el bundle. Por eso
 * aquí solo hay una URL: cualquiera que descomprima el APK la va a leer, y no pasa nada.
 * Una clave de API en esta constante sería una clave de API regalada. `verify.sh` tiene un
 * paso que lo comprueba.
 */
/** El puerto de cerca-api es el 3333, y el `/v1` va en la base. Ver `.env.example`. */
export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333/v1',
);

/**
 * Más de esto y se corta. En móvil, una petición colgada sin timeout es un spinner
 * eterno: el usuario no sabe si esperar o matar la app.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Sin barra final, para que `${base}${path}` no produzca `//listings`. */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}
