import type { Booking, BookingRole, CursorPage, DeclineReason } from '@cerca/contract';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { bookingKeys } from '../../application/listings/query-keys';
import { assertNever } from '../../domain/assert-never';
import type { BookingAction } from '../../domain/bookings/ports';
import { useServices } from '../providers/services-provider';

const INITIAL_CURSOR: string | null = null;

export function useBookings(role: BookingRole) {
  const { bookingGateway } = useServices();

  const flatten = useCallback(
    (data: { pages: CursorPage<Booking>[] }): Booking[] => data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: bookingKeys.list(role),
    queryFn: ({ pageParam, signal }) => bookingGateway.list(role, pageParam, signal),
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

export interface BookingDecision {
  readonly bookingId: string;
  readonly action: BookingAction;
  /** Solo para aceptar: cuándo queda la cita. */
  readonly scheduledFor?: string;
  /** Solo para rechazar. */
  readonly reason?: DeclineReason;
}

export function useBookingDecision() {
  const { bookingGateway } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (decision: BookingDecision) => run(bookingGateway, decision),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

function run(
  gateway: ReturnType<typeof useServices>['bookingGateway'],
  { bookingId, action, scheduledFor, reason }: BookingDecision,
): Promise<void> {
  switch (action) {
    case 'accept':
      return gateway.accept(bookingId, { scheduledFor: scheduledFor ?? new Date().toISOString() });
    case 'decline':
      return gateway.decline(bookingId, { reason: reason ?? 'other' });
    case 'complete':
      return gateway.complete(bookingId);
    case 'cancel':
      return gateway.cancel(bookingId);
    default:
      return assertNever(action);
  }
}
