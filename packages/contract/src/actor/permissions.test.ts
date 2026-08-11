/**
 * OWNER: Salvador.
 *
 * Los criterios de aceptación del enunciado, escritos en código. Cada `it` de aquí es una
 * fila de la lista de QA, para que no haya que acordarse de ella en la revisión.
 *
 * Las filas de `can()` están tomadas de la matriz del backend
 * (`packages/contract/src/auth/permissions.ts` de cerca-api), que es de donde se construye
 * el PolicyGuard. Si estas dos se separan, la app enseña botones que devuelven 403.
 */
import { describe, expect, it } from 'vitest';

import type { Actor, Capacity, PlatformRole } from './actor.ts';
import { CAPACITIES, PLATFORM_ROLES } from './actor.ts';
import type { Permission } from './permissions.ts';
import { CAPACITY_PERMISSIONS, PLATFORM_PERMISSIONS, can, has } from './permissions.ts';

function actorWith(capacities: Capacity[], platformRole: PlatformRole = 'user'): Actor {
  return { id: 'b1d9f0c2-3e4a-4b5c-8d6e-7f8091a2b3c4', capacities, platformRole };
}

describe('has()', () => {
  it('an account with both capacities passes has(actor, "customer") AND has(actor, "provider")', () => {
    const marta = actorWith(['customer', 'provider']);

    expect(has(marta, 'customer')).toBe(true);
    expect(has(marta, 'provider')).toBe(true);
  });

  it('there is no role: "both" anywhere in the codebase', () => {
    // Ser las dos cosas se representa con DOS entradas en el array, nunca con un valor
    // nuevo. Si alguien añade 'both' a CAPACITIES, este test cae.
    expect(CAPACITIES).toEqual(['customer', 'provider']);
    expect(PLATFORM_ROLES).not.toContain('both');
    expect(Object.keys(CAPACITY_PERMISSIONS)).toEqual(['customer', 'provider']);
  });

  it('returns false for a capacity the actor does not hold', () => {
    expect(has(actorWith(['customer']), 'provider')).toBe(false);
  });
});

describe('can()', () => {
  it('at least one row per capacity, taken from the matrix in the brief', () => {
    const customer = actorWith(['customer']);
    const provider = actorWith(['provider']);

    // customer: lee, reserva y reseña. No publica.
    expect(can(customer, 'listing:read')).toBe(true);
    expect(can(customer, 'booking:request')).toBe(true);
    expect(can(customer, 'review:write')).toBe(true);
    expect(can(customer, 'listing:create')).toBe(false);
    expect(can(customer, 'booking:accept')).toBe(false);

    // provider: publica, edita y ACEPTA reservas. También puede contratar.
    expect(can(provider, 'listing:create')).toBe(true);
    expect(can(provider, 'listing:update')).toBe(true);
    expect(can(provider, 'booking:accept')).toBe(true);
    expect(can(provider, 'booking:request')).toBe(true);
    expect(can(provider, 'listing:moderate')).toBe(false);
  });

  it('at least one row per platform role, taken from the matrix in the brief', () => {
    expect(can(actorWith(['customer'], 'user'), 'listing:moderate')).toBe(false);

    const moderator = actorWith(['customer'], 'moderator');
    expect(can(moderator, 'listing:moderate')).toBe(true);
    expect(can(moderator, 'review:moderate')).toBe(true);
    expect(can(moderator, 'report:resolve')).toBe(true);
    // Moderar no es administrar: suspender cuentas sigue siendo solo del admin.
    expect(can(moderator, 'user:suspend')).toBe(false);

    const admin = actorWith(['customer'], 'admin');
    expect(can(admin, 'user:suspend')).toBe(true);
    expect(can(admin, 'listing:moderate')).toBe(true);
  });

  it('a permission granted by the platform role works regardless of capacities', () => {
    // Un moderador SIN capacidad de provider modera igual: los dos ejes son independientes.
    const moderator = actorWith(['customer'], 'moderator');

    expect(has(moderator, 'provider')).toBe(false);
    expect(can(moderator, 'listing:moderate')).toBe(true);
  });

  it('the two sources are OR-ed, not overridden', () => {
    // El rol `user` no concede nada; lo que puede sale entero de sus capacidades.
    expect(PLATFORM_PERMISSIONS.user).toEqual([]);
    expect(can(actorWith(['provider'], 'user'), 'listing:create')).toBe(true);
  });

  it('an unknown permission is denied rather than throwing', () => {
    // Llega de un backend más nuevo que esta versión de la app. Negar deja la pantalla en
    // pie sin el botón; lanzar la tumbaría entera.
    const unknown = 'listing:teleport' as Permission;

    expect(() => can(actorWith(['provider'], 'admin'), unknown)).not.toThrow();
    expect(can(actorWith(['provider'], 'admin'), unknown)).toBe(false);
  });
});
