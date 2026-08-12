import { z } from 'zod';

export const BOOKING_STATUSES = [
  'requested',
  'accepted',
  'declined',
  'completed',
  'cancelled',
] as const;

export type BookingStatusKind = (typeof BOOKING_STATUSES)[number];

/**
 * El estado de una reserva, como unión discriminada.
 *
 * El servidor manda una fila PLANA —`status` más `requestedAt`, `scheduledFor` y
 * `completedAt` anulables— donde caben estados imposibles: una reserva "completada" sin
 * fecha de finalización compila igual. Aquí se deshace ese aplanado, y a partir de este
 * punto la app no puede representar ese estado.
 *
 * Lo que el servidor NO manda no se inventa: no hay `acceptedAt`, ni el motivo del
 * rechazo, ni quién canceló. Ver `docs/contract-delta.md`.
 */
export type BookingStatus =
  | { readonly kind: 'requested'; readonly requestedAt: string }
  | { readonly kind: 'accepted'; readonly scheduledFor: string }
  | { readonly kind: 'declined' }
  | { readonly kind: 'completed'; readonly completedAt: string }
  | { readonly kind: 'cancelled' };

export interface Booking {
  readonly id: string;
  readonly listingId: string;
  readonly customerId: string;
  readonly status: BookingStatus;
  readonly reviewId: string | null;
  readonly requestedAt: string;
}

/** Lo que viaja por la red, campo por campo. Espejo de `bookingResponseSchema`. */
const bookingWireSchema = z.object({
  id: z.uuid(),
  listingId: z.uuid(),
  customerId: z.uuid(),
  status: z.enum(BOOKING_STATUSES),
  requestedAt: z.iso.datetime(),
  scheduledFor: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  reviewId: z.uuid().nullable(),
});

type BookingWire = z.infer<typeof bookingWireSchema>;

/**
 * Una reserva aceptada sin `scheduledFor`, o completada sin `completedAt`, es una
 * respuesta que incumple el contrato: revienta aquí, en el límite, y no tres pantallas
 * después al leer una fecha que no existe.
 */
function statusOf(wire: BookingWire, ctx: z.RefinementCtx): BookingStatus | null {
  switch (wire.status) {
    case 'requested':
      return { kind: 'requested', requestedAt: wire.requestedAt };

    case 'accepted':
      if (wire.scheduledFor === null) {
        ctx.addIssue({ code: 'custom', path: ['scheduledFor'], message: 'accepted sin fecha' });
        return null;
      }
      return { kind: 'accepted', scheduledFor: wire.scheduledFor };

    case 'completed':
      if (wire.completedAt === null) {
        ctx.addIssue({ code: 'custom', path: ['completedAt'], message: 'completed sin fecha' });
        return null;
      }
      return { kind: 'completed', completedAt: wire.completedAt };

    case 'declined':
      return { kind: 'declined' };

    case 'cancelled':
      return { kind: 'cancelled' };
  }
}

export const bookingSchema = bookingWireSchema.transform((wire, ctx): Booking => {
  const status = statusOf(wire, ctx);
  if (status === null) return z.NEVER;

  return {
    id: wire.id,
    listingId: wire.listingId,
    customerId: wire.customerId,
    status,
    reviewId: wire.reviewId,
    requestedAt: wire.requestedAt,
  };
});

export const createBookingSchema = z
  .object({
    listingId: z.uuid(),
    note: z.string().max(500).optional(),
  })
  .strict();

export type CreateBookingRequest = z.infer<typeof createBookingSchema>;

export const BOOKING_ROLES = ['customer', 'provider'] as const;

export type BookingRole = (typeof BOOKING_ROLES)[number];

export const DECLINE_REASONS = ['unavailable', 'not_a_fit', 'other'] as const;

export type DeclineReason = (typeof DECLINE_REASONS)[number];

export const acceptBookingSchema = z.object({ scheduledFor: z.iso.datetime() }).strict();

export type AcceptBookingRequest = z.infer<typeof acceptBookingSchema>;

export const declineBookingSchema = z.object({ reason: z.enum(DECLINE_REASONS) }).strict();

export type DeclineBookingRequest = z.infer<typeof declineBookingSchema>;
