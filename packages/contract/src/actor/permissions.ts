/**
 * OWNER: Salvador.
 *
 * Jorge deja montada la forma: los tipos, las dos tablas vacías y las firmas.
 * Salvador rellena la matriz completa del enunciado e implementa `has()` y `can()`.
 *
 * Recordatorio del enunciado: ninguna comprobación aquí protege nada. La autoridad es
 * el servidor; esto solo sirve para no enseñar botones que van a devolver 403.
 */
import type { Actor, Capacity, PlatformRole } from './actor.ts';

/**
 * TODO(salvador): sustituir por la unión literal completa de la matriz.
 * Ejemplo de la forma que se espera:
 *   export type Permission = 'listing:create' | 'booking:request' | 'listing:moderate' | ...
 */
export type Permission = string;

/** Qué desbloquea cada capacidad del marketplace. */
export const CAPACITY_PERMISSIONS: Readonly<Record<Capacity, readonly Permission[]>> = {
  // TODO(salvador): matriz del enunciado.
  customer: [],
  provider: [],
};

/** Qué desbloquea cada rol de plataforma. */
export const PLATFORM_PERMISSIONS: Readonly<Record<PlatformRole, readonly Permission[]>> = {
  // TODO(salvador): matriz del enunciado.
  user: [],
  moderator: [],
  admin: [],
};

/** ¿El actor tiene esta capacidad? */
export function has(_actor: Actor, _capacity: Capacity): boolean {
  throw new Error('TODO(salvador): implementar has() — packages/contract/src/actor/permissions.ts');
}

/** ¿El actor puede hacer esto, por capacidad o por rol de plataforma? */
export function can(_actor: Actor, _permission: Permission): boolean {
  throw new Error('TODO(salvador): implementar can() — packages/contract/src/actor/permissions.ts');
}
