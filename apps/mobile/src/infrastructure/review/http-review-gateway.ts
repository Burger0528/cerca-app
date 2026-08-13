import { reviewResponseSchema } from '@cerca/contract';
import type { ReviewResponse, WriteReviewInput } from '@cerca/contract';

import type { ReviewGatewayPort } from '../../domain/review/ports';
import type { HttpClient } from '../http/http-client';

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
  };
}
