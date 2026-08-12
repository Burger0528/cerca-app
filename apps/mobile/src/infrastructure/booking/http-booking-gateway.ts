import { bookingResponseSchema } from '@cerca/contract';
import type { BookingResponse, CreateBookingInput } from '@cerca/contract';

import type { BookingGatewayPort } from '../../domain/booking/ports';
import type { HttpClient } from '../http/http-client';

export function createHttpBookingGateway(http: HttpClient): BookingGatewayPort {
  return {
    create(
      request: CreateBookingInput,
      idempotencyKey: string,
      signal?: AbortSignal,
    ): Promise<BookingResponse> {
      return http.request(
        { path: '/bookings', method: 'POST', body: request, idempotencyKey, signal },
        bookingResponseSchema,
      );
    },
  };
}
