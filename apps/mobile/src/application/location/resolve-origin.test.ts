import type { LocationPort } from '../../domain/location/location';

import { requestDeviceOrigin, resolveDeviceOrigin } from './resolve-origin';

function locationStub(overrides: Partial<LocationPort> = {}): jest.Mocked<LocationPort> {
  return {
    getPermissionStatus: jest.fn(async () => 'granted' as const),
    requestPermission: jest.fn(async () => 'granted' as const),
    isEnabled: jest.fn(async () => true),
    getCurrentCoordinates: jest.fn(async () => ({ latitude: 19.4326, longitude: -99.1332 })),
    openSettings: jest.fn(async () => undefined),
    ...overrides,
  } as jest.Mocked<LocationPort>;
}

describe('resolveDeviceOrigin', () => {
  it('resolves the device origin when everything is in place', async () => {
    const resolution = await resolveDeviceOrigin(locationStub());

    expect(resolution).toEqual({
      kind: 'resolved',
      origin: { kind: 'device', coordinates: { latitude: 19.4326, longitude: -99.1332 } },
    });
  });

  /**
   * Lo importante de este test es lo que NO pasa: el diálogo del sistema sale una sola vez
   * en la vida de la instalación, y quemarlo en el arranque es cómo se consigue un "no
   * permitir" para siempre.
   */
  it('never asks for the permission on its own', async () => {
    const location = locationStub({
      getPermissionStatus: jest.fn(async () => 'undetermined' as const),
    });

    const resolution = await resolveDeviceOrigin(location);

    expect(location.requestPermission).not.toHaveBeenCalled();
    expect(resolution).toEqual({ kind: 'blocked', reason: 'permission-undetermined' });
  });

  /** US-08: denegar la ubicación NO puede dejar la pantalla en blanco. */
  it('reports a denied permission as its own blocker', async () => {
    const location = locationStub({ getPermissionStatus: jest.fn(async () => 'denied' as const) });

    expect(await resolveDeviceOrigin(location)).toEqual({
      kind: 'blocked',
      reason: 'permission-denied',
    });
    expect(location.getCurrentCoordinates).not.toHaveBeenCalled();
  });

  it('distinguishes a switched-off GPS from a denied permission', async () => {
    const location = locationStub({ isEnabled: jest.fn(async () => false) });

    expect(await resolveDeviceOrigin(location)).toEqual({
      kind: 'blocked',
      reason: 'services-disabled',
    });
  });

  it('distinguishes a failed fix, which is worth retrying, from a refusal, which is not', async () => {
    const location = locationStub({
      getCurrentCoordinates: jest.fn(async () => {
        throw new Error('no fix indoors');
      }),
    });

    expect(await resolveDeviceOrigin(location)).toEqual({
      kind: 'blocked',
      reason: 'position-unavailable',
    });
  });
});

describe('requestDeviceOrigin', () => {
  it('asks, and resolves when the user says yes', async () => {
    // Después de conceder el permiso, el sistema ya responde 'granted' a la consulta que
    // hace `resolveDeviceOrigin` justo detrás.
    const location = locationStub();

    const resolution = await requestDeviceOrigin(location);

    expect(location.requestPermission).toHaveBeenCalledTimes(1);
    expect(resolution).toEqual({
      kind: 'resolved',
      origin: { kind: 'device', coordinates: { latitude: 19.4326, longitude: -99.1332 } },
    });
  });

  it('falls back to the denied blocker when the user says no', async () => {
    const location = locationStub({ requestPermission: jest.fn(async () => 'denied' as const) });

    expect(await requestDeviceOrigin(location)).toEqual({
      kind: 'blocked',
      reason: 'permission-denied',
    });
  });
});
