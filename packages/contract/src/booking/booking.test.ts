import { describe, expect, it } from 'vitest';

import type { Actor } from '../actor/actor.ts';

import { canRequestBooking } from './booking.policy.ts';
import { bookingSchema } from './booking.ts';

const CUSTOMER = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';

const wire = {
  id: '33333333-3333-4333-8333-333333333333',
  listingId: '44444444-4444-4444-8444-444444444444',
  customerId: CUSTOMER,
  status: 'requested' as const,
  requestedAt: '2026-08-01T10:00:00.000Z',
  scheduledFor: null,
  completedAt: null,
  reviewId: null,
};

describe('bookingSchema', () => {
  it('turns the flat row into a status that carries its own date', () => {
    const booking = bookingSchema.parse({
      ...wire,
      status: 'completed',
      completedAt: '2026-08-05T10:00:00.000Z',
    });

    expect(booking.status).toEqual({
      kind: 'completed',
      completedAt: '2026-08-05T10:00:00.000Z',
    });
  });

  it('keeps the appointment on an accepted booking', () => {
    const booking = bookingSchema.parse({
      ...wire,
      status: 'accepted',
      scheduledFor: '2026-08-09T15:00:00.000Z',
    });

    expect(booking.status).toEqual({ kind: 'accepted', scheduledFor: '2026-08-09T15:00:00.000Z' });
  });

  /** El estado imposible que la unión existe para prohibir. */
  it('refuses a completed booking with no completion date', () => {
    const result = bookingSchema.safeParse({ ...wire, status: 'completed', completedAt: null });

    expect(result.success).toBe(false);
  });

  it('refuses an accepted booking with no appointment', () => {
    expect(bookingSchema.safeParse({ ...wire, status: 'accepted' }).success).toBe(false);
  });
});

describe('canRequestBooking', () => {
  const actor: Actor = { id: CUSTOMER, capacities: ['customer'], platformRole: 'user' };

  it('lets a customer book someone else’s published listing', () => {
    expect(canRequestBooking(actor, { ownerId: OWNER, status: 'published' })).toEqual({ ok: true });
  });

  it('refuses your own listing before looking at its status', () => {
    expect(canRequestBooking(actor, { ownerId: CUSTOMER, status: 'paused' })).toEqual({
      ok: false,
      reason: 'own_listing',
    });
  });

  it('refuses a listing that is not published', () => {
    for (const status of ['draft', 'paused', 'under_review', 'removed'] as const) {
      expect(canRequestBooking(actor, { ownerId: OWNER, status })).toEqual({
        ok: false,
        reason: 'not_bookable',
      });
    }
  });
});
