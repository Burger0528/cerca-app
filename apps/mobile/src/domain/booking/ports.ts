import type {
  AcceptBookingInput,
  BookingResponse,
  BookingRoleQuery,
  CreateBookingInput,
  DeclineBookingInput,
} from '@cerca/contract';

export interface BookingListPage {
  readonly items: readonly BookingResponse[];
  readonly nextCursor: string | null;
}

export interface BookingGatewayPort {
  create(
    request: CreateBookingInput,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<BookingResponse>;

  list(query: BookingRoleQuery, signal?: AbortSignal): Promise<BookingListPage>;

  detail(bookingId: string, signal?: AbortSignal): Promise<BookingResponse>;

  accept(
    bookingId: string,
    request: AcceptBookingInput,
    signal?: AbortSignal,
  ): Promise<BookingResponse>;

  decline(
    bookingId: string,
    request: DeclineBookingInput,
    signal?: AbortSignal,
  ): Promise<BookingResponse>;

  complete(bookingId: string, signal?: AbortSignal): Promise<BookingResponse>;

  cancel(bookingId: string, signal?: AbortSignal): Promise<BookingResponse>;
}
