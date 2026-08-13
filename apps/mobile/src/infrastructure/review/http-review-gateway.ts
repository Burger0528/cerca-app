import { reviewResponseSchema } from '@cerca/contract';
import type { ReviewResponse, WriteReviewInput } from '@cerca/contract';
import { z } from 'zod';

import type { ReviewGatewayPort, ReviewListPage } from '../../domain/review/ports';
import type { HttpClient } from '../http/http-client';

const reviewListSchema = z.object({
  items: z.array(reviewResponseSchema),
  nextCursor: z.string().nullable(),
});

export function createHttpReviewGateway(http: HttpClient): ReviewGatewayPort {
  return {
    write(
      bookingId: string,
      request: WriteReviewInput,
      idempotencyKey: string,
      signal?: AbortSignal,
    ): Promise<ReviewResponse> {
      return http.request(
        {
          path: `/bookings/${bookingId}/review`,
          method: 'POST',
          body: request,
          idempotencyKey,
          signal,
        },
        reviewResponseSchema,
      );
    },

    listForListing(
      listingId: string,
      cursor: string | undefined,
      signal?: AbortSignal,
    ): Promise<ReviewListPage> {
      return http.request(
        { path: `/listings/${listingId}/reviews`, query: { cursor, limit: 20 }, signal },
        reviewListSchema,
      );
    },
  };
}
