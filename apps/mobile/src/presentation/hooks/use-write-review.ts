import type { ReviewBlockedReason, WriteReviewRequest } from '@cerca/contract';
import { isReviewBlockedReason } from '@cerca/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { bookingKeys, listingKeys } from '../../application/listings/query-keys';
import { HttpError } from '../../domain/errors/app-error';
import { useServices } from '../providers/services-provider';

export function useBookingDetail(bookingId: string) {
  const { bookingGateway } = useServices();

  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: ({ signal }) => bookingGateway.detail(bookingId, signal),
  });
}

export function useWriteReview(bookingId: string) {
  const { bookingGateway, newIdempotencyKey } = useServices();
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(newIdempotencyKey);

  return useMutation({
    mutationFn: (request: WriteReviewRequest) =>
      bookingGateway.review(bookingId, request, idempotencyKey),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: listingKeys.details() });
    },
  });
}

/**
 * El servidor rechaza con `code: REVIEW_BLOCKED` y el motivo de la política dentro de
 * `reason`. Sacarlo de ahí es lo que permite enseñar EL MISMO mensaje que el bloqueo del
 * cliente, en vez de un genérico, cuando alguien fuerza la petición.
 */
export function reviewBlockedReasonOf(error: unknown): ReviewBlockedReason | null {
  if (!(error instanceof HttpError)) return null;

  const reason = error.problem?.reason;

  return isReviewBlockedReason(reason) ? reason : null;
}
