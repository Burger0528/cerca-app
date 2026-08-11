import type { Actor } from '@cerca/contract';

/** Lo que se guarda en el llavero. `expiresAt` en epoch ms, para no depender de la zona. */
export interface StoredTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
}

/**
 * El registro completo de la sesión.
 *
 * El actor se guarda junto a los tokens a propósito: al reabrir la app se puede decir
 * "sigues dentro" sin esperar a `GET /me`. Sin eso, arrancar en el metro sin cobertura
 * echaría al usuario a login teniendo un token perfectamente válido.
 */
export interface StoredSession {
  readonly tokens: StoredTokens;
  readonly actor: Actor;
}

/**
 * Los tres estados de la sesión, y son tres, no dos.
 *
 * `restoring` es el que evita el parpadeo: mientras se lee el llavero no se sabe si hay
 * sesión, y pintar login "por si acaso" es exactamente el fotograma de más que el criterio
 * de aceptación prohíbe. Un booleano `isSignedIn` arranca en `false` y miente durante los
 * milisegundos que tarda expo-secure-store.
 */
export type SessionState =
  | { readonly status: 'restoring' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'signed-in'; readonly actor: Actor };

export const RESTORING: SessionState = { status: 'restoring' };
export const SIGNED_OUT: SessionState = { status: 'signed-out' };

export function signedIn(actor: Actor): SessionState {
  return { status: 'signed-in', actor };
}

/**
 * Margen con el que se considera caducado un token antes de tiempo.
 *
 * Sin margen, un token que caduca dentro de 200 ms se manda igual y vuelve 401 a mitad de
 * la petición. Con 60 s de colchón se renueva antes de que eso pase.
 */
export const TOKEN_EXPIRY_SKEW_MS = 60_000;

export function isExpired(
  tokens: StoredTokens,
  now: number,
  skewMilliseconds: number = TOKEN_EXPIRY_SKEW_MS,
): boolean {
  return tokens.expiresAt - skewMilliseconds <= now;
}

export { expiresAtFrom, expiryFromAccessToken } from './access-token';
