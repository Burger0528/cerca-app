import { bookingSchema } from '@cerca/contract';
import type { Booking, CreateBookingRequest } from '@cerca/contract';

import type { BookingGatewayPort } from '../../domain/bookings/ports';
import type { HttpClient } from '../http/http-client';

export function createHttpBookingGateway(http: HttpClient): BookingGatewayPort {
  return {
    create(request: CreateBookingRequest, idempotencyKey: string): Promise<Booking> {
      return http.request(
        { path: '/bookings', method: 'POST', body: request, idempotencyKey },
        bookingSchema,
      );
    },
  };
}
