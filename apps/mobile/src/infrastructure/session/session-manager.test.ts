import type { StoredSession } from '../../domain/session/session';

import { createSessionManager } from './session-manager';

const session: StoredSession = {
  actor: {
    id: 'b1d9f0c2-3e4a-4b5c-8d6e-7f8091a2b3c4',
    capacities: ['customer'],
    platformRole: 'user',
  },
  tokens: { accessToken: 'access', refreshToken: 'refresh', expiresAt: 0 },
};

function storageStub(initial: StoredSession | null) {
  let stored = initial;

  return {
    read: jest.fn(async () => stored),
    write: jest.fn(async (next: StoredSession) => {
      stored = next;
    }),
    clear: jest.fn(async () => {
      stored = null;
    }),
  };
}

function managerWith(fetchImpl: jest.Mock, initial: StoredSession | null = session) {
  const storage = storageStub(initial);

  const manager = createSessionManager({
    storage,
    baseUrl: 'https://api.test',
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  return { manager, storage };
}

describe('createSessionManager', () => {
  it('tells its listeners when the refresh token is dead', async () => {
    const { manager, storage } = managerWith(
      jest.fn(async () => new Response('', { status: 401 })),
    );
    const listener = jest.fn();

    manager.onSessionLost(listener);
    const token = await manager.refresh();

    expect(token).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storage.clear).toHaveBeenCalled();
  });

  it('stays quiet when the network is down, because that proves nothing', async () => {
    const { manager, storage } = managerWith(
      jest.fn(async () => {
        throw new Error('sin red');
      }),
    );
    const listener = jest.fn();

    manager.onSessionLost(listener);

    await expect(manager.refresh()).rejects.toThrow();
    expect(listener).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it('stops calling a listener that unsubscribed', async () => {
    const { manager } = managerWith(jest.fn(async () => new Response('', { status: 401 })));
    const listener = jest.fn();

    manager.onSessionLost(listener)();
    await manager.refresh();

    expect(listener).not.toHaveBeenCalled();
  });
});
