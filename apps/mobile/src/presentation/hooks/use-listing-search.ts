/**
 * El hook de búsqueda: cursor, caché y cancelación.
 *
 * Lo que la pantalla de Salvador consume. Devuelve la lista ya aplanada, los cuatro
 * estados distinguibles, y `fetchNextPage` para el scroll infinito.
 */
import type { CursorPage, Listing, ListingSearchFilters } from '@cerca/contract';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  buildListingSearchQuery,
  searchIdentityOf,
} from '../../application/listings/listing-search';
import { listingKeys } from '../../application/listings/query-keys';
import { useSearchOrigin } from '../providers/search-origin-provider';
import { useServices } from '../providers/services-provider';

/** La primera página no lleva cursor. Tipado aquí para no necesitar un `as` en la llamada. */
const INITIAL_CURSOR: string | null = null;

export function useListingSearch(filters: ListingSearchFilters) {
  const { listingGateway } = useServices();
  const { origin } = useSearchOrigin();

  // La consulta base se memoiza porque de ella sale la clave de caché. Si se reconstruyera
  // en cada render, la clave sería nueva cada vez y no habría caché que valiera.
  const baseQuery = useMemo(() => buildListingSearchQuery(filters, origin), [filters, origin]);

  const identity = useMemo(() => searchIdentityOf(baseQuery), [baseQuery]);

  // Aplana las páginas a una sola lista. TanStack aplica structural sharing al resultado,
  // así que las tarjetas que no han cambiado conservan su identidad y no se vuelven a
  // renderizar mientras se teclea en el buscador.
  const flatten = useCallback(
    (data: { pages: CursorPage<Listing>[] }): Listing[] => data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: listingKeys.list(identity),
    // `signal` viene de TanStack y llega hasta el `fetch`: cambiar de filtro a mitad de
    // petición la aborta de verdad, no solo ignora el resultado.
    queryFn: ({ pageParam, signal }) =>
      listingGateway.search({ ...baseQuery, cursor: pageParam }, signal),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: flatten,
    // Sin origen la búsqueda no tiene sentido: no se lanza y la pantalla enseña el estado
    // de "elige desde dónde buscar" en vez de una lista vacía que parece un fallo.
    enabled: origin.kind !== 'unset',
  });

  return {
    listings: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefetching: query.isRefetching,
  };
}
