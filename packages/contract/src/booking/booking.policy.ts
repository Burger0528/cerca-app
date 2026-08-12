import type { Actor } from '../actor/actor.ts';
import type { ListingStatus } from '../schemas/listing.ts';

import type { Booking } from './booking.ts';

export type RequestBookingReason = 'own_listing' | 'not_bookable';

export type RequestBookingEligibility =
  { readonly ok: true } | { readonly ok: false; readonly reason: RequestBookingReason };

export interface BookableListing {
  readonly ownerId: string;
  readonly status: ListingStatus;
}

/**
 * No puedes reservar tu propio anuncio (relación), y solo se reserva un anuncio publicado
 * (estado). La capacidad `booking:request` es la capa 1 y la resuelve `can()` antes.
 *
 * Los motivos coinciden letra por letra con los de `canRequestBooking` del backend: son la
 * misma clave de i18n en los dos lados.
 */
export function canRequestBooking(
  actor: Actor,
  listing: BookableListing,
): RequestBookingEligibility {
  if (listing.ownerId === actor.id) return { ok: false, reason: 'own_listing' };
  if (listing.status !== 'published') return { ok: false, reason: 'not_bookable' };

  return { ok: true };
}

export type CancelBookingReason = 'not_participant' | 'not_cancellable';

export type CancelBookingEligibility =
  { readonly ok: true } | { readonly ok: false; readonly reason: CancelBookingReason };

/**
 * Cancelan las dos partes —quien reservó y quien publicó— pero solo mientras la reserva
 * sigue pedida o aceptada. Completada, rechazada o cancelada es terminal.
 */
export function canCancelBooking(
  actor: Actor,
  booking: Booking,
  listing: BookableListing,
): CancelBookingEligibility {
  const isParticipant = booking.customerId === actor.id || listing.ownerId === actor.id;
  if (!isParticipant) return { ok: false, reason: 'not_participant' };

  if (booking.status.kind !== 'requested' && booking.status.kind !== 'accepted') {
    return { ok: false, reason: 'not_cancellable' };
  }

  return { ok: true };
}
