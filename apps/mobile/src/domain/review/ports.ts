import type { ReviewResponse, WriteReviewInput } from '@cerca/contract';

export interface ReviewGatewayPort {
  write(
    bookingId: string,
    request: WriteReviewInput,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<ReviewResponse>;
}
