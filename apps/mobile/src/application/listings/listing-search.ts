import type { ListingSearchFilters } from '@cerca/contract';
import { DEFAULT_PAGE_SIZE } from '@cerca/contract';

import type { Coordinates } from '../../domain/geo/coordinates';
import { snapToGrid } from '../../domain/geo/coordinates';
import type { ListingSearchQuery } from '../../domain/listings/ports';
import type { SearchOrigin } from '../../domain/location/location';
import { coordinatesOf } from '../../domain/location/location';

/**
 * Construye la búsqueda normalizada.
 *
 * El `snapToGrid` se hace AQUÍ y en un solo sitio, a propósito. Si cada llamante snapeara
 * por su cuenta, tarde o temprano alguien construiría la clave de caché con la coordenada
 * redondeada y la petición con la coordenada cruda: dos celdas distintas para lo mismo, la
 * caché nunca acierta y el mapa pide datos en cada frame.
 *
 * Con esto, "moverse unos metros" produce literalmente el mismo objeto, y por tanto la
 * misma clave y la misma petición.
 */
export function buildListingSearchQuery(
  filters: ListingSearchFilters,
  origin: SearchOrigin,
  options: { cursor?: string | null; limit?: number } = {},
): ListingSearchQuery {
  const raw = coordinatesOf(origin);

  return {
    filters,
    origin: raw === null ? null : snapToGrid(raw),
    cursor: options.cursor ?? null,
    limit: options.limit ?? DEFAULT_PAGE_SIZE,
  };
}

/**
 * La parte de la búsqueda que identifica UN conjunto de resultados.
 *
 * El cursor queda fuera a propósito: la página 3 de una búsqueda pertenece a la misma
 * entrada de caché que la página 1. Si el cursor entrara en la clave, cada scroll crearía
 * una entrada nueva y `useInfiniteQuery` no tendría nada que acumular.
 */
export interface ListingSearchIdentity {
  readonly filters: ListingSearchFilters;
  readonly origin: Coordinates | null;
}

export function searchIdentityOf(query: ListingSearchQuery): ListingSearchIdentity {
  return { filters: query.filters, origin: query.origin };
}
