import type { Actor } from '../actor/actor.ts';
import { can } from '../actor/permissions.ts';
import type { Booking } from '../booking/booking.ts';

export const REVIEW_BLOCKED_REASONS = [
  'not_your_booking',
  'not_completed',
  'already_reviewed',
  'window_closed',
] as const;

export type ReviewBlockedReason = (typeof REVIEW_BLOCKED_REASONS)[number];

export type ReviewEligibility =
  { readonly ok: true } | { readonly ok: false; readonly reason: ReviewBlockedReason };

export const REVIEW_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Días enteros entre dos instantes. Pura: el reloj no entra aquí. */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * La regla más difícil del producto. No puedes reseñar si:
 *   · no fuiste tú quien contrató      (relación)  → not_your_booking
 *   · la reserva no está completada    (estado)    → not_completed
 *   · ya la reseñaste                  (unicidad)  → already_reviewed
 *   · han pasado más de 30 días        (tiempo)    → window_closed
 *
 * Cuatro condiciones de cuatro tipos distintos, y ningún rol las resuelve.
 *
 * Devuelve un MOTIVO, no un booleano: con `false` la pantalla no podría decir por qué, y
 * acabaría duplicando la comprobación para poder escribir el mensaje. El motivo es además
 * una clave de i18n —`t('review.blocked.' + reason)`— así que el dominio no sabe en qué
 * idioma se enseña.
 *
 * `now` es un PARÁMETRO y no un `new Date()` de dentro: el test de "plazo cerrado" pasa una
 * fecha en vez de simular relojes.
 *
 * Es la misma función que aplica el servidor, con los mismos motivos, y por eso su 403/409
 * se traduce con la misma clave que este bloqueo.
 */
export function canReviewBooking(actor: Actor, booking: Booking, now: Date): ReviewEligibility {
  if (booking.customerId !== actor.id) return { ok: false, reason: 'not_your_booking' };
  if (booking.status.kind !== 'completed') return { ok: false, reason: 'not_completed' };
  if (booking.reviewId !== null) return { ok: false, reason: 'already_reviewed' };

  if (daysBetween(new Date(booking.status.completedAt), now) > REVIEW_WINDOW_DAYS) {
    return { ok: false, reason: 'window_closed' };
  }

  return { ok: true };
}

/**
 * El `reason` que viaja en un `problem+json` es un `string` para el compilador. La lista
 * blanca lo convierte en un motivo conocido sin aserción, y un motivo que no reconozcamos
 * cae en el mensaje genérico en vez de pintarse crudo en pantalla.
 */
export function isReviewBlockedReason(
  value: string | null | undefined,
): value is ReviewBlockedReason {
  return REVIEW_BLOCKED_REASONS.some((reason) => reason === value);
}

export type ModerateReviewBlock =
  | { readonly kind: 'hidden'; readonly reason: 'no_permission' }
  | { readonly kind: 'disabled'; readonly reason: 'is_author' };

export type ModerateReviewEligibility =
  { readonly ok: true } | ({ readonly ok: false } & ModerateReviewBlock);

export const MODERATE_REVIEW_ACTIONS = ['remove', 'keep'] as const;

export type ModerateReviewAction = (typeof MODERATE_REVIEW_ACTIONS)[number];

/**
 * Moderar una reseña pide el permiso de plataforma Y no ser quien la escribió.
 *
 * Sin permiso el control no existe; siendo el autor sí se pinta, deshabilitado, porque ahí
 * hay una regla que merece leerse. El servidor rechaza el segundo caso con
 * `CANNOT_MODERATE_OWN_REVIEW` y `reason: is_author`, la misma palabra que este bloqueo.
 */
export function canModerateReview(
  actor: Actor,
  review: { readonly authorId: string },
): ModerateReviewEligibility {
  if (!can(actor, 'review:moderate')) return { ok: false, kind: 'hidden', reason: 'no_permission' };
  if (review.authorId === actor.id) return { ok: false, kind: 'disabled', reason: 'is_author' };

  return { ok: true };
}
