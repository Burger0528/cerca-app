import type { CursorPage, Review } from '@cerca/contract';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

const INITIAL_CURSOR: string | null = null;

export function useListingReviews(listingId: string) {
  const { listingGateway } = useServices();

  const flatten = useCallback(
    (data: { pages: CursorPage<Review>[] }): Review[] => data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: [...listingKeys.detail(listingId), 'reviews'],
    queryFn: ({ pageParam, signal }) => listingGateway.listReviews(listingId, pageParam, signal),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: flatten,
  });

  return {
    reviews: query.data ?? [],
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
