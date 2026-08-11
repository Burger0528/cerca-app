/**
 * Claves de caché, jerárquicas.
 *
 * Jerárquicas quiere decir que cada nivel es prefijo del siguiente:
 *
 *   ['listings']                                  ← todo lo de anuncios
 *   ['listings', 'list']                          ← todas las búsquedas
 *   ['listings', 'list', { filters, origin }]     ← UNA búsqueda
 *   ['listings', 'detail', 'lst_42']              ← un anuncio
 *
 * Eso hace que `invalidateQueries({ queryKey: listingKeys.lists() })` tire TODAS las
 * búsquedas y ninguna ficha, sin listar claves a mano. Con claves planas tipo
 * `['listings-search-fontanero-19.43']` hay que acordarse de cada una, y siempre se olvida
 * alguna.
 *
 * Son funciones y no constantes para que `as const` conserve el tipo literal de la tupla:
 * así TanStack Query sabe la forma exacta de la clave y un typo no compila.
 */
import type { ListingSearchIdentity } from './listing-search';

export const listingKeys = {
  all: ['listings'] as const,

  lists: () => [...listingKeys.all, 'list'] as const,
  list: (identity: ListingSearchIdentity) => [...listingKeys.lists(), identity] as const,

  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (listingId: string) => [...listingKeys.details(), listingId] as const,

  mine: () => [...listingKeys.all, 'mine'] as const,
} as const;

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
} as const;

export const sessionKeys = {
  all: ['session'] as const,
  me: () => [...sessionKeys.all, 'me'] as const,
} as const;
