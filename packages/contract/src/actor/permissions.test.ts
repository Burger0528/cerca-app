/**
 * OWNER: Salvador.
 *
 * Jorge deja los tests que exigen los criterios de aceptación, en `todo`. Salvador quita
 * el `.todo`, implementa y los pone en verde. No son sugerencias: son la lista de QA del
 * enunciado escrita en código, para que no haya que acordarse de ella en la revisión.
 */
import { describe, it } from 'vitest';

describe('has()', () => {
  it.todo(
    'an account with both capacities passes has(actor, "customer") AND has(actor, "provider")',
  );
  it.todo('there is no role: "both" anywhere in the codebase');
  it.todo('returns false for a capacity the actor does not hold');
});

describe('can()', () => {
  it.todo('at least one row per capacity, taken from the matrix in the brief');
  it.todo('at least one row per platform role, taken from the matrix in the brief');
  it.todo('a permission granted by the platform role works regardless of capacities');
  it.todo('an unknown permission is denied rather than throwing');
});
