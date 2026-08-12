import type { Actor } from '../actor/actor.ts';
import { can } from '../actor/permissions.ts';
import type { ListingStatus } from '../schemas/listing.ts';

/**
 * Las dos formas de bloquear un control, y son distintas a propósito.
 *
 * `hidden` es "no te interesa y no lo vas a conseguir": el anuncio es de otra persona, o la
 * cuenta ni siquiera vende. Enseñar el botón solo confunde.
 *
 * `disabled` es "hoy no se puede": el anuncio está en revisión o retirado. Ahí el botón se
 * queda a la vista y explica la regla, porque desaparecer deja al usuario preguntándose qué
 * hizo mal.
 */
export type ListingEditBlock =
  | { readonly kind: 'hidden'; readonly reason: 'no_capacity' | 'not_owner' }
  | { readonly kind: 'disabled'; readonly reason: 'under_review' | 'removed' };

export type ListingEditEligibility =
  { readonly ok: true } | ({ readonly ok: false } & ListingEditBlock);

/** Lo mínimo que hace falta saber del anuncio. Vale el detalle y vale una fila de la lista. */
export interface EditableListing {
  readonly ownerId: string;
  readonly status: ListingStatus;
}

const EDITABLE_STATUSES: readonly ListingStatus[] = ['draft', 'published', 'paused'];

export function canEditListing(actor: Actor, listing: EditableListing): ListingEditEligibility {
  if (!can(actor, 'listing:update')) return { ok: false, kind: 'hidden', reason: 'no_capacity' };
  if (listing.ownerId !== actor.id) return { ok: false, kind: 'hidden', reason: 'not_owner' };

  if (!EDITABLE_STATUSES.includes(listing.status)) {
    return {
      ok: false,
      kind: 'disabled',
      reason: listing.status === 'under_review' ? 'under_review' : 'removed',
    };
  }

  return { ok: true };
}
