import { bookingSchema, cursorPageSchema, reviewSchema } from '@cerca/contract';
import type {
  AcceptBookingRequest,
  Booking,
  BookingRole,
  CreateBookingRequest,
  CursorPage,
  DeclineBookingRequest,
  Review,
  WriteReviewRequest,
} from '@cerca/contract';

import type { BookingGatewayPort } from '../../domain/bookings/ports';
import type { HttpClient } from '../http/http-client';

const bookingPageSchema = cursorPageSchema(bookingSchema);

export function createHttpBookingGateway(http: HttpClient): BookingGatewayPort {
  return {
    create(request: CreateBookingRequest, idempotencyKey: string): Promise<Booking> {
      return http.request(
        { path: '/bookings', method: 'POST', body: request, idempotencyKey },
        bookingSchema,
      );
    },

    list(
      role: BookingRole,
      cursor: string | null,
      signal?: AbortSignal,
    ): Promise<CursorPage<Booking>> {
      return http.request(
        { path: '/bookings', query: { role, cursor }, signal },
        bookingPageSchema,
      );
    },

    accept(bookingId: string, request: AcceptBookingRequest): Promise<void> {
      return http.requestVoid({
        path: `/bookings/${bookingId}/accept`,
        method: 'POST',
        body: request,
      });
    },

    decline(bookingId: string, request: DeclineBookingRequest): Promise<void> {
      return http.requestVoid({
        path: `/bookings/${bookingId}/decline`,
        method: 'POST',
        body: request,
      });
    },

    complete(bookingId: string): Promise<void> {
      return http.requestVoid({ path: `/bookings/${bookingId}/complete`, method: 'POST' });
    },

    cancel(bookingId: string): Promise<void> {
      return http.requestVoid({ path: `/bookings/${bookingId}/cancel`, method: 'POST' });
    },

    detail(bookingId: string, signal?: AbortSignal): Promise<Booking> {
      return http.request({ path: `/bookings/${bookingId}`, signal }, bookingSchema);
    },

    review(
      bookingId: string,
      request: WriteReviewRequest,
      idempotencyKey: string,
    ): Promise<Review> {
      return http.request(
        { path: `/bookings/${bookingId}/review`, method: 'POST', body: request, idempotencyKey },
        reviewSchema,
      );
    },
  };
}
