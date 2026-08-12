import { z } from 'zod';

export const bookingStatusSchema = z.enum([
  'requested',
  'accepted',
  'declined',
  'completed',
  'cancelled',
]);

export const createBookingSchema = z
  .object({
    listingId: z.uuid(),
    note: z.string().max(500).optional(),
  })
  .strict();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const bookingResponseSchema = z.object({
  id: z.uuid(),
  listingId: z.uuid(),
  customerId: z.uuid(),
  status: bookingStatusSchema,
  requestedAt: z.iso.datetime(),
  scheduledFor: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  reviewId: z.uuid().nullable(),
});

export type BookingResponse = z.infer<typeof bookingResponseSchema>;
