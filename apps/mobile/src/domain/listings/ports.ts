import type {
  Category,
  CursorPage,
  Listing,
  ListingSearchFilters,
  ListingStatusAction,
  MyListing,
} from '@cerca/contract';

import type { Coordinates } from '../geo/coordinates';

/**
 * Una búsqueda, ya normalizada. El `origin` viene YA encajado en la rejilla
 * (`snapToGrid`): quien construye esto decide la celda, el gateway solo la manda.
 */
export interface ListingSearchQuery {
  readonly filters: ListingSearchFilters;
  readonly origin: Coordinates | null;
  readonly cursor: string | null;
  readonly limit: number;
}

export interface ListingGatewayPort {
  search(query: ListingSearchQuery, signal?: AbortSignal): Promise<CursorPage<Listing>>;
  listMine(cursor: string | null, signal?: AbortSignal): Promise<CursorPage<MyListing>>;
  setStatus(listingId: string, action: ListingStatusAction): Promise<void>;
}

export interface CategoryGatewayPort {
  list(signal?: AbortSignal): Promise<Category[]>;
}
