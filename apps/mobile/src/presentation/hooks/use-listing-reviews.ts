import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { reviewKeys } from '../../application/listings/query-keys';
import type { ReviewListPage } from '../../domain/review/ports';
import { useServices } from '../providers/services-provider';

const INITIAL_CURSOR: string | undefined = undefined;

export function useListingReviews(listingId: string) {
  const { reviewGateway } = useServices();

  const flatten = useCallback(
    (data: { pages: ReviewListPage[] }) => data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: reviewKeys.forListing(listingId),
    queryFn: ({ pageParam, signal }) => reviewGateway.listForListing(listingId, pageParam, signal),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: flatten,
  });

  return {
    reviews: query.data ?? [],
    isPending: query.isPending,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
