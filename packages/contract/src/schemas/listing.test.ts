import { describe, expect, it } from 'vitest';

import { EMPTY_LISTING_FILTERS, hasActiveFilters, listingSchema } from './listing.ts';

/** Un resultado tal y como lo emite `toSearchItem` del backend. */
const validListing = {
  id: '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8',
  title: 'Fontanería 24 h',
  categoryId: '11111111-2222-4333-8444-555555555555',
  priceFrom: { amountMinor: 45000, currency: 'MXN' },
  status: 'published',
  ratingAvg: 4.8,
  ratingCount: 200,
  distanceMeters: 1200,
};

describe('listingSchema', () => {
  it('parses a well formed listing', () => {
    expect(listingSchema.parse(validListing).id).toBe(validListing.id);
  });

  it('names the offending field when a required one is missing', () => {
    const { title: _title, ...withoutTitle } = validListing;
    const result = listingSchema.safeParse(withoutTitle);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['title']);
  });

  it('rejects an unknown status instead of letting it through', () => {
    const result = listingSchema.safeParse({ ...validListing, status: 'archived' });

    expect(result.success).toBe(false);
  });

  it('accepts the five statuses the backend can emit', () => {
    for (const status of ['draft', 'published', 'paused', 'under_review', 'removed']) {
      expect(listingSchema.safeParse({ ...validListing, status }).success).toBe(true);
    }
  });

  it('accepts a listing quoted on request, with no price to sort by', () => {
    expect(listingSchema.parse({ ...validListing, priceFrom: null }).priceFrom).toBeNull();
  });

  it('rejects an id that is not a uuid, which is what the backend emits', () => {
    expect(listingSchema.safeParse({ ...validListing, id: 'lst_1' }).success).toBe(false);
  });
});

describe('hasActiveFilters', () => {
  it('is false for the empty filters', () => {
    expect(hasActiveFilters(EMPTY_LISTING_FILTERS)).toBe(false);
  });

  it('ignores the free text query, which is not a filter chip', () => {
    expect(hasActiveFilters({ ...EMPTY_LISTING_FILTERS, query: 'fontanero' })).toBe(false);
  });

  it('is true once a real filter is set', () => {
    expect(hasActiveFilters({ ...EMPTY_LISTING_FILTERS, radiusKm: 5 })).toBe(true);
    expect(
      hasActiveFilters({
        ...EMPTY_LISTING_FILTERS,
        categoryId: '11111111-2222-4333-8444-555555555555',
      }),
    ).toBe(true);
  });
});
