import type {
  Category,
  CreateListingRequest,
  CursorPage,
  Listing,
  ListingDetail,
  ListingSearchFilters,
  ListingStatusAction,
  MyListing,
  Review,
  UpdateListingRequest,
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
  create(request: CreateListingRequest): Promise<ListingDetail>;
  detail(listingId: string, signal?: AbortSignal): Promise<ListingDetail>;
  listReviews(
    listingId: string,
    cursor: string | null,
    signal?: AbortSignal,
  ): Promise<CursorPage<Review>>;
  update(listingId: string, request: UpdateListingRequest): Promise<ListingDetail>;
  setStatus(listingId: string, action: ListingStatusAction): Promise<void>;
}

export interface CategoryGatewayPort {
  list(signal?: AbortSignal): Promise<Category[]>;
}
