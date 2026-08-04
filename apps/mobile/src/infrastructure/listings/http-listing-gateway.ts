import { categorySchema, cursorPageSchema, listingSchema } from '@cerca/contract';
import type { Category, CursorPage, Listing } from '@cerca/contract';
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
const categoryListSchema = z.array(categorySchema);

export function createHttpListingGateway(http: HttpClient): ListingGatewayPort {
  return {
    async search(query: ListingSearchQuery, signal?: AbortSignal): Promise<CursorPage<Listing>> {
      return http.request(
        { path: '/listings', query: toQueryString(query), signal },
        listingPageSchema,
      );
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
 * Los `null` se van tal cual: `buildUrl` los descarta, así que un filtro sin poner
 * sencillamente no aparece en la URL. `?minRating=null` sería un filtro puesto con un
 * valor absurdo, y el backend tendría que adivinar qué se quiso decir.
 */
function toQueryString(query: ListingSearchQuery): Record<string, QueryValue> {
  return {
    q: query.filters.query.trim() === '' ? null : query.filters.query.trim(),
    categoryId: query.filters.categoryId,
    radiusMeters: query.filters.radiusMeters,
    minRating: query.filters.minRating,
    maxPriceMinor: query.filters.maxPriceMinor,
    latitude: query.origin?.latitude ?? null,
    longitude: query.origin?.longitude ?? null,
    cursor: query.cursor,
    limit: query.limit,
  };
}
