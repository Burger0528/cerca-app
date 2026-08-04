import { authSessionSchema, actorSchema } from '@cerca/contract';
import type { Actor, SignInRequest, SignUpRequest } from '@cerca/contract';

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
   * El servidor manda `expiresIn` (cuántos segundos DURA); la app necesita `expiresAt`
   * (CUÁNDO caduca). La conversión se hace aquí, en el borde, con el reloj de este momento.
   * Hacerla más tarde metería en la cuenta todo lo que haya tardado el resto de la app.
   */
  function toStoredSession(session: {
    actor: Actor;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }): StoredSession {
    return {
      actor: session.actor,
      tokens: {
        accessToken: session.tokens.accessToken,
        refreshToken: session.tokens.refreshToken,
        expiresAt: expiresAtFrom(session.tokens.expiresIn, now()),
      },
    };
  }

  return {
    async signIn(credentials: SignInRequest): Promise<StoredSession> {
      const session = await deps.http.request(
        { path: '/auth/sign-in', method: 'POST', body: credentials, authenticated: false },
        authSessionSchema,
      );
      return toStoredSession(session);
    },

    async signUp(request: SignUpRequest): Promise<StoredSession> {
      const session = await deps.http.request(
        { path: '/auth/sign-up', method: 'POST', body: request, authenticated: false },
        authSessionSchema,
      );
      return toStoredSession(session);
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
