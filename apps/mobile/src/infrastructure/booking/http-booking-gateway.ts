import { bookingResponseSchema } from '@cerca/contract';
import type {
  AcceptBookingInput,
  BookingResponse,
  BookingRoleQuery,
  CreateBookingInput,
  DeclineBookingInput,
} from '@cerca/contract';
import { z } from 'zod';

import type { BookingGatewayPort, BookingListPage } from '../../domain/booking/ports';
import type { HttpClient } from '../http/http-client';

const bookingListSchema = z.object({
  items: z.array(bookingResponseSchema),
  nextCursor: z.string().nullable(),
});

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

    list(query: BookingRoleQuery, signal?: AbortSignal): Promise<BookingListPage> {
      return http.request({ path: '/bookings', query, signal }, bookingListSchema);
    },

    detail(bookingId: string, signal?: AbortSignal): Promise<BookingResponse> {
      return http.request({ path: `/bookings/${bookingId}`, signal }, bookingResponseSchema);
    },

    accept(
      bookingId: string,
      request: AcceptBookingInput,
      signal?: AbortSignal,
    ): Promise<BookingResponse> {
      return http.request(
        { path: `/bookings/${bookingId}/accept`, method: 'POST', body: request, signal },
        bookingResponseSchema,
      );
    },

    decline(
      bookingId: string,
      request: DeclineBookingInput,
      signal?: AbortSignal,
    ): Promise<BookingResponse> {
      return http.request(
        { path: `/bookings/${bookingId}/decline`, method: 'POST', body: request, signal },
        bookingResponseSchema,
      );
    },

    complete(bookingId: string, signal?: AbortSignal): Promise<BookingResponse> {
      return http.request(
        { path: `/bookings/${bookingId}/complete`, method: 'POST', signal },
        bookingResponseSchema,
      );
    },

    cancel(bookingId: string, signal?: AbortSignal): Promise<BookingResponse> {
      return http.request(
        { path: `/bookings/${bookingId}/cancel`, method: 'POST', signal },
        bookingResponseSchema,
      );
    },
  };
}
