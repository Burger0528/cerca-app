import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { HttpError, isRetriableError } from '../../domain/errors/app-error';

/** Tres intentos en total: el original y dos reintentos. */
const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * `retry: false` para 401 y 403, que es el criterio de aceptación.
         *
         * Reintentar un 403 tres veces no cambia quién eres: son tres peticiones que van a
         * fallar igual, tres veces el tiempo hasta enseñar el error, y ruido en los logs
         * del servidor que parece un ataque. Igual con un 404 o un 422: el servidor ya ha
         * contestado y su respuesta no va a mejorar sola.
         *
         * Se reintenta solo lo que puede salir bien la próxima: red caída, timeout, 5xx.
         */
        retry: (failureCount, error) => {
          if (error instanceof HttpError && error.isAuthError) return false;
          if (!isRetriableError(error)) return false;
          return failureCount < MAX_RETRIES;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

        /**
         * Un minuto de frescura. En móvil, volver a la app cada dos minutos y refetchear
         * todo es datos del usuario y batería a cambio de nada: los servicios de un barrio
         * no cambian en 60 segundos.
         */
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnReconnect: true,
      },
      mutations: {
        // Una mutación reintentada sola puede crear dos reservas. Reintenta el usuario.
        retry: false,
      },
    },
  });
}

/**
 * En web, TanStack Query se entera de que vuelves a la pestaña por el evento `focus`. En
 * React Native ese evento no existe: hay que traducirlo del ciclo de vida de la app.
 *
 * Devuelve la función de limpieza.
 */
export function bindAppStateToFocusManager(): () => void {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });

  return () => subscription.remove();
}
