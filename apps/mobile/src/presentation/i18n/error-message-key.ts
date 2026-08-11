import {
  ContractViolationError,
  HttpError,
  NetworkError,
  TimeoutError,
} from '../../domain/errors/app-error';

import type { FeedbackMessageKey } from './message-keys';
import { messageKeyForReason } from './message-keys';

export function messageKeyForError(error: unknown): FeedbackMessageKey {
  if (error instanceof NetworkError) return 'errors.network';
  if (error instanceof TimeoutError) return 'errors.timeout';
  if (error instanceof ContractViolationError) return 'errors.contract';
  if (error instanceof HttpError) return messageKeyForHttpError(error);

  return 'errors.unknown';
}

function messageKeyForHttpError(error: HttpError): FeedbackMessageKey {
  if (error.status >= 500) return 'errors.server';

  return messageKeyForReason(error.reason);
}
