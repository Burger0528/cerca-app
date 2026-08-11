/**
 * OWNER: Salvador.
 *
 * Espejo de `listing.schemas.ts` del backend. Es lo que el gateway le pasa a `parse()` en
 * el límite: si el backend cambia una forma, el `parse` revienta aquí con el nombre del
 * campo, y no tres pantallas después con un `undefined is not an object`.
 */
import { z } from 'zod';

import { moneySchema, pricingSchema } from '../money/money.ts';

/**
 * CINCO estados, los mismos que el backend.
 *
 * `draft` y `under_review` no se enseñan hoy en la búsqueda, pero están en el enum del
 * servidor: dejarlos fuera haría que el `parse` tumbara la lista entera el día que uno se
 * cuele, en vez de pintar una tarjeta con un badge que nadie esperaba.
 */
export const LISTING_STATUSES = [
  'draft',
  'published',
  'paused',
  'under_review',
  'removed',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const listingStatusSchema = z.enum(LISTING_STATUSES);

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type GeoPoint = z.infer<typeof geoPointSchema>;

/**
 * Un resultado de búsqueda: `listingSearchItemSchema` del backend, campo por campo.
 *
 * Lo que NO trae, y conviene tener presente al maquetar: ni fotos, ni proveedor, ni el
 * modelo de precio. Solo `priceFrom`, que es el precio desde el que arranca el anuncio.
 */
export const listingSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  categoryId: z.uuid(),
  /** `null` en un anuncio a presupuesto sin suelo: no hay precio que ordenar ni enseñar. */
  priceFrom: moneySchema.nullable(),
  status: listingStatusSchema,
  ratingAvg: z.number(),
  ratingCount: z.int(),
  /** Metros desde el origen de la búsqueda. Lo calcula PostGIS, que es quien lo sabe. */
  distanceMeters: z.number(),
});

export type Listing = z.infer<typeof listingSchema>;

/** El detalle de un anuncio. Fuera del sprint 1, pero el contrato es el contrato. */
export const listingDetailSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  categoryId: z.uuid(),
  title: z.string(),
  description: z.string(),
  pricing: pricingSchema,
  priceFrom: moneySchema.nullable(),
  status: listingStatusSchema,
  ratingAvg: z.number(),
  ratingCount: z.int(),
  createdAt: z.iso.datetime(),
});

export type ListingDetail = z.infer<typeof listingDetailSchema>;

/**
 * Filtros del modal de búsqueda. Es lo que `searchListingsQuerySchema` del backend acepta,
 * ni un campo más.
 *
 * NO hay `minRating` ni `maxPriceMinor`: el backend no los recibe, y un filtro que la API
 * ignora es peor que no tenerlo — el usuario lo pone, la lista no cambia, y parece un bug.
 * Ver el punto 6 de `docs/contract-delta.md`.
 */
export const listingSearchFiltersSchema = z.object({
  query: z.string().default(''),
  categoryId: z.uuid().nullable().default(null),
  /** En KILÓMETROS, como el backend. Entre 0,1 y 200; `null` deja que el servidor ponga 10. */
  radiusKm: z.number().min(0.1).max(200).nullable().default(null),
});

export type ListingSearchFilters = z.infer<typeof listingSearchFiltersSchema>;

/** El radio que aplica el backend cuando no se manda ninguno. */
export const DEFAULT_RADIUS_KM = 10;

/** Filtros vacíos. Sirve para el botón "limpiar filtros" y para saber si hay alguno puesto. */
export const EMPTY_LISTING_FILTERS: ListingSearchFilters = {
  query: '',
  categoryId: null,
  radiusKm: null,
};

/**
 * ¿Hay algún filtro puesto además del texto? Distingue el "vacío inicial" (ofrecer ampliar
 * radio) del "vacío por filtro" (ofrecer limpiarlos), que son dos de los cuatro estados.
 */
export function hasActiveFilters(filters: ListingSearchFilters): boolean {
  return filters.categoryId !== null || filters.radiusKm !== null;
}
