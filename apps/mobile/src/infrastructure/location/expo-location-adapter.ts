import * as ExpoLocation from 'expo-location';
import { Linking } from 'react-native';

import type { Coordinates } from '../../domain/geo/coordinates';
import type { LocationPermissionStatus, LocationPort } from '../../domain/location/location';

export function createExpoLocationAdapter(): LocationPort {
  return {
    async getPermissionStatus(): Promise<LocationPermissionStatus> {
      // `get`, no `request`: esto solo MIRA. Pedir el permiso desde el arranque quema el
      // único diálogo que da el sistema, antes de que el usuario sepa para qué es.
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      return toDomainStatus(status);
    },

    async requestPermission(): Promise<LocationPermissionStatus> {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return toDomainStatus(status);
    },

    isEnabled(): Promise<boolean> {
      // Tener permiso y tener el GPS encendido son cosas distintas. Se puede tener lo
      // primero sin lo segundo, y entonces `getCurrentPositionAsync` se queda colgado.
      return ExpoLocation.hasServicesEnabledAsync();
    },

    async getCurrentCoordinates(): Promise<Coordinates> {
      const position = await ExpoLocation.getCurrentPositionAsync({
        // `Balanced` (~100 m) y no `Highest`: para ordenar servicios por distancia sobra,
        // y `Highest` enciende el GPS de verdad, tarda segundos y se come la batería.
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    },

    async openSettings(): Promise<void> {
      // Una vez denegado, el diálogo del sistema no vuelve a salir. El único camino de
      // vuelta son los Ajustes, así que la app tiene que llevar hasta ahí.
      await Linking.openSettings();
    },
  };
}

function toDomainStatus(status: ExpoLocation.PermissionStatus): LocationPermissionStatus {
  switch (status) {
    case ExpoLocation.PermissionStatus.GRANTED:
      return 'granted';
    case ExpoLocation.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}
