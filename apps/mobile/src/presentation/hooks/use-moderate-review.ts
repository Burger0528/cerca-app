import type { ModerateReviewAction } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { listingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

interface ReviewDecision {
  readonly reviewId: string;
  readonly action: ModerateReviewAction;
}

export function useModerateReview(listingId: string) {
  const { moderationGateway } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, action }: ReviewDecision) =>
      moderationGateway.moderateReview(reviewId, { action }),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
    },
  });
}
