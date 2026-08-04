import { describe, expect, it } from 'vitest';

import { EMPTY_LISTING_FILTERS, hasActiveFilters, listingSchema } from './listing.ts';

const validListing = {
  id: 'lst_1',
  title: 'Fontanería 24 h',
  status: 'published',
  category: { id: 'cat_1', nameKey: 'category.plumbing', slug: 'plumbing', parentId: null },
  price: {
    amount: { amountMinor: 45000, currency: 'MXN' },
    unit: 'hour',
    minimumUnits: 2,
  },
  rating: { average: 4.8, count: 200 },
  provider: { id: 'usr_1', displayName: 'Ana', avatarUrl: null },
  images: [],
  coordinates: { latitude: 19.4326, longitude: -99.1332 },
  distanceMeters: 1200,
};

describe('listingSchema', () => {
  it('parses a well formed listing', () => {
    expect(listingSchema.parse(validListing).id).toBe('lst_1');
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
});

describe('hasActiveFilters', () => {
  it('is false for the empty filters', () => {
    expect(hasActiveFilters(EMPTY_LISTING_FILTERS)).toBe(false);
  });

  it('ignores the free text query, which is not a filter chip', () => {
    expect(hasActiveFilters({ ...EMPTY_LISTING_FILTERS, query: 'fontanero' })).toBe(false);
  });

  it('is true once a real filter is set', () => {
    expect(hasActiveFilters({ ...EMPTY_LISTING_FILTERS, minRating: 4 })).toBe(true);
  });
});
