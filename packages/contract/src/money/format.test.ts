/**
 * OWNER: Salvador.
 *
 * Los criterios de aceptación de dinero, en `todo`. Quita el `.todo` cuando implementes
 * `formatMoney`.
 *
 * Ojo con Node: `Intl` completo hace falta para que `de-DE` no caiga a `en-US` en
 * silencio. Node 24 lo trae de serie (full-icu); si algún test da un separador raro, ahí
 * está la causa.
 */
import { describe, it } from 'vitest';

describe('formatMoney', () => {
  it.todo('129990 MXN in es-MX reads $1,299.90');
  it.todo('129990 MXN in en-US reads MX$1,299.90');
  it.todo('129990 MXN in de-DE reads 1.299,90 MX$');
  it.todo('a JPY amount is not divided by 100');
  it.todo('a KWD amount is divided by 1000');
  it.todo('an unknown currency falls back to two minor-unit digits');
});

describe('formatDistance', () => {
  it.todo('shows kilometres in es-MX and de-DE');
  it.todo('shows miles in en-US');
  it.todo('shows metres below one kilometre instead of 0.4 km');
});
