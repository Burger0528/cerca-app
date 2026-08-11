import type { Actor } from '@cerca/contract';

import type { AuthGatewayPort, SessionManagerPort } from '../../domain/session/ports';
import type { StoredSession } from '../../domain/session/session';

import { restoreSession, signOut } from './use-cases';

const actor: Actor = {
  id: 'b1d9f0c2-3e4a-4b5c-8d6e-7f8091a2b3c4',
  capacities: ['customer'],
  platformRole: 'user',
};

const NOW = 1_700_000_000_000;

function sessionExpiringAt(expiresAt: number): StoredSession {
  return {
    actor,
    tokens: { accessToken: 'access', refreshToken: 'refresh', expiresAt },
  };
}

function managerStub(overrides: Partial<SessionManagerPort> = {}): jest.Mocked<SessionManagerPort> {
  return {
    getAccessToken: jest.fn(() => 'access'),
    restore: jest.fn(async () => null),
    refresh: jest.fn(async () => 'renewed'),
    adopt: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
    ...overrides,
  } as jest.Mocked<SessionManagerPort>;
}

function gatewayStub(overrides: Partial<AuthGatewayPort> = {}): jest.Mocked<AuthGatewayPort> {
  return {
    signIn: jest.fn(),
    signUp: jest.fn(),
    me: jest.fn(async () => actor),
    signOut: jest.fn(async () => undefined),
    ...overrides,
  } as jest.Mocked<AuthGatewayPort>;
}

describe('restoreSession', () => {
  it('is signed out when the keychain is empty', async () => {
    const sessionManager = managerStub();

    const state = await restoreSession({
      sessionManager,
      authGateway: gatewayStub(),
      now: () => NOW,
    });

    expect(state).toEqual({ status: 'signed-out' });
  });

  /** El criterio: cierro la app, la reabro y sigo dentro. Sin pasar por login. */
  it('comes back signed in with a valid token, without touching the network', async () => {
    const sessionManager = managerStub({
      restore: jest.fn(async () => sessionExpiringAt(NOW + 3_600_000)),
    });
    const authGateway = gatewayStub();

    const state = await restoreSession({ sessionManager, authGateway, now: () => NOW });

    expect(state).toEqual({ status: 'signed-in', actor });
    // Nada de red en el arranque: reabrir la app sin cobertura no puede echar al usuario.
    expect(authGateway.me).not.toHaveBeenCalled();
    expect(sessionManager.refresh).not.toHaveBeenCalled();
  });

  it('renews an expired token instead of sending the user to login', async () => {
    const sessionManager = managerStub({
      restore: jest.fn(async () => sessionExpiringAt(NOW - 1)),
      refresh: jest.fn(async () => 'renewed'),
    });

    const state = await restoreSession({
      sessionManager,
      authGateway: gatewayStub(),
      now: () => NOW,
    });

    expect(sessionManager.refresh).toHaveBeenCalledTimes(1);
    expect(state).toEqual({ status: 'signed-in', actor });
  });

  /** El colchón evita mandar un token que caduca dentro de dos segundos. */
  it('renews a token that is about to expire, inside the skew window', async () => {
    const sessionManager = managerStub({
      restore: jest.fn(async () => sessionExpiringAt(NOW + 2_000)),
    });

    await restoreSession({ sessionManager, authGateway: gatewayStub(), now: () => NOW });

    expect(sessionManager.refresh).toHaveBeenCalledTimes(1);
  });

  it('signs out and wipes the keychain when the refresh token is dead', async () => {
    const sessionManager = managerStub({
      restore: jest.fn(async () => sessionExpiringAt(NOW - 1)),
      refresh: jest.fn(async () => null),
    });

    const state = await restoreSession({
      sessionManager,
      authGateway: gatewayStub(),
      now: () => NOW,
    });

    expect(state).toEqual({ status: 'signed-out' });
    expect(sessionManager.clear).toHaveBeenCalledTimes(1);
  });
});

describe('signOut', () => {
  /**
   * Si el borrado local dependiera de la red, el usuario pulsa "cerrar sesión" en el metro,
   * no pasa nada visible, deja el teléfono en la mesa y sigue dentro.
   */
  it('clears the local session even when the server never answers', async () => {
    const sessionManager = managerStub({
      restore: jest.fn(async () => sessionExpiringAt(NOW + 3_600_000)),
    });
    const authGateway = gatewayStub({
      signOut: jest.fn(async () => {
        throw new Error('offline');
      }),
    });

    const state = await signOut({ sessionManager, authGateway, now: () => NOW });

    expect(state).toEqual({ status: 'signed-out' });
    expect(sessionManager.clear).toHaveBeenCalledTimes(1);
  });

  it('tells the server to revoke the refresh token when it can', async () => {
    const sessionManager = managerStub({
      restore: jest.fn(async () => sessionExpiringAt(NOW + 3_600_000)),
    });
    const authGateway = gatewayStub();

    await signOut({ sessionManager, authGateway, now: () => NOW });

    expect(authGateway.signOut).toHaveBeenCalledWith('refresh');
  });
});
