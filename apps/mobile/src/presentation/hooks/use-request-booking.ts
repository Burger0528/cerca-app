import type { CreateBookingInput } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookingKeys } from '../../application/booking/query-keys';
import { useServices } from '../providers/services-provider';

export function useRequestBooking() {
  const { bookingGateway, newIdempotencyKey } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBookingInput) =>
      bookingGateway.create(request, newIdempotencyKey()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}
