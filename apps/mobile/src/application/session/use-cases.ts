/**
 * Casos de uso de sesión. Funciones puras salvo por los puertos que reciben: no saben si
 * detrás hay Keychain o un Map, ni si el actor viene de HTTP o de un fixture.
 */
import type { SignInRequest, SignUpRequest } from '@cerca/contract';

import type { AuthGatewayPort, SessionManagerPort } from '../../domain/session/ports';
import type { SessionState } from '../../domain/session/session';
import { SIGNED_OUT, isExpired, signedIn } from '../../domain/session/session';

export interface SessionDependencies {
  readonly sessionManager: SessionManagerPort;
  readonly authGateway: AuthGatewayPort;
  /** Inyectado para poder viajar en el tiempo en los tests sin tocar el reloj del sistema. */
  readonly now: () => number;
}

/**
 * Lo que corre al arrancar la app, antes de decidir qué grupo de rutas se pinta.
 *
 * Devuelve el estado final, nunca `restoring`: cuando esta promesa resuelve ya se sabe si
 * hay sesión, y solo entonces se esconde el splash.
 */
export async function restoreSession(deps: SessionDependencies): Promise<SessionState> {
  const stored = await deps.sessionManager.restore();
  if (stored === null) return SIGNED_OUT;

  // Token caducado no es lo mismo que sesión muerta: primero se intenta renovar.
  if (isExpired(stored.tokens, deps.now())) {
    const renewed = await deps.sessionManager.refresh();
    if (renewed === null) {
      await deps.sessionManager.clear();
      return SIGNED_OUT;
    }
  }

  // Se vuelve con el actor del llavero, sin esperar a la red. Revalidar contra `GET /me`
  // es cosa del provider, en segundo plano, y sin bloquear el arranque.
  return signedIn(stored.actor);
}

export async function signIn(
  deps: SessionDependencies,
  credentials: SignInRequest,
): Promise<SessionState> {
  const session = await deps.authGateway.signIn(credentials);
  await deps.sessionManager.adopt(session);
  return signedIn(session.actor);
}

export async function signUp(
  deps: SessionDependencies,
  request: SignUpRequest,
): Promise<SessionState> {
  const session = await deps.authGateway.signUp(request);
  await deps.sessionManager.adopt(session);
  return signedIn(session.actor);
}

export async function becomeProvider(deps: SessionDependencies): Promise<SessionState> {
  const actor = await deps.authGateway.becomeProvider();
  const stored = await deps.sessionManager.restore();

  if (stored !== null) await deps.sessionManager.adopt({ ...stored, actor });

  return signedIn(actor);
}

/**
 * Cerrar sesión SIEMPRE deja al usuario fuera, aunque el servidor no conteste.
 *
 * Si el `POST /auth/sign-out` falla y por eso no se borra el llavero, el usuario le da a
 * "cerrar sesión", ve que no pasa nada, deja el teléfono encima de la mesa y sigue dentro.
 * El token remoto se caducará solo; el local se va ahora.
 */
export async function signOut(deps: SessionDependencies): Promise<SessionState> {
  const stored = await deps.sessionManager.restore();

  try {
    if (stored !== null) {
      await deps.authGateway.signOut(stored.tokens.refreshToken);
    }
  } catch {
    // Intencionadamente tragado: el borrado local no depende de la red.
  } finally {
    await deps.sessionManager.clear();
  }

  return SIGNED_OUT;
}
