/**
 * Los cuatro fallos que la app sabe distinguir. Todo lo demás es un bug, no un error.
 *
 * Existen como clases y no como strings sueltos porque la UI decide el estado que enseña
 * mirando el TIPO, no parseando un mensaje.
 */
import type { ProblemDetails } from '@cerca/contract';

/** No se llegó al servidor: sin red, DNS caído, avión. Reintentar tiene sentido. */
export class NetworkError extends Error {
  override readonly name = 'NetworkError';

  constructor(cause?: unknown) {
    super('No se pudo alcanzar el servidor', { cause });
  }
}

/** El servidor tardó más de la cuenta. Reintentar tiene sentido. */
export class TimeoutError extends Error {
  override readonly name = 'TimeoutError';

  constructor(readonly milliseconds: number) {
    super(`La petición pasó de ${milliseconds} ms`);
  }
}

/** El servidor contestó con un código de error. Reintentar depende del código. */
export class HttpError extends Error {
  override readonly name = 'HttpError';

  constructor(
    readonly status: number,
    readonly problem: ProblemDetails | null,
    readonly url: string,
  ) {
    super(`${status} en ${url}${problem?.code ? ` (${problem.code})` : ''}`);
  }

  /**
   * La clave estable de negocio, si el servidor la mandó. Es lo que la UI traduce.
   * `problem.detail` es prosa del servidor y no se enseña nunca tal cual.
   *
   * Se prefiere `code` porque es el que viene siempre; `reason` solo acompaña a algunos
   * errores y es más fino (`not_owner`). Si algún día un error trae los dos y la UI
   * necesita distinguirlos, `problem` sigue entero ahí.
   */
  get reason(): string | null {
    return this.problem?.code ?? this.problem?.reason ?? null;
  }

  /** El identificador de la petición en los logs del servidor, para poder buscarla. */
  get traceId(): string | null {
    return this.problem?.traceId ?? null;
  }

  /** 401 y 403 no se reintentan: reintentar no va a cambiar quién eres. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/**
 * El servidor contestó 200 pero con una forma que no es la del contrato.
 *
 * Esto no se reintenta y no se traga: revienta aquí, en el límite, diciendo QUÉ campo
 * falla. Es literalmente el criterio de aceptación de "cambio a mano un campo obligatorio
 * de la respuesta y la app falla en el parse, no tres pantallas después".
 */
export class ContractViolationError extends Error {
  override readonly name = 'ContractViolationError';

  constructor(
    readonly endpoint: string,
    readonly issues: readonly string[],
  ) {
    super(`La respuesta de ${endpoint} no cumple el contrato:\n  · ${issues.join('\n  · ')}`);
  }
}

/** ¿Merece la pena reintentar esto solo? Lo usa la política de retry de TanStack Query. */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof NetworkError || error instanceof TimeoutError) return true;
  if (error instanceof HttpError) return !error.isAuthError && error.status >= 500;
  return false;
}
