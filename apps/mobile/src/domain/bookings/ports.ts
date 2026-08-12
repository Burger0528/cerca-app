import type { Booking, CreateBookingRequest } from '@cerca/contract';

export interface BookingGatewayPort {
  /**
   * La clave de idempotencia la decide quien llama, no el gateway: tiene que sobrevivir a
   * un reintento del mismo intento del usuario, y aquí dentro sería nueva cada vez.
   */
  create(request: CreateBookingRequest, idempotencyKey: string): Promise<Booking>;
}
