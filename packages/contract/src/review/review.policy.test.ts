import { describe, expect, it } from 'vitest';

import type { Actor } from '../actor/actor.ts';
import type { BookingResponse } from '../booking/booking.schemas.ts';

import { REVIEW_WINDOW_DAYS, canReviewBooking } from './review.policy.ts';

const CUSTOMER_ID = 'e3fc3353-cbbf-41bd-8935-0aa5d2b5725b';
const SOMEONE_ELSE = '11111111-1111-4111-8111-111111111111';

const customer: Actor = { id: CUSTOMER_ID, capacities: ['customer'], platformRole: 'user' };

const NOW = new Date('2026-06-30T12:00:00.000Z');

function completedBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: 'b0000000-0000-4000-8000-000000000000',
    listingId: 'l0000000-0000-4000-8000-000000000000',
    customerId: CUSTOMER_ID,
    status: 'completed',
    requestedAt: '2026-05-01T00:00:00.000Z',
    scheduledFor: '2026-05-15T00:00:00.000Z',
    completedAt: NOW.toISOString(),
    reviewId: null,
    ...overrides,
  };
}

describe('canReviewBooking', () => {
  it('lets the customer review their own completed, unreviewed, recent booking', () => {
    expect(canReviewBooking(customer, completedBooking(), NOW)).toEqual({ ok: true });
  });

  it('blocks someone who is not the customer on this booking', () => {
    const result = canReviewBooking(customer, completedBooking({ customerId: SOMEONE_ELSE }), NOW);
    expect(result).toEqual({ ok: false, reason: 'not_your_booking' });
  });

  it('blocks a booking that is not completed', () => {
    for (const status of ['requested', 'accepted', 'declined', 'cancelled'] as const) {
      const result = canReviewBooking(
        customer,
        completedBooking({ status, completedAt: null }),
        NOW,
      );
      expect(result).toEqual({ ok: false, reason: 'not_completed' });
    }
  });

  it('blocks a booking that has already been reviewed', () => {
    const result = canReviewBooking(
      customer,
      completedBooking({ reviewId: 'r0000000-0000-4000-8000-000000000000' }),
      NOW,
    );
    expect(result).toEqual({ ok: false, reason: 'already_reviewed' });
  });

  it('allows the review on day 30 exactly', () => {
    const completedAt = new Date(NOW);
    completedAt.setUTCDate(completedAt.getUTCDate() - REVIEW_WINDOW_DAYS);

    const result = canReviewBooking(
      customer,
      completedBooking({ completedAt: completedAt.toISOString() }),
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });

  it('blocks the review on day 31', () => {
    const completedAt = new Date(NOW);
    completedAt.setUTCDate(completedAt.getUTCDate() - (REVIEW_WINDOW_DAYS + 1));

    const result = canReviewBooking(
      customer,
      completedBooking({ completedAt: completedAt.toISOString() }),
      NOW,
    );
    expect(result).toEqual({ ok: false, reason: 'window_closed' });
  });
});
