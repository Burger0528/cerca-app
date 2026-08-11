import {
  ContractViolationError,
  HttpError,
  NetworkError,
  TimeoutError,
} from '../../domain/errors/app-error';

import { messageKeyForError } from './error-message-key';

function httpError(status: number, problem: Record<string, unknown> | null = null): HttpError {
  return new HttpError(
    status,
    problem === null ? null : { type: 'about:blank', title: 'error', status, ...problem },
    'https://api.test/me',
  );
}

describe('messageKeyForError', () => {
  it('maps each transport failure to its own message', () => {
    expect(messageKeyForError(new NetworkError())).toBe('errors.network');
    expect(messageKeyForError(new TimeoutError(8000))).toBe('errors.timeout');
    expect(messageKeyForError(new ContractViolationError('/listings', ['id: required']))).toBe(
      'errors.contract',
    );
  });

  it('reads the business code out of the problem body', () => {
    expect(messageKeyForError(httpError(401, { code: 'INVALID_CREDENTIALS' }))).toBe(
      'auth.errors.invalidCredentials',
    );
  });

  it('calls a 5xx a server problem, whatever the body says', () => {
    expect(messageKeyForError(httpError(503, { code: 'INVALID_CREDENTIALS' }))).toBe(
      'errors.server',
    );
  });

  it('falls back to a generic message for a code it does not know', () => {
    expect(messageKeyForError(httpError(409, { code: 'LISTING_ALREADY_PUBLISHED' }))).toBe(
      'errors.unknown',
    );
    expect(messageKeyForError(httpError(400))).toBe('errors.unknown');
  });

  it('does not crash on something that is not an error at all', () => {
    expect(messageKeyForError('boom')).toBe('errors.unknown');
    expect(messageKeyForError(undefined)).toBe('errors.unknown');
  });
});
