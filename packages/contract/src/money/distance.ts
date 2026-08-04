/**
 * OWNER: Salvador.
 *
 * Kilómetros o millas según el locale. La app siempre guarda metros; la conversión y el
 * redondeo viven aquí para que ninguna pantalla haga `/ 1000` por su cuenta.
 */

/** Distancia siempre en metros. Igual que Money: nunca un `number` suelto sin unidad. */
export interface Distance {
  readonly meters: number;
}

export function formatDistance(_distance: Distance, _locale: string): string {
  throw new Error(
    'TODO(salvador): implementar formatDistance() — packages/contract/src/money/distance.ts',
  );
}
