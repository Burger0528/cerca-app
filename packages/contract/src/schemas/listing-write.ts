import { z } from 'zod';

import { pricingSchema } from '../money/money.ts';

import { geoPointSchema } from './listing.ts';

export const LISTING_TITLE_MIN_LENGTH = 3;
export const LISTING_TITLE_MAX_LENGTH = 120;
export const LISTING_DESCRIPTION_MAX_LENGTH = 4000;

export const createListingSchema = z.object({
  categoryId: z.uuid({ error: 'validation.category.required' }),
  title: z
    .string()
    .min(LISTING_TITLE_MIN_LENGTH, { error: 'validation.title.tooShort' })
    .max(LISTING_TITLE_MAX_LENGTH, { error: 'validation.title.tooLong' }),
  description: z
    .string()
    .min(1, { error: 'validation.description.required' })
    .max(LISTING_DESCRIPTION_MAX_LENGTH, { error: 'validation.description.tooLong' }),
  pricing: pricingSchema,
  location: geoPointSchema,
});

export type CreateListingRequest = z.infer<typeof createListingSchema>;

/** `PATCH /listings/:id` no acepta ni la categoría ni la ubicación. */
export const updateListingSchema = createListingSchema.pick({
  title: true,
  description: true,
  pricing: true,
});

export type UpdateListingRequest = z.infer<typeof updateListingSchema>;
