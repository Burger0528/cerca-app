import type { BookingResponse, CreateBookingInput } from '@cerca/contract';

export interface BookingGatewayPort {
  create(
    request: CreateBookingInput,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<BookingResponse>;
}
