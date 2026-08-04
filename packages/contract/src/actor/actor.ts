/**
 * OWNER: Salvador — tipos acordados el día cero, Salvador manda sobre este archivo.
 *
 * Un Actor tiene CAPACIDADES (qué puede hacer en el marketplace) y UN rol de plataforma
 * (qué puede hacer sobre la plataforma). Son dos ejes distintos y no se mezclan.
 *
 * Nunca existe `role: 'both'`. Una cuenta que compra y vende tiene las dos capacidades
 * en el array, y pasa `has(actor, 'customer')` y `has(actor, 'provider')` a la vez.
 */
import { z } from 'zod';

export const CAPACITIES = ['customer', 'provider'] as const;
export type Capacity = (typeof CAPACITIES)[number];

export const PLATFORM_ROLES = ['user', 'moderator', 'admin'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const capacitySchema = z.enum(CAPACITIES);
export const platformRoleSchema = z.enum(PLATFORM_ROLES);

export const actorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  capacities: z.array(capacitySchema).readonly(),
  platformRole: platformRoleSchema,
  avatarUrl: z.url().nullable().default(null),
});

export type Actor = z.infer<typeof actorSchema>;
