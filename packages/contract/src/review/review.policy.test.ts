import { describe, expect, it } from 'vitest';

import type { Actor } from '../actor/actor.ts';
import type { Booking } from '../booking/booking.ts';

import {
  REVIEW_WINDOW_DAYS,
  canModerateReview,
  canReviewBooking,
  isReviewBlockedReason,
} from './review.policy.ts';

const CUSTOMER = '11111111-1111-4111-8111-111111111111';
const SOMEONE_ELSE = '22222222-2222-4222-8222-222222222222';

const actor: Actor = { id: CUSTOMER, capacities: ['customer'], platformRole: 'user' };

const COMPLETED_AT = '2026-08-01T10:00:00.000Z';

function bookingWith(overrides: Partial<Booking> = {}): Booking {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    listingId: '44444444-4444-4444-8444-444444444444',
    customerId: CUSTOMER,
    status: { kind: 'completed', completedAt: COMPLETED_AT },
    reviewId: null,
    requestedAt: '2026-07-30T10:00:00.000Z',
    ...overrides,
  };
}

/** Días enteros después de completarse, sin tocar el reloj del sistema. */
function daysAfterCompletion(days: number): Date {
  return new Date(new Date(COMPLETED_AT).getTime() + days * 24 * 60 * 60 * 1000);
}

describe('canReviewBooking', () => {
  it('lets the customer review a completed booking inside the window', () => {
    expect(canReviewBooking(actor, bookingWith(), daysAfterCompletion(1))).toEqual({ ok: true });
  });

  it('refuses a booking that is not yours', () => {
    expect(
      canReviewBooking(actor, bookingWith({ customerId: SOMEONE_ELSE }), daysAfterCompletion(1)),
    ).toEqual({ ok: false, reason: 'not_your_booking' });
  });

  it('refuses a booking that is not completed', () => {
    expect(
      canReviewBooking(
        actor,
        bookingWith({ status: { kind: 'accepted', scheduledFor: COMPLETED_AT } }),
        daysAfterCompletion(1),
      ),
    ).toEqual({ ok: false, reason: 'not_completed' });
  });

  it('refuses a booking that already has a review', () => {
    expect(
      canReviewBooking(
        actor,
        bookingWith({ reviewId: '55555555-5555-4555-8555-555555555555' }),
        daysAfterCompletion(1),
      ),
    ).toEqual({ ok: false, reason: 'already_reviewed' });
  });

  /** El borde exacto: el día 30 todavía cuenta, el 31 ya no. */
  it('closes the window strictly after thirty days', () => {
    expect(canReviewBooking(actor, bookingWith(), daysAfterCompletion(REVIEW_WINDOW_DAYS))).toEqual(
      {
        ok: true,
      },
    );

    expect(
      canReviewBooking(actor, bookingWith(), daysAfterCompletion(REVIEW_WINDOW_DAYS + 1)),
    ).toEqual({ ok: false, reason: 'window_closed' });
  });

  /** Relación antes que estado: a quien no es dueño de la reserva no se le cuenta la regla. */
  it('checks whose booking it is before anything else', () => {
    expect(
      canReviewBooking(
        actor,
        bookingWith({ customerId: SOMEONE_ELSE, status: { kind: 'declined' } }),
        daysAfterCompletion(90),
      ),
    ).toEqual({ ok: false, reason: 'not_your_booking' });
  });
});

describe('canModerateReview', () => {
  const moderator: Actor = {
    id: SOMEONE_ELSE,
    capacities: ['customer'],
    platformRole: 'moderator',
  };

  it('hides the control from an account without the platform role', () => {
    expect(canModerateReview(actor, { authorId: SOMEONE_ELSE })).toEqual({
      ok: false,
      kind: 'hidden',
      reason: 'no_permission',
    });
  });

  it('lets a moderator act on someone else’s review', () => {
    expect(canModerateReview(moderator, { authorId: CUSTOMER })).toEqual({ ok: true });
  });

  /** Un moderador también escribe reseñas, y no puede moderar la suya. */
  it('disables it, with a reason, on the moderator’s own review', () => {
    expect(canModerateReview(moderator, { authorId: SOMEONE_ELSE })).toEqual({
      ok: false,
      kind: 'disabled',
      reason: 'is_author',
    });
  });
});

describe('isReviewBlockedReason', () => {
  it('recognises the reasons the server sends', () => {
    expect(isReviewBlockedReason('already_reviewed')).toBe(true);
    expect(isReviewBlockedReason('window_closed')).toBe(true);
  });

  it('rejects anything else, so nothing raw reaches the screen', () => {
    expect(isReviewBlockedReason('REVIEW_BLOCKED')).toBe(false);
    expect(isReviewBlockedReason(null)).toBe(false);
  });
});
