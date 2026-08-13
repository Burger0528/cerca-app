import type { ReviewResponse, WriteReviewInput } from '@cerca/contract';

export interface ReviewListPage {
  readonly items: readonly ReviewResponse[];
  readonly nextCursor: string | null;
}

export interface ReviewGatewayPort {
  write(
    bookingId: string,
    request: WriteReviewInput,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<ReviewResponse>;

  listForListing(
    listingId: string,
    cursor: string | undefined,
    signal?: AbortSignal,
  ): Promise<ReviewListPage>;
}
