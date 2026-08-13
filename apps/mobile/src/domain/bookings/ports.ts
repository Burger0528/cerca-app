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

export type BookingAction = 'accept' | 'decline' | 'complete' | 'cancel';

export interface BookingGatewayPort {
  list(
    role: BookingRole,
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<CursorPage<Booking>>;
  accept(bookingId: string, request: AcceptBookingRequest): Promise<void>;
  decline(bookingId: string, request: DeclineBookingRequest): Promise<void>;
  complete(bookingId: string): Promise<void>;
  cancel(bookingId: string): Promise<void>;
  detail(bookingId: string, signal?: AbortSignal): Promise<Booking>;
  review(bookingId: string, request: WriteReviewRequest, idempotencyKey: string): Promise<Review>;
  /**
   * La clave de idempotencia la decide quien llama, no el gateway: tiene que sobrevivir a
   * un reintento del mismo intento del usuario, y aquí dentro sería nueva cada vez.
   */
  create(request: CreateBookingRequest, idempotencyKey: string): Promise<Booking>;
}
