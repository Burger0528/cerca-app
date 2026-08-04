/**
 * Qué hacer con la ubicación al arrancar, incluida la parte fea: que el usuario diga que
 * no. Esto es US-08 entero, y no vive en la pantalla porque no depende de cómo se pinte.
 */
import type { LocationPort, SearchOrigin } from '../../domain/location/location';
import { NO_ORIGIN } from '../../domain/location/location';

/**
 * Por qué no hay ubicación. Cada motivo pide una salida distinta en la UI, y ninguna de
 * ellas es una pantalla en blanco.
 */
export type OriginBlocker =
  /** Aún no se ha preguntado: se puede enseñar un botón que pida el permiso. */
  | 'permission-undetermined'
  /** Dijo que no: el diálogo del sistema ya no vuelve a salir. Toca selector de ciudad. */
  | 'permission-denied'
  /** Permiso concedido pero el GPS del teléfono está apagado. */
  | 'services-disabled'
  /** Había permiso y aun así el fix falló: interiores, chip ocupado, timeout. */
  | 'position-unavailable';

export type OriginResolution =
  | { readonly kind: 'resolved'; readonly origin: SearchOrigin }
  | { readonly kind: 'blocked'; readonly reason: OriginBlocker };

/**
 * Lee la ubicación SIN pedir permiso.
 *
 * Que no pida es deliberado: el diálogo del sistema solo sale una vez en la vida de la
 * instalación, y quemarlo en el arranque —antes de que el usuario sepa para qué sirve la
 * app— es la mejor forma de que le den a "no permitir" para siempre. Se pide después, con
 * contexto, desde `requestDeviceOrigin`.
 */
export async function resolveDeviceOrigin(location: LocationPort): Promise<OriginResolution> {
  const status = await location.getPermissionStatus();

  if (status === 'undetermined') {
    return { kind: 'blocked', reason: 'permission-undetermined' };
  }
  if (status === 'denied') {
    return { kind: 'blocked', reason: 'permission-denied' };
  }
  if (!(await location.isEnabled())) {
    return { kind: 'blocked', reason: 'services-disabled' };
  }

  try {
    const coordinates = await location.getCurrentCoordinates();
    return { kind: 'resolved', origin: { kind: 'device', coordinates } };
  } catch {
    // Un fix fallido no es un permiso denegado. Se distinguen porque la salida es otra:
    // aquí tiene sentido un "reintentar"; en el denegado, no.
    return { kind: 'blocked', reason: 'position-unavailable' };
  }
}

/**
 * Pide el permiso y, si lo dan, devuelve la ubicación. Solo desde un gesto del usuario.
 */
export async function requestDeviceOrigin(location: LocationPort): Promise<OriginResolution> {
  const status = await location.requestPermission();

  if (status !== 'granted') {
    return { kind: 'blocked', reason: 'permission-denied' };
  }

  return resolveDeviceOrigin(location);
}

/** El origen con el que se arranca antes de saber nada. */
export const INITIAL_ORIGIN: SearchOrigin = NO_ORIGIN;
