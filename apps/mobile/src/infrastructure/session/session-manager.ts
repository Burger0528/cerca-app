/**
 * El dueño de los tokens: memoria, disco y renovación, en un solo sitio.
 *
 * Que sea uno solo no es estética. Con dos dueños (uno que refresca en el interceptor y
 * otro que refresca al arrancar) llega el día en que los dos renuevan a la vez, el segundo
 * refresh invalida el token del primero, y el usuario se ve echado a login sin haber tocado
 * nada. Con un solo dueño y single-flight eso no puede pasar.
 */
import { authResultSchema } from '@cerca/contract';

import { HttpError, NetworkError } from '../../domain/errors/app-error';
import type { SessionManagerPort, SessionStoragePort } from '../../domain/session/ports';
import type { StoredSession } from '../../domain/session/session';
import { expiresAtFrom } from '../../domain/session/session';
import { API_BASE_URL } from '../http/api-config';

export interface SessionManagerDependencies {
  readonly storage: SessionStoragePort;
  readonly baseUrl?: string;
  readonly now?: () => number;
  readonly fetchImpl?: typeof fetch;
  /** Se llama cuando el refresh token muere. La app tiene que echar al usuario. */
  readonly onSessionLost?: () => void;
}

export function createSessionManager(deps: SessionManagerDependencies): SessionManagerPort {
  const baseUrl = deps.baseUrl ?? API_BASE_URL;
  const now = deps.now ?? Date.now;
  const doFetch = deps.fetchImpl ?? fetch;

  /** Copia viva. Se lee en cada petición, así que no puede ir a disco cada vez. */
  let current: StoredSession | null = null;

  /** El single-flight: mientras esta promesa exista, nadie más lanza un refresh. */
  let inFlight: Promise<string | null> | null = null;

  async function performRefresh(refreshToken: string): Promise<string | null> {
    let response: Response;
    try {
      // `fetch` pelado y no el HttpClient: esta petición no lleva `Authorization`, y
      // hacerla pasar por el cliente crearía un ciclo (cliente → refresh → cliente).
      response = await doFetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      // Sin red no se puede afirmar que la sesión esté muerta. Se propaga el error de red
      // para que la UI enseñe "sin conexión" en vez de mandar al usuario a login.
      throw new NetworkError(error);
    }

    if (response.status === 401 || response.status === 403) {
      // Esto SÍ es la sesión muerta: el servidor rechaza el refresh token.
      return null;
    }
    if (!response.ok) {
      throw new HttpError(response.status, null, `${baseUrl}/auth/refresh`);
    }

    const parsed = authResultSchema.safeParse(await response.json());
    if (!parsed.success) return null;

    // El actor no cambia al renovar: se conserva el que ya había. Si no hay ninguno, esto
    // no es una sesión que se pueda renovar, es una sesión que no existe.
    const actor = current?.actor ?? (await deps.storage.read())?.actor;
    if (actor === undefined) return null;

    const renewed: StoredSession = {
      tokens: {
        accessToken: parsed.data.accessToken,
        refreshToken: parsed.data.refreshToken,
        expiresAt: expiresAtFrom(parsed.data.accessToken, now()),
      },
      actor,
    };

    current = renewed;
    await deps.storage.write(renewed);
    return renewed.tokens.accessToken;
  }

  return {
    getAccessToken(): string | null {
      return current?.tokens.accessToken ?? null;
    },

    async restore(): Promise<StoredSession | null> {
      current = await deps.storage.read();
      return current;
    },

    async refresh(): Promise<string | null> {
      if (inFlight !== null) return inFlight;

      const refreshToken =
        current?.tokens.refreshToken ?? (await deps.storage.read())?.tokens.refreshToken;
      if (refreshToken === undefined) return null;

      inFlight = performRefresh(refreshToken)
        .then(async (token) => {
          if (token === null) {
            await deps.storage.clear();
            current = null;
            deps.onSessionLost?.();
          }
          return token;
        })
        .finally(() => {
          inFlight = null;
        });

      return inFlight;
    },

    async adopt(session: StoredSession): Promise<void> {
      current = session;
      await deps.storage.write(session);
    },

    async clear(): Promise<void> {
      current = null;
      await deps.storage.clear();
    },
  };
}
