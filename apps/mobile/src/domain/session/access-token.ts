/**
 * OWNER: Salvador (nace del delta de contrato).
 *
 * Cuándo caduca el access token, leído del propio token.
 *
 * El backend no manda `expiresIn` en la respuesta de autenticación, pero su access token
 * es un JWT firmado con `expiresIn: JWT_ACCESS_TTL`, así que el instante exacto viaja
 * dentro, en el claim `exp`. Leerlo es mejor que cablear "15 minutos" en el cliente: el día
 * que cambie la variable de entorno del servidor, esto se entera solo.
 *
 * AQUÍ NO SE VERIFICA NADA. La firma la comprueba el servidor en cada petición; esto solo
 * lee un dato para decidir CUÁNDO renovar. Un token manipulado no gana nada engañando a
 * este archivo: como mucho consigue que la app renueve antes o después de lo debido, y el
 * servidor sigue rechazándolo igual.
 */

/**
 * Cuánto se asume que dura un token cuyo `exp` no se puede leer.
 *
 * Corto a propósito. Si el formato cambia y esto deja de entender el token, es preferible
 * renovar de más —una petición extra cada pocos minutos— que asumir una hora y dejar al
 * usuario con un 401 en la cara a mitad de scroll.
 */
export const FALLBACK_ACCESS_TOKEN_TTL_MS = 5 * 60_000;

/**
 * El instante de caducidad en epoch ms, o `null` si el token no lo dice.
 *
 * `exp` es un `NumericDate` de la RFC 7519: SEGUNDOS desde epoch, no milisegundos. La
 * diferencia son 50 años de token válido si alguien se despista.
 */
export function expiryFromAccessToken(accessToken: string): number | null {
  const payload = decodePayload(accessToken);
  if (payload === null) return null;

  const exp = payload['exp'];
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;

  return exp * 1000;
}

/** La caducidad del token, con el respaldo aplicado cuando no se puede leer. */
export function expiresAtFrom(accessToken: string, now: number): number {
  return expiryFromAccessToken(accessToken) ?? now + FALLBACK_ACCESS_TOKEN_TTL_MS;
}

function decodePayload(token: string): Record<string, unknown> | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;

  const payload = segments[1];
  if (payload === undefined) return null;

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payload));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

    return { ...parsed };
  } catch {
    // Un token que no es un JWT no es motivo para tumbar el arranque de la app.
    return null;
  }
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decodifica base64url a texto, sin `atob` ni `Buffer`.
 *
 * Ninguno de los dos está garantizado en Hermes según la versión de React Native, y un
 * polyfill entero para leer un número sería desproporcionado. Son veinte líneas y se
 * comportan igual en Node y en el teléfono, que es justo lo que hace falta para que el test
 * de esto signifique algo.
 */
function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  let bits = 0;
  let bitCount = 0;
  let output = '';

  for (const character of base64) {
    const value = BASE64_ALPHABET.indexOf(character);
    // El relleno `=` y cualquier carácter ajeno al alfabeto se ignoran.
    if (value === -1) continue;

    bits = (bits << 6) | value;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      output += String.fromCharCode((bits >> bitCount) & 0xff);
    }
  }

  // El payload de un JWT es JSON en UTF-8; `decodeURIComponent` reconstruye los acentos que
  // `String.fromCharCode` deja como bytes sueltos.
  try {
    return decodeURIComponent(
      output
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch {
    return output;
  }
}
