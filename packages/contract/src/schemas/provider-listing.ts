import { z } from 'zod';

import { moneySchema } from '../money/money.ts';

import { listingStatusSchema } from './listing.ts';

export const myListingSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  priceFrom: moneySchema.nullable(),
  status: listingStatusSchema,
});

export type MyListing = z.infer<typeof myListingSchema>;

export const LISTING_STATUS_ACTIONS = ['publish', 'pause'] as const;

export type ListingStatusAction = (typeof LISTING_STATUS_ACTIONS)[number];
