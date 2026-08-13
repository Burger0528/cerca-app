import type { Actor } from '../actor/actor';
import type { BookingResponse } from '../booking/booking.schemas';

export type ReviewBlockedReason =
  'not_your_booking' | 'not_completed' | 'already_reviewed' | 'window_closed';

export type ReviewEligibility = { ok: true } | { ok: false; reason: ReviewBlockedReason };

export const REVIEW_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Días completos entre `from` y `to`, redondeando hacia abajo. Pura -- sin reloj adentro. */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * La función estrella. No se puede reseñar una reserva salvo que:
 *   · seas quien la reservó                  (relación)   -> not_your_booking
 *   · la reserva esté completada              (estado)     -> not_completed
 *   · no la hayas reseñado ya                 (unicidad)   -> already_reviewed
 *   · no hayan pasado más de 30 días           (tiempo)     -> window_closed
 *
 * `booking` es el `BookingResponse` PLANO que de verdad manda el backend (ver
 * `booking.presenter.ts` del backend: `status` es un string, no una unión con `kind`).
 * `now` entra como parámetro para poder testear el borde exacto del día 30 sin simular
 * el reloj del sistema.
 */
export function canReviewBooking(
  actor: Actor,
  booking: BookingResponse,
  now: Date,
): ReviewEligibility {
  if (booking.customerId !== actor.id) return { ok: false, reason: 'not_your_booking' };
  if (booking.status !== 'completed' || booking.completedAt === null) {
    return { ok: false, reason: 'not_completed' };
  }
  if (booking.reviewId !== null) return { ok: false, reason: 'already_reviewed' };
  if (daysBetween(new Date(booking.completedAt), now) > REVIEW_WINDOW_DAYS) {
    return { ok: false, reason: 'window_closed' };
  }
  return { ok: true };
}
