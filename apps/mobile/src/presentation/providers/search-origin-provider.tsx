/**
 * De dónde se mide "cerca". US-08 vive aquí.
 *
 * Tres caminos y ninguno acaba en pantalla en blanco:
 *   permiso concedido  → ubicación del dispositivo
 *   permiso denegado   → selector de ciudad
 *   ciudad elegida     → coordenadas de la ciudad, y a buscar igual
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { OriginBlocker, OriginResolution } from '../../application/location/resolve-origin';
import {
  requestDeviceOrigin,
  resolveDeviceOrigin,
} from '../../application/location/resolve-origin';
import type { City, SearchOrigin } from '../../domain/location/location';
import { NO_ORIGIN } from '../../domain/location/location';

import { createRequiredContext } from './create-required-context';
import { useServices } from './services-provider';

interface SearchOriginContextValue {
  readonly origin: SearchOrigin;
  /** `true` mientras se resuelve por primera vez. La lista enseña skeleton, no vacío. */
  readonly isResolving: boolean;
  /** Por qué no hay ubicación, si no la hay. `null` cuando sí. */
  readonly blocker: OriginBlocker | null;
  /** Abre el diálogo del sistema. Solo desde un botón. */
  requestDeviceLocation(): Promise<void>;
  /** La salida cuando el permiso está denegado. */
  chooseCity(city: City): void;
  /** Lleva a los Ajustes, el único sitio donde se revierte un "no permitir". */
  openSystemSettings(): Promise<void>;
}

const [SearchOriginContext, useSearchOrigin] =
  createRequiredContext<SearchOriginContextValue>('useSearchOrigin()');

export { useSearchOrigin };

export function SearchOriginProvider({ children }: { children: ReactNode }) {
  const services = useServices();
  const [origin, setOrigin] = useState<SearchOrigin>(NO_ORIGIN);
  const [blocker, setBlocker] = useState<OriginBlocker | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  /**
   * Los dos caminos —mirar el permiso al arrancar y pedirlo desde el botón— terminan en la
   * misma decisión, así que la decisión vive una sola vez.
   */
  const applyResolution = useCallback((resolution: OriginResolution) => {
    if (resolution.kind === 'resolved') {
      setOrigin(resolution.origin);
      setBlocker(null);
    } else {
      setBlocker(resolution.reason);
    }
  }, []);

  // Al arrancar solo se MIRA el permiso, no se pide. Si ya estaba concedido de una sesión
  // anterior, la ubicación aparece sola y el usuario no ve ningún diálogo.
  useEffect(() => {
    let cancelled = false;

    resolveDeviceOrigin(services.location)
      .then((resolution) => {
        if (!cancelled) applyResolution(resolution);
      })
      .catch(() => {
        if (!cancelled) setBlocker('position-unavailable');
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [services.location, applyResolution]);

  const requestDeviceLocation = useCallback(async () => {
    setIsResolving(true);
    try {
      applyResolution(await requestDeviceOrigin(services.location));
    } finally {
      setIsResolving(false);
    }
  }, [services.location, applyResolution]);

  const chooseCity = useCallback((city: City) => {
    setOrigin({ kind: 'city', city });
    // El bloqueo se limpia porque ya hay desde dónde buscar. El permiso sigue denegado,
    // pero eso ha dejado de impedir nada, que es de lo que iba la historia.
    setBlocker(null);
  }, []);

  const openSystemSettings = useCallback(async () => {
    await services.location.openSettings();
  }, [services.location]);

  const value = useMemo<SearchOriginContextValue>(
    () => ({ origin, isResolving, blocker, requestDeviceLocation, chooseCity, openSystemSettings }),
    [origin, isResolving, blocker, requestDeviceLocation, chooseCity, openSystemSettings],
  );

  return <SearchOriginContext.Provider value={value}>{children}</SearchOriginContext.Provider>;
}
