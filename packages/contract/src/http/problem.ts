/**
 * OWNER: Jorge, corregido contra el backend real.
 *
 * RFC 9457 `application/problem+json`, tal y como lo emite `DomainExceptionFilter` de
 * cerca-api.
 *
 * OJO CON LA DIFERENCIA, que costó un bug: la clave estable de negocio es **`code`**
 * (`INVALID_CREDENTIALS`, `LOCATION_REQUIRED`), en MAYÚSCULAS, y viene SIEMPRE. El `reason`
 * existe pero es opcional y significa otra cosa: el motivo de política que acompaña a
 * algunos errores (`not_owner`, `already_reviewed`).
 *
 * Leer solo `reason` —que es lo que hacía este schema— dejaba a la app sin clave que
 * traducir en la inmensa mayoría de errores, y todo acababa en "Algo ha salido mal".
 *
 * `detail` es prosa del servidor y NO se enseña al usuario tal cual: se traduce por `code`.
 */
import { z } from 'zod';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export const problemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  /** Clave estable de negocio, en MAYÚSCULAS. Lo que el cliente mapea a un mensaje de i18n. */
  code: z.string().optional(),
  /** Motivo de política, cuando el error lo lleva. Más fino que `code`, y opcional. */
  reason: z.string().optional(),
  /** Errores por campo de una validación de Zod en el servidor. */
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  /**
   * Identificador de la petición en los logs del servidor.
   *
   * No se enseña en pantalla, pero es lo que convierte "me ha dado un error" en algo que
   * alguien puede buscar. Va al informe de errores, no al usuario.
   */
  traceId: z.string().optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
