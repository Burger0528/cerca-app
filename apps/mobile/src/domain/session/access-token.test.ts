/**
 * OWNER: Salvador.
 *
 * El backend no manda `expiresIn`, así que la caducidad se lee del JWT. Este archivo es lo
 * único que separa "renovar a tiempo" de "401 en la cara del usuario a mitad de scroll".
 */
import { FALLBACK_ACCESS_TOKEN_TTL_MS, expiresAtFrom, expiryFromAccessToken } from './access-token';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Codifica a base64url a mano, sin `Buffer` ni `btoa`.
 *
 * Ninguno de los dos existe en el entorno de jest-expo, que imita al del teléfono. Y usar
 * aquí una API que la app no tiene sería probar el código contra un mundo que no es el suyo.
 */
function toBase64Url(text: string): string {
  const bytes = [...new TextEncoder().encode(text)];

  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const chunk =
      ((bytes[index] ?? 0) << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0);
    const characters = bytes.length - index;

    output += BASE64_ALPHABET[(chunk >> 18) & 63] ?? '';
    output += BASE64_ALPHABET[(chunk >> 12) & 63] ?? '';
    if (characters > 1) output += BASE64_ALPHABET[(chunk >> 6) & 63] ?? '';
    if (characters > 2) output += BASE64_ALPHABET[chunk & 63] ?? '';
  }

  return output.replace(/\+/g, '-').replace(/\//g, '_');
}

/** Un JWT de verdad en su forma, con la firma falsa: aquí nadie la verifica. */
function tokenWith(payload: Record<string, unknown>): string {
  const encode = (value: unknown): string => toBase64Url(JSON.stringify(value));

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma-que-no-se-mira`;
}

const NOW = Date.UTC(2026, 7, 10, 12, 0, 0);

describe('expiryFromAccessToken', () => {
  it('reads exp as SECONDS since epoch, not milliseconds', () => {
    // Si alguien lo tomara por milisegundos, este token duraría hasta el año 3.7 millones.
    const expSeconds = Math.floor(NOW / 1000) + 900;

    expect(expiryFromAccessToken(tokenWith({ exp: expSeconds }))).toBe(expSeconds * 1000);
  });

  it('survives a payload with accents, which is where a naive base64 decoder breaks', () => {
    const expSeconds = Math.floor(NOW / 1000) + 60;
    const token = tokenWith({ exp: expSeconds, name: 'Martín Núñez', city: 'Bogotá' });

    expect(expiryFromAccessToken(token)).toBe(expSeconds * 1000);
  });

  it('returns null instead of throwing on anything that is not a JWT', () => {
    expect(expiryFromAccessToken('')).toBeNull();
    expect(expiryFromAccessToken('no-es-un-jwt')).toBeNull();
    expect(expiryFromAccessToken('a.b')).toBeNull();
    expect(expiryFromAccessToken('a.no-es-base64-valido!!.c')).toBeNull();
  });

  it('returns null when there is no usable exp claim', () => {
    expect(expiryFromAccessToken(tokenWith({ sub: 'usr_1' }))).toBeNull();
    expect(expiryFromAccessToken(tokenWith({ exp: 'mañana' }))).toBeNull();
    expect(expiryFromAccessToken(tokenWith({ exp: null }))).toBeNull();
  });

  it('returns null for a payload that is not an object', () => {
    expect(expiryFromAccessToken(`cabecera.${toBase64Url('[1,2,3]')}.firma`)).toBeNull();
  });
});

describe('expiresAtFrom', () => {
  it('uses the claim when the token has one', () => {
    const expSeconds = Math.floor(NOW / 1000) + 900;

    expect(expiresAtFrom(tokenWith({ exp: expSeconds }), NOW)).toBe(expSeconds * 1000);
  });

  it('falls back to a SHORT ttl when the token cannot be read', () => {
    // Corto a propósito: renovar de más cuesta una petición; asumir de más deja al usuario
    // con un token muerto en la mano.
    expect(expiresAtFrom('token-opaco', NOW)).toBe(NOW + FALLBACK_ACCESS_TOKEN_TTL_MS);
    expect(FALLBACK_ACCESS_TOKEN_TTL_MS).toBeLessThanOrEqual(5 * 60_000);
  });
});
