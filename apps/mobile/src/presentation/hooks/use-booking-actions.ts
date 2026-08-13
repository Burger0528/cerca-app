import type { AcceptBookingInput, DeclineBookingInput } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookingKeys } from '../../application/booking/query-keys';
import { useServices } from '../providers/services-provider';

function useInvalidateBookings() {
  const queryClient = useQueryClient();

  return (bookingId: string) => {
    void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
    void queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
  };
}

export function useAcceptBooking() {
  const { bookingGateway } = useServices();
  const invalidate = useInvalidateBookings();

  return useMutation({
    mutationFn: ({ bookingId, request }: { bookingId: string; request: AcceptBookingInput }) =>
      bookingGateway.accept(bookingId, request),
    onSuccess: (_data, { bookingId }) => invalidate(bookingId),
  });
}

export function useDeclineBooking() {
  const { bookingGateway } = useServices();
  const invalidate = useInvalidateBookings();

  return useMutation({
    mutationFn: ({ bookingId, request }: { bookingId: string; request: DeclineBookingInput }) =>
      bookingGateway.decline(bookingId, request),
    onSuccess: (_data, { bookingId }) => invalidate(bookingId),
  });
}

export function useCompleteBooking() {
  const { bookingGateway } = useServices();
  const invalidate = useInvalidateBookings();

  return useMutation({
    mutationFn: (bookingId: string) => bookingGateway.complete(bookingId),
    onSuccess: (_data, bookingId) => invalidate(bookingId),
  });
}

export function useCancelBooking() {
  const { bookingGateway } = useServices();
  const invalidate = useInvalidateBookings();

  return useMutation({
    mutationFn: (bookingId: string) => bookingGateway.cancel(bookingId),
    onSuccess: (_data, bookingId) => invalidate(bookingId),
  });
}
