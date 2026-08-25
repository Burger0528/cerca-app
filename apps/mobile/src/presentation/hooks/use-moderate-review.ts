import type { ModerateReviewAction } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { listingKeys, reviewKeys } from '../../application/listings/query-keys';
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

    // La reseña retirada vive en DOS cachés: la media del anuncio (que baja al quitarla) y
    // la lista paginada de reseñas. Invalidar solo el detalle dejaba la fila en pantalla.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
      void queryClient.invalidateQueries({ queryKey: reviewKeys.forListing(listingId) });
    },
  });
}
