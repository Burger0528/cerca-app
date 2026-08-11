/**
 * OWNER: Salvador.
 *
 * Este archivo existe por un bug real, encontrado la primera vez que la app habló con el
 * backend: el schema de `problem+json` solo leía `reason`, pero cerca-api pone la clave
 * estable en `code`. Resultado, todos los errores caían en "Algo ha salido mal".
 *
 * Los códigos de aquí están copiados del backend, no inventados:
 *   grep -rhoE "code: '[A-Z_]+'" apps/api/src
 */
import { isValidationMessageKey, messageKeyForReason } from './message-keys';

describe('messageKeyForReason', () => {
  it('translates the codes the backend actually emits', () => {
    expect(messageKeyForReason('INVALID_CREDENTIALS')).toBe('auth.errors.invalidCredentials');
    expect(messageKeyForReason('EMAIL_TAKEN')).toBe('auth.errors.emailTaken');
    expect(messageKeyForReason('LOCATION_REQUIRED')).toBe('errors.locationRequired');
  });

  it('treats every flavour of a dead refresh token as one expired session', () => {
    // Al usuario le da igual si el token caducó o si se reutilizó: tiene que volver a entrar.
    for (const code of ['INVALID_REFRESH_TOKEN', 'REFRESH_TOKEN_EXPIRED', 'REFRESH_TOKEN_REUSED']) {
      expect(messageKeyForReason(code)).toBe('auth.errors.sessionExpired');
    }
  });

  it('falls back instead of painting a raw code on screen', () => {
    // Un backend más nuevo que esta versión de la app emite códigos que no conocemos.
    expect(messageKeyForReason('LISTING_REMOVED')).toBe('errors.unknown');
    expect(messageKeyForReason('CODIGO_INVENTADO')).toBe('errors.unknown');
    expect(messageKeyForReason(null)).toBe('errors.unknown');
    expect(messageKeyForReason(undefined)).toBe('errors.unknown');
  });

  it('is case sensitive, because the backend codes are upper case', () => {
    // Si esto pasara, sería que alguien normalizó por su cuenta y el mapa dejó de reflejar
    // lo que el servidor manda.
    expect(messageKeyForReason('invalid_credentials')).toBe('errors.unknown');
  });
});

describe('isValidationMessageKey', () => {
  it('accepts the keys our own schemas emit', () => {
    expect(isValidationMessageKey('validation.email.invalid')).toBe(true);
    expect(isValidationMessageKey('validation.password.tooShort')).toBe(true);
  });

  it('rejects anything else, so a stray string never reaches t()', () => {
    expect(isValidationMessageKey('validation.inventada')).toBe(false);
    expect(isValidationMessageKey('Correo inválido')).toBe(false);
  });
});
