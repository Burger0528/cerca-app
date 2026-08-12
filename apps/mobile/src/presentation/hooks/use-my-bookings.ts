import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { bookingKeys } from '../../application/booking/query-keys';
import type { BookingListPage } from '../../domain/booking/ports';
import { useServices } from '../providers/services-provider';

const INITIAL_CURSOR: string | null = null;

export function useMyBookings(role: 'customer' | 'provider') {
  const { bookingGateway } = useServices();

  const flatten = useCallback(
    (data: { pages: BookingListPage[] }) => data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: bookingKeys.list(role),
    queryFn: ({ pageParam, signal }) =>
      bookingGateway.list({ role, cursor: pageParam ?? undefined, limit: 20 }, signal),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: flatten,
  });

  return {
    bookings: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
