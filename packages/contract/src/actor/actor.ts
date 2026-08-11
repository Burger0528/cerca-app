/**
 * OWNER: Salvador.
 *
 * Espejo de `actorResponseSchema` del backend (`packages/contract/src/auth/auth.schemas.ts`
 * de cerca-api). Esta es la forma que CRUZA LA RED, no la fila de la base de datos: el
 * servidor no manda nunca el `passwordHash`, y tampoco el nombre ni el correo.
 *
 * Un Actor tiene CAPACIDADES (qué puede hacer en el marketplace) y UN rol de plataforma
 * (qué puede hacer sobre la plataforma). Son dos ejes distintos y no se mezclan.
 *
 * Nunca existe `role: 'both'`. Una cuenta que compra y vende tiene las dos capacidades en
 * el array, y pasa `has(actor, 'customer')` y `has(actor, 'provider')` a la vez.
 */
import { z } from 'zod';

export const CAPACITIES = ['customer', 'provider'] as const;
export type Capacity = (typeof CAPACITIES)[number];

export const PLATFORM_ROLES = ['user', 'moderator', 'admin'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const capacitySchema = z.enum(CAPACITIES);
export const platformRoleSchema = z.enum(PLATFORM_ROLES);

/**
 * `displayName`, `email` y `avatarUrl` NO están porque el backend no los manda: su
 * `toActorResponse` devuelve exactamente estos tres campos, y `GET /v1/me` también.
 * Ponerlos aquí como opcionales sería fingir que algún día llegan. Ver `docs/contract-delta.md`.
 */
export const actorSchema = z.object({
  id: z.uuid(),
  capacities: z.array(capacitySchema).readonly(),
  platformRole: platformRoleSchema,
});

export type Actor = z.infer<typeof actorSchema>;
