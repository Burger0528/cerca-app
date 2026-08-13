import type { WriteReviewInput } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookingKeys } from '../../application/booking/query-keys';
import { useServices } from '../providers/services-provider';

export function useWriteReview() {
  const { reviewGateway, newIdempotencyKey } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, request }: { bookingId: string; request: WriteReviewInput }) =>
      reviewGateway.write(bookingId, request, newIdempotencyKey()),
    onSuccess: (_data, { bookingId }) => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
    },
  });
}
