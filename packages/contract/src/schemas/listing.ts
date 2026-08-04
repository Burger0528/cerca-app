/**
 * OWNER: Salvador (primera versión del día cero, escrita con Jorge).
 *
 * Este es el schema que el gateway de Jorge le pasa a `parse()` en el límite. Si el
 * backend cambia una forma, el `parse` revienta aquí con el nombre del campo, y no tres
 * pantallas después con un `undefined is not an object`.
 */
import { z } from 'zod';

import { priceSchema } from '../money/money.ts';

import { categorySchema } from './category.ts';

export const LISTING_STATUSES = ['published', 'paused', 'removed'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const listingStatusSchema = z.enum(LISTING_STATUSES);

export const listingImageSchema = z.object({
  url: z.url(),
  /** Para el placeholder de expo-image mientras carga. Puede no venir. */
  blurhash: z.string().min(1).nullable().default(null),
});

export type ListingImage = z.infer<typeof listingImageSchema>;

export const ratingSchema = z.object({
  /** 0–5. Se lee "4,8 · 200 reseñas". */
  average: z.number().min(0).max(5),
  count: z.int().nonnegative(),
});

export type Rating = z.infer<typeof ratingSchema>;

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

export const listingProviderSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  avatarUrl: z.url().nullable().default(null),
});

export const listingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: listingStatusSchema,
  category: categorySchema,
  price: priceSchema,
  rating: ratingSchema,
  provider: listingProviderSchema,
  images: z.array(listingImageSchema),
  coordinates: coordinatesSchema,
  /**
   * Metros desde el punto de búsqueda. Lo calcula el servidor, que es quien conoce el
   * origen real. Viene `null` cuando la búsqueda no llevaba ubicación.
   */
  distanceMeters: z.number().nonnegative().nullable().default(null),
});

export type Listing = z.infer<typeof listingSchema>;

/** Filtros del modal de búsqueda. Lo que se serializa al query string de /listings. */
export const listingSearchFiltersSchema = z.object({
  query: z.string().default(''),
  categoryId: z.string().min(1).nullable().default(null),
  radiusMeters: z.int().positive().nullable().default(null),
  minRating: z.number().min(0).max(5).nullable().default(null),
  maxPriceMinor: z.int().nonnegative().nullable().default(null),
});

export type ListingSearchFilters = z.infer<typeof listingSearchFiltersSchema>;

/** Filtros vacíos. Sirve para el botón "limpiar filtros" y para saber si hay alguno puesto. */
export const EMPTY_LISTING_FILTERS: ListingSearchFilters = {
  query: '',
  categoryId: null,
  radiusMeters: null,
  minRating: null,
  maxPriceMinor: null,
};

/**
 * ¿Hay algún filtro puesto además del texto? Distingue el "vacío inicial" (ofrecer ampliar
 * radio) del "vacío por filtro" (ofrecer limpiarlos), que son dos de los cuatro estados.
 */
export function hasActiveFilters(filters: ListingSearchFilters): boolean {
  return (
    filters.categoryId !== null ||
    filters.radiusMeters !== null ||
    filters.minRating !== null ||
    filters.maxPriceMinor !== null
  );
}
