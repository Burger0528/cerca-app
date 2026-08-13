import { z } from 'zod';

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_BODY_MAX_LENGTH = 2000;

export const reviewSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  listingId: z.uuid(),
  authorId: z.uuid(),
  rating: z.int(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});

export type Review = z.infer<typeof reviewSchema>;

export const writeReviewSchema = z
  .object({
    rating: z
      .int()
      .min(REVIEW_RATING_MIN, { error: 'validation.rating.required' })
      .max(REVIEW_RATING_MAX, { error: 'validation.rating.required' }),
    body: z
      .string()
      .trim()
      .min(1, { error: 'validation.reviewBody.required' })
      .max(REVIEW_BODY_MAX_LENGTH, { error: 'validation.reviewBody.tooLong' }),
  })
  .strict();

export type WriteReviewRequest = z.infer<typeof writeReviewSchema>;
