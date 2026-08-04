import type { Coordinates } from '../geo/coordinates';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * De dónde sale el punto desde el que se mide la distancia.
 *
 * Que sea una unión y no un `Coordinates | null` es lo que hace posible el criterio de
 * aceptación de US-08: la pantalla necesita saber si NO hay origen porque nadie lo pidió
 * todavía, porque el usuario dijo que no, o porque el GPS está apagado. Cada caso enseña
 * una cosa distinta, y "quedarse en blanco" no es ninguna de ellas.
 */
export type SearchOrigin =
  | { readonly kind: 'device'; readonly coordinates: Coordinates }
  | { readonly kind: 'city'; readonly city: City }
  | { readonly kind: 'unset' };

export const NO_ORIGIN: SearchOrigin = { kind: 'unset' };

/** Ciudad del selector, la salida digna cuando no hay permiso de ubicación. */
export interface City {
  readonly id: string;
  /** Nombre propio: no se traduce, va igual en los tres idiomas. */
  readonly name: string;
  readonly countryCode: string;
  readonly coordinates: Coordinates;
}

export interface LocationPort {
  /** Lee el permiso SIN pedirlo. Es lo que se consulta al arrancar. */
  getPermissionStatus(): Promise<LocationPermissionStatus>;
  /** Abre el diálogo del sistema. Solo se llama por un gesto del usuario. */
  requestPermission(): Promise<LocationPermissionStatus>;
  /** ¿Está el GPS del teléfono encendido? Se puede tener permiso y tenerlo apagado. */
  isEnabled(): Promise<boolean>;
  getCurrentCoordinates(): Promise<Coordinates>;
  /** Lleva a los Ajustes del sistema, que es el único sitio donde se revierte un "no". */
  openSettings(): Promise<void>;
}

export function coordinatesOf(origin: SearchOrigin): Coordinates | null {
  switch (origin.kind) {
    case 'device':
      return origin.coordinates;
    case 'city':
      return origin.city.coordinates;
    case 'unset':
      return null;
  }
}
