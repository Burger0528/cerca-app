/**
 * OWNER: Salvador.
 *
 * Las claves de i18n que llegan en TIEMPO DE EJECUCIÓN, convertidas en claves conocidas.
 *
 * Hay dos sitios donde una clave no se escribe a mano en el JSX: el `message` de un schema
 * de Zod y el `reason` de un `problem+json`. Los dos son `string` para el compilador, así
 * que sin esto habría que meter un `as` — y el linter no lo permite, con razón.
 *
 * Pasarlas por una lista blanca resuelve las dos cosas a la vez:
 *   - `t()` recibe una clave del tipo correcto, sin aserción.
 *   - Un backend no puede hacer que la app pinte una clave que nos inventemos nosotros.
 *     Un `reason` desconocido cae en un mensaje genérico, no en `errors.raro.sin.traducir`
 *     escrito en pantalla.
 */

/** Los mensajes que ponen los schemas de `@cerca/contract`. */
export const VALIDATION_MESSAGE_KEYS = [
  'validation.email.invalid',
  'validation.password.required',
  'validation.password.tooShort',
  'validation.displayName.required',
  'validation.displayName.tooLong',
  'validation.password.tooLong',
  'validation.category.required',
  'validation.title.tooShort',
  'validation.title.tooLong',
  'validation.description.required',
  'validation.description.tooLong',
  'validation.amount.invalid',
  'validation.minimumHours.invalid',
] as const;

export type ValidationMessageKey = (typeof VALIDATION_MESSAGE_KEYS)[number];

export function isValidationMessageKey(value: string): value is ValidationMessageKey {
  return VALIDATION_MESSAGE_KEYS.some((key) => key === value);
}

/** Lo que se le puede enseñar a alguien cuando algo falla. */
export type FeedbackMessageKey =
  | 'auth.errors.invalidCredentials'
  | 'auth.errors.emailTaken'
  | 'auth.errors.accountSuspended'
  | 'auth.errors.sessionExpired'
  | 'errors.locationRequired'
  | 'errors.network'
  | 'errors.timeout'
  | 'errors.server'
  | 'errors.contract'
  | 'errors.unknown';

/**
 * `code` del servidor → clave nuestra.
 *
 * Los códigos son los de `DomainError` de cerca-api, en MAYÚSCULAS. Están sacados del
 * backend, no inventados: `grep -rhoE "code: .[A-Z_]+." apps/api/src` los lista todos.
 *
 * Un código que no esté aquí cae en un mensaje genérico. Es a propósito: que el backend
 * añada un error nuevo no puede hacer que la app pinte `LISTING_REMOVED` en pantalla.
 */
const CODE_TO_MESSAGE_KEY: Readonly<Record<string, FeedbackMessageKey>> = {
  INVALID_CREDENTIALS: 'auth.errors.invalidCredentials',
  EMAIL_TAKEN: 'auth.errors.emailTaken',
  ACCOUNT_SUSPENDED: 'auth.errors.accountSuspended',
  ACCOUNT_UNAVAILABLE: 'auth.errors.accountSuspended',
  INVALID_REFRESH_TOKEN: 'auth.errors.sessionExpired',
  REFRESH_TOKEN_EXPIRED: 'auth.errors.sessionExpired',
  REFRESH_TOKEN_REUSED: 'auth.errors.sessionExpired',
  LOCATION_REQUIRED: 'errors.locationRequired',
  INTERNAL_ERROR: 'errors.server',
};

export function messageKeyForReason(code: string | null | undefined): FeedbackMessageKey {
  if (code === null || code === undefined) return 'errors.unknown';

  return CODE_TO_MESSAGE_KEY[code] ?? 'errors.unknown';
}
