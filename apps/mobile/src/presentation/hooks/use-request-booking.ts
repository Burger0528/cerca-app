import type { CreateBookingInput } from '@cerca/contract';
import { useMutation } from '@tanstack/react-query';

import { useServices } from '../providers/services-provider';

export function useRequestBooking() {
  const { bookingGateway, newIdempotencyKey } = useServices();

  return useMutation({
    mutationFn: (request: CreateBookingInput) =>
      bookingGateway.create(request, newIdempotencyKey()),
  });
}
