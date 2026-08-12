import {
  categorySchema,
  cursorPageSchema,
  listingDetailSchema,
  listingSchema,
  myListingSchema,
} from '@cerca/contract';
import type {
  Category,
  CreateListingRequest,
  CursorPage,
  Listing,
  ListingDetail,
  ListingStatusAction,
  MyListing,
} from '@cerca/contract';
import { z } from 'zod';

import type {
  CategoryGatewayPort,
  ListingGatewayPort,
  ListingSearchQuery,
} from '../../domain/listings/ports';
import type { HttpClient, QueryValue } from '../http/http-client';

/**
 * Los schemas se construyen UNA vez, al cargar el módulo, no dentro de la función.
 *
 * `cursorPageSchema(listingSchema)` compila un validador; hacerlo en cada scroll significa
 * recompilarlo cientos de veces mientras la lista corre, que es justo cuando no sobra CPU.
 */
const listingPageSchema = cursorPageSchema(listingSchema);
const myListingPageSchema = cursorPageSchema(myListingSchema);
const categoryListSchema = z.array(categorySchema);

export function createHttpListingGateway(http: HttpClient): ListingGatewayPort {
  return {
    async search(query: ListingSearchQuery, signal?: AbortSignal): Promise<CursorPage<Listing>> {
      return http.request(
        { path: '/listings', query: toQueryString(query), signal },
        listingPageSchema,
      );
    },

    listMine(cursor: string | null, signal?: AbortSignal): Promise<CursorPage<MyListing>> {
      return http.request({ path: '/me/listings', query: { cursor }, signal }, myListingPageSchema);
    },

    create(request: CreateListingRequest): Promise<ListingDetail> {
      return http.request(
        { path: '/listings', method: 'POST', body: request },
        listingDetailSchema,
      );
    },

    setStatus(listingId: string, action: ListingStatusAction): Promise<void> {
      return http.requestVoid({ path: `/listings/${listingId}/${action}`, method: 'POST' });
    },
  };
}

export function createHttpCategoryGateway(http: HttpClient): CategoryGatewayPort {
  return {
    list(signal?: AbortSignal): Promise<Category[]> {
      return http.request({ path: '/categories', signal }, categoryListSchema);
    },
  };
}

/**
 * Aplana la búsqueda a query string.
 *
 * Los nombres son los de `searchListingsQuerySchema` del backend, que además es `.strict()`:
 * un parámetro que no reconozca no se ignora, devuelve un 400. Por eso aquí no hay ni uno
 * de más.
 *
 * Los `null` se van tal cual: `buildUrl` los descarta, así que un filtro sin poner
 * sencillamente no aparece en la URL y el servidor aplica su valor por defecto.
 * `?radiusKm=null` sería un filtro puesto con un valor absurdo.
 */
function toQueryString(query: ListingSearchQuery): Record<string, QueryValue> {
  return {
    query: query.filters.query.trim() === '' ? null : query.filters.query.trim(),
    categoryId: query.filters.categoryId,
    radiusKm: query.filters.radiusKm,
    lat: query.origin?.latitude ?? null,
    lng: query.origin?.longitude ?? null,
    cursor: query.cursor,
    limit: query.limit,
  };
}
