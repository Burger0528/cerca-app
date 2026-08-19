/**
 * El estado de sesión de toda la app, y las tres acciones que lo cambian.
 *
 * La guarda de navegación lee de aquí. Que el estado sea una unión de tres casos y no un
 * booleano es lo que hace posible el "sin ni un fotograma de la pantalla de tabs".
 */
import type { SignInRequest, SignUpRequest } from '@cerca/contract';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as sessionUseCases from '../../application/session/use-cases';
import { HttpError } from '../../domain/errors/app-error';
import type { SessionState } from '../../domain/session/session';
import { RESTORING, SIGNED_OUT } from '../../domain/session/session';

import { createRequiredContext } from './create-required-context';
import { useServices } from './services-provider';

interface SessionContextValue {
  readonly state: SessionState;
  signIn(credentials: SignInRequest): Promise<void>;
  signUp(request: SignUpRequest): Promise<void>;
  becomeProvider(): Promise<void>;
  signOut(): Promise<void>;
}

const [SessionContext, useSession] = createRequiredContext<SessionContextValue>('useSession()');

export { useSession };

export function SessionProvider({ children }: { children: ReactNode }) {
  const services = useServices();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>(RESTORING);

  const dependencies = useMemo(
    () => ({
      sessionManager: services.sessionManager,
      authGateway: services.authGateway,
      now: services.now,
    }),
    [services],
  );

  // Paso 1 del arranque: leer el llavero. Mientras dura, el estado es `restoring` y la
  // navegación no pinta NINGÚN grupo de rutas.
  useEffect(() => {
    let cancelled = false;

    sessionUseCases
      .restoreSession(dependencies)
      .then((restored) => {
        if (!cancelled) setState(restored);
      })
      .catch(() => {
        // Si leer el llavero falla, lo honesto es tratarlo como "no hay sesión". Quedarse
        // en `restoring` para siempre sería un splash infinito.
        if (!cancelled) setState(SIGNED_OUT);
      });

    return () => {
      cancelled = true;
    };
  }, [dependencies]);

  // Paso 2, ya sin bloquear: confirmar contra el servidor que el actor sigue siendo el que
  // dice el llavero (le pueden haber cambiado el rol, o baneado). Si contesta 401, fuera.
  // Si no hay red, se sigue con el actor cacheado: la app funciona en el metro.
  useEffect(() => {
    if (state.status !== 'signed-in') return;

    const controller = new AbortController();

    dependencies.authGateway
      .me(controller.signal)
      .then((actor) => {
        if (!controller.signal.aborted) setState({ status: 'signed-in', actor });
      })
      .catch(async (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof HttpError && error.isAuthError) {
          await dependencies.sessionManager.clear();
          setState(SIGNED_OUT);
        }
      });

    return () => controller.abort();
    // Depende de `state.status` y NO del objeto `state` entero: este mismo efecto escribe
    // un `actor` nuevo, y depender de él sería un bucle de revalidación infinito.
  }, [state.status, dependencies]);

  /**
   * El refresh token ha muerto: el llavero ya está vacío, pero la interfaz seguiría
   * creyendo que hay sesión hasta el siguiente arranque. Sin esto, la app enseña pantallas
   * privadas que solo devuelven 401.
   */
  useEffect(
    () =>
      dependencies.sessionManager.onSessionLost(() => {
        setState(SIGNED_OUT);
        queryClient.clear();
      }),
    [dependencies, queryClient],
  );

  const signIn = useCallback(
    async (credentials: SignInRequest) => {
      setState(await sessionUseCases.signIn(dependencies, credentials));
    },
    [dependencies],
  );

  const signUp = useCallback(
    async (request: SignUpRequest) => {
      setState(await sessionUseCases.signUp(dependencies, request));
    },
    [dependencies],
  );

  const becomeProvider = useCallback(async () => {
    setState(await sessionUseCases.becomeProvider(dependencies));
  }, [dependencies]);

  const signOut = useCallback(async () => {
    setState(await sessionUseCases.signOut(dependencies));
    // La caché se tira ENTERA al salir. Sin esto, el siguiente que inicie sesión en este
    // teléfono ve durante un instante los resultados del anterior.
    queryClient.clear();
  }, [dependencies, queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({ state, signIn, signUp, becomeProvider, signOut }),
    [state, signIn, signUp, becomeProvider, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
