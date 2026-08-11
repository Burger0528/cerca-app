import { actorSchema, authResultSchema } from '@cerca/contract';
import type { Actor, AuthResult, SignInRequest, SignUpRequest } from '@cerca/contract';

import type { AuthGatewayPort } from '../../domain/session/ports';
import type { StoredSession } from '../../domain/session/session';
import { expiresAtFrom } from '../../domain/session/session';
import type { HttpClient } from '../http/http-client';

export interface AuthGatewayDependencies {
  readonly http: HttpClient;
  readonly now?: () => number;
}

export function createHttpAuthGateway(deps: AuthGatewayDependencies): AuthGatewayPort {
  const now = deps.now ?? Date.now;

  /**
   * La respuesta del servidor es PLANA y no dice cuándo caduca el token; la app necesita un
   * `expiresAt` para renovar antes de que reviente. El instante sale del claim `exp` del
   * propio access token, y la conversión se hace aquí, en el borde.
   */
  function toStoredSession(result: AuthResult): StoredSession {
    return {
      actor: result.actor,
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: expiresAtFrom(result.accessToken, now()),
      },
    };
  }

  return {
    async signIn(credentials: SignInRequest): Promise<StoredSession> {
      const result = await deps.http.request(
        { path: '/auth/sign-in', method: 'POST', body: credentials, authenticated: false },
        authResultSchema,
      );
      return toStoredSession(result);
    },

    async signUp(request: SignUpRequest): Promise<StoredSession> {
      const result = await deps.http.request(
        { path: '/auth/sign-up', method: 'POST', body: request, authenticated: false },
        authResultSchema,
      );
      return toStoredSession(result);
    },

    me(signal?: AbortSignal): Promise<Actor> {
      return deps.http.request({ path: '/me', signal }, actorSchema);
    },

    async signOut(refreshToken: string): Promise<void> {
      await deps.http.requestVoid({
        path: '/auth/sign-out',
        method: 'POST',
        body: { refreshToken },
      });
    },
  };
}
