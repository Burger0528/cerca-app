/**
 * OWNER: Jorge.
 *
 * RFC 9457 `application/problem+json`, más el campo `reason` que añade Cerca.
 * `reason` es una clave estable para el cliente ("email_taken", "listing_paused"); `detail`
 * es prosa del servidor y NO se enseña al usuario tal cual: se traduce por `reason`.
 */
import { z } from 'zod';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export const problemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  /** Clave estable de negocio. Lo que el cliente mapea a un mensaje de i18n. */
  reason: z.string().optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
