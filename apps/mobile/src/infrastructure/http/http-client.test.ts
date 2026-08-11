import { z } from 'zod';

import { ContractViolationError, HttpError, NetworkError } from '../../domain/errors/app-error';

import { buildUrl, createHttpClient } from './http-client';

const bodySchema = z.object({ id: z.string(), title: z.string() });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function problemResponse(problem: unknown, status: number): Response {
  return new Response(JSON.stringify(problem), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

/** El `fetch` falso, tipado con sus argumentos para poder inspeccionar las cabeceras. */
type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit]>;

function fetchMock(
  implementation: (url: string, init: RequestInit) => Promise<Response>,
): FetchMock {
  return jest.fn(implementation);
}

function authHeaderOf(mock: FetchMock, callIndex: number): string | undefined {
  const headers = mock.mock.calls[callIndex]?.[1].headers as Record<string, string> | undefined;
  return headers?.Authorization;
}

function clientWith(
  fetchImpl: FetchMock,
  overrides: Partial<Parameters<typeof createHttpClient>[0]> = {},
) {
  return createHttpClient({
    baseUrl: 'https://api.test',
    getAccessToken: () => 'token-1',
    refreshAccessToken: async () => null,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...overrides,
  });
}

describe('buildUrl', () => {
  it('drops null and undefined so an unset filter is absent, not "null"', () => {
    const url = buildUrl('https://api.test', '/listings', {
      query: 'fontanero',
      radiusKm: null,
      categoryId: undefined,
      limit: 20,
    });

    expect(url).toBe('https://api.test/listings?query=fontanero&limit=20');
  });

  it('leaves the url alone when there is nothing to append', () => {
    expect(buildUrl('https://api.test', '/me')).toBe('https://api.test/me');
    expect(buildUrl('https://api.test', '/me', {})).toBe('https://api.test/me');
  });
});

describe('createHttpClient', () => {
  it('sends the bearer token', async () => {
    const fetchImpl = fetchMock(async () => jsonResponse({ id: '1', title: 'ok' }));

    await clientWith(fetchImpl).request({ path: '/listings/1' }, bodySchema);

    expect(authHeaderOf(fetchImpl, 0)).toBe('Bearer token-1');
  });

  it('omits the bearer token on the public endpoints', async () => {
    const fetchImpl = fetchMock(async () => jsonResponse({ id: '1', title: 'ok' }));

    await clientWith(fetchImpl).request(
      { path: '/auth/sign-in', method: 'POST', authenticated: false },
      bodySchema,
    );

    expect(authHeaderOf(fetchImpl, 0)).toBeUndefined();
  });

  it('turns a fetch rejection into a NetworkError', async () => {
    const fetchImpl = fetchMock(async () => {
      throw new TypeError('Network request failed');
    });

    await expect(clientWith(fetchImpl).request({ path: '/me' }, bodySchema)).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  /** El `reason` es la clave que la UI traduce; `detail` es prosa y no se enseña. */
  it('reads the reason out of an application/problem+json body', async () => {
    const fetchImpl = fetchMock(async () =>
      problemResponse(
        {
          type: 'https://cerca.app/problems/listing-paused',
          title: 'Listing paused',
          status: 409,
          detail: 'The listing lst_1 was paused by its provider at 12:04',
          reason: 'listing_paused',
        },
        409,
      ),
    );

    const error: unknown = await clientWith(fetchImpl)
      .request({ path: '/listings/1' }, bodySchema)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect(error instanceof HttpError && error.reason).toBe('listing_paused');
    expect(error instanceof HttpError && error.status).toBe(409);
  });

  it('survives an error body that is not problem+json at all', async () => {
    const fetchImpl = fetchMock(
      async () => new Response('<html>502 Bad Gateway</html>', { status: 502 }),
    );

    const error: unknown = await clientWith(fetchImpl)
      .request({ path: '/listings' }, bodySchema)
      .catch((caught: unknown) => caught);

    // Sigue siendo un HttpError con su código; simplemente no hay `reason` que traducir.
    expect(error).toBeInstanceOf(HttpError);
    expect(error instanceof HttpError && error.problem).toBeNull();
  });

  /**
   * El criterio de aceptación: "cambio a mano un campo obligatorio de la respuesta y la app
   * falla en el parse, con un mensaje que dice qué campo".
   */
  it('fails at the boundary naming the missing field', async () => {
    const fetchImpl = fetchMock(async () => jsonResponse({ id: '1' }));

    const error: unknown = await clientWith(fetchImpl)
      .request({ path: '/listings/1' }, bodySchema)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ContractViolationError);
    expect(String(error)).toContain('title');
    expect(String(error)).toContain('/listings/1');
  });

  it('refreshes once on a 401 and replays the request with the new token', async () => {
    const fetchImpl = fetchMock(async () => jsonResponse({ id: '1', title: 'ok' }));
    fetchImpl.mockResolvedValueOnce(new Response('', { status: 401 }));

    const result = await clientWith(fetchImpl, {
      refreshAccessToken: async () => 'token-2',
    }).request({ path: '/me' }, bodySchema);

    expect(result.title).toBe('ok');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(authHeaderOf(fetchImpl, 1)).toBe('Bearer token-2');
  });

  /** Sin este límite, un token que el servidor siempre rechaza es un bucle infinito. */
  it('gives up after one refresh instead of looping', async () => {
    const fetchImpl = fetchMock(async () => new Response('', { status: 401 }));

    await expect(
      clientWith(fetchImpl, { refreshAccessToken: async () => 'token-2' }).request(
        { path: '/me' },
        bodySchema,
      ),
    ).rejects.toBeInstanceOf(HttpError);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not even try to refresh when there is no session to refresh', async () => {
    const fetchImpl = fetchMock(async () => new Response('', { status: 401 }));
    const refreshAccessToken = jest.fn(async () => null);

    await expect(
      clientWith(fetchImpl, { refreshAccessToken }).request({ path: '/me' }, bodySchema),
    ).rejects.toBeInstanceOf(HttpError);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
