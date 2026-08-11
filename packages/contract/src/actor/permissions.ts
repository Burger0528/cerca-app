/**
 * OWNER: Salvador.
 *
 * La matriz de permisos — capa 1 de la autorización.
 *
 * Un marketplace de dos lados tiene una propiedad que casi ninguna API de práctica tiene:
 * el permiso NO sale de un único rol. Marta da clases de guitarra Y contrata un fontanero:
 * es `customer` y `provider` a la vez. Por eso una cuenta lleva un CONJUNTO de capacidades
 * y, aparte, un rol de plataforma (`user | moderator | admin`) en su propia columna — un
 * moderador también contrata servicios como cualquiera, que es justo por lo que los dos
 * ejes van separados.
 *
 * `can()` hace un OR de las dos fuentes.
 *
 * La matriz está copiada de `packages/contract/src/auth/permissions.ts` del backend, que
 * es de donde se construye su PolicyGuard de CASL. Si las dos se separan, el cliente
 * enseña botones que devuelven 403. Ver [docs/contract-delta.md] antes de tocar nada aquí.
 *
 * Recordatorio del enunciado: ninguna comprobación aquí protege nada. La autoridad es el
 * servidor; esto solo sirve para no enseñar botones que van a devolver 403.
 */
import type { Actor, Capacity, PlatformRole } from './actor.ts';

export const PERMISSIONS = [
  'listing:read',
  'listing:create',
  'listing:update',
  'listing:moderate',
  'booking:request',
  'booking:accept',
  'review:write',
  'review:moderate',
  'report:resolve',
  'user:suspend',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Qué desbloquea cada capacidad del marketplace. */
export const CAPACITY_PERMISSIONS: Readonly<Record<Capacity, readonly Permission[]>> = {
  customer: ['listing:read', 'booking:request', 'review:write'],
  provider: [
    'listing:read',
    'listing:create',
    'listing:update',
    'booking:request',
    'booking:accept',
    'review:write',
  ],
};

/** Qué desbloquea cada rol de plataforma, ADEMÁS de las capacidades que tenga la cuenta. */
export const PLATFORM_PERMISSIONS: Readonly<Record<PlatformRole, readonly Permission[]>> = {
  user: [],
  moderator: [
    'listing:read',
    'listing:moderate',
    'booking:request',
    'review:write',
    'review:moderate',
    'report:resolve',
  ],
  admin: [
    'listing:read',
    'listing:create',
    'listing:update',
    'listing:moderate',
    'booking:request',
    'review:write',
    'review:moderate',
    'report:resolve',
    'user:suspend',
  ],
};

/**
 * Las tablas se indexan una vez al cargar el módulo, no en cada llamada.
 *
 * `can()` se llama desde el render de una lista: con `includes()` sobre arrays sería un
 * recorrido lineal por tarjeta y por permiso. Con `Set` es una consulta constante, y el
 * coste de construirlo se paga una sola vez en toda la vida del proceso.
 */
const CAPACITY_INDEX: Readonly<Record<Capacity, ReadonlySet<Permission>>> = {
  customer: new Set(CAPACITY_PERMISSIONS.customer),
  provider: new Set(CAPACITY_PERMISSIONS.provider),
};

const PLATFORM_INDEX: Readonly<Record<PlatformRole, ReadonlySet<Permission>>> = {
  user: new Set(PLATFORM_PERMISSIONS.user),
  moderator: new Set(PLATFORM_PERMISSIONS.moderator),
  admin: new Set(PLATFORM_PERMISSIONS.admin),
};

/**
 * ¿El actor tiene esta capacidad?
 *
 * Nunca existe `role: 'both'`: una cuenta que compra y vende lleva las dos capacidades en
 * el array y pasa `has(actor, 'customer')` y `has(actor, 'provider')` a la vez.
 */
export function has(actor: Actor, capacity: Capacity): boolean {
  return actor.capacities.includes(capacity);
}

/**
 * ¿El actor puede hacer esto, por capacidad o por rol de plataforma?
 *
 * Un permiso desconocido se DENIEGA en vez de lanzar. Si esto explotara, un backend que
 * añade un permiso nuevo tumbaría una pantalla de una versión anterior de la app; negar
 * es lo que hace que la app vieja simplemente no enseñe el botón.
 */
export function can(actor: Actor, permission: Permission): boolean {
  if (PLATFORM_INDEX[actor.platformRole]?.has(permission) === true) return true;

  return actor.capacities.some((capacity) => CAPACITY_INDEX[capacity]?.has(permission) === true);
}
