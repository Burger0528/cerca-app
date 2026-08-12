import { EMPTY_LISTING_FILTERS } from '@cerca/contract';

import { buildListingSearchQuery, searchIdentityOf } from './listing-search';
import { listingKeys } from './query-keys';

const deviceOrigin = (latitude: number, longitude: number) =>
  ({ kind: 'device', coordinates: { latitude, longitude } }) as const;

describe('listingKeys', () => {
  it('nests every level under the one above it', () => {
    const identity = searchIdentityOf(
      buildListingSearchQuery(EMPTY_LISTING_FILTERS, { kind: 'unset' }),
    );

    // Que `lists()` empiece por `all` es lo que hace que invalidar `all` tire también las
    // búsquedas. Si esto se rompe, `invalidateQueries` deja entradas huérfanas vivas.
    expect(listingKeys.lists().slice(0, 1)).toEqual(listingKeys.all);
    expect(listingKeys.list(identity).slice(0, 2)).toEqual(listingKeys.lists());
    expect(listingKeys.detail('lst_1').slice(0, 2)).toEqual(listingKeys.details());
  });

  it('keeps searches and details apart', () => {
    expect(listingKeys.lists()).not.toEqual(listingKeys.details());
  });
});

describe('buildListingSearchQuery', () => {
  it('snaps the origin so a few metres do not change the key', () => {
    const a = buildListingSearchQuery(EMPTY_LISTING_FILTERS, deviceOrigin(19.432608, -99.133209));
    const b = buildListingSearchQuery(EMPTY_LISTING_FILTERS, deviceOrigin(19.432651, -99.133188));

    expect(a.origin).toEqual(b.origin);
    expect(listingKeys.list(searchIdentityOf(a))).toEqual(listingKeys.list(searchIdentityOf(b)));
  });

  it('changes the key when the filters change', () => {
    const withoutFilter = buildListingSearchQuery(
      EMPTY_LISTING_FILTERS,
      deviceOrigin(19.4326, -99.1332),
    );
    const withFilter = buildListingSearchQuery(
      { ...EMPTY_LISTING_FILTERS, radiusKm: 5 },
      deviceOrigin(19.4326, -99.1332),
    );

    expect(listingKeys.list(searchIdentityOf(withoutFilter))).not.toEqual(
      listingKeys.list(searchIdentityOf(withFilter)),
    );
  });

  /**
   * La página 3 de una búsqueda es la MISMA entrada de caché que la página 1. Si el cursor
   * entrara en la clave, cada scroll crearía una entrada nueva y `useInfiniteQuery` no
   * tendría páginas que acumular.
   */
  it('leaves the cursor out of the cache identity', () => {
    const first = buildListingSearchQuery(EMPTY_LISTING_FILTERS, deviceOrigin(19.4326, -99.1332));
    const second = buildListingSearchQuery(EMPTY_LISTING_FILTERS, deviceOrigin(19.4326, -99.1332), {
      cursor: 'cur_abc',
    });

    expect(second.cursor).toBe('cur_abc');
    expect(searchIdentityOf(first)).toEqual(searchIdentityOf(second));
  });

  it('resolves a city origin to the city coordinates', () => {
    const query = buildListingSearchQuery(EMPTY_LISTING_FILTERS, {
      kind: 'city',
      city: {
        id: 'co-mde',
        name: 'Medellín',
        countryCode: 'CO',
        coordinates: { latitude: 6.2442, longitude: -75.5812 },
      },
    });

    expect(query.origin).toEqual({ latitude: 6.244, longitude: -75.581 });
  });

  it('has no origin at all when nobody has provided one', () => {
    expect(buildListingSearchQuery(EMPTY_LISTING_FILTERS, { kind: 'unset' }).origin).toBeNull();
  });
});
