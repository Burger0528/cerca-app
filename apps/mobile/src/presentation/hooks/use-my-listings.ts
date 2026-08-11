import type { CursorPage, MyListing } from '@cerca/contract';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

const INITIAL_CURSOR: string | null = null;

export function useMyListings() {
  const { listingGateway } = useServices();

  const flatten = useCallback(
    (data: { pages: CursorPage<MyListing>[] }): MyListing[] =>
      data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: listingKeys.mine(),
    queryFn: ({ pageParam, signal }) => listingGateway.listMine(pageParam, signal),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: flatten,
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
  };
}
