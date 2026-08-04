import { ContractViolationError, HttpError, NetworkError } from '../../domain/errors/app-error';

import { createQueryClient } from './query-client';

/** Saca la política de retry que se le ha puesto al cliente, para poder ejercitarla. */
function retryPolicy() {
  const policy = createQueryClient().getDefaultOptions().queries?.retry;
  if (typeof policy !== 'function') throw new Error('la política de retry debe ser una función');
  return policy;
}

const problem = (status: number) => new HttpError(status, null, '/listings');

describe('política de retry', () => {
  /** El criterio de aceptación: un 403 no se reintenta tres veces. */
  it.each([401, 403])('does not retry a %s', (status) => {
    expect(retryPolicy()(0, problem(status))).toBe(false);
  });

  it('does not retry a 4xx either: the server already answered', () => {
    expect(retryPolicy()(0, problem(404))).toBe(false);
    expect(retryPolicy()(0, problem(422))).toBe(false);
  });

  it('retries a network failure, which is exactly what can succeed next time', () => {
    expect(retryPolicy()(0, new NetworkError())).toBe(true);
  });

  it('retries a 5xx', () => {
    expect(retryPolicy()(0, problem(503))).toBe(true);
  });

  it('stops after two retries so it does not hammer a server that is down', () => {
    expect(retryPolicy()(1, new NetworkError())).toBe(true);
    expect(retryPolicy()(2, new NetworkError())).toBe(false);
  });

  /** Una respuesta que rompe el contrato no mejora sola: es un bug, no un fallo pasajero. */
  it('never retries a contract violation', () => {
    expect(retryPolicy()(0, new ContractViolationError('/listings', ['title: required']))).toBe(
      false,
    );
  });
});

describe('mutaciones', () => {
  it('never retries automatically: two retries could create two bookings', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
