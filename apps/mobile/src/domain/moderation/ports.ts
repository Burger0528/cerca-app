import type {
  CreateReportRequest,
  CursorPage,
  ModerateListingRequest,
  ModerateReviewRequest,
  Report,
  ResolveReportRequest,
} from '@cerca/contract';

export interface ModerationGatewayPort {
  /** Lo hace cualquier usuario con sesión, no solo el moderador. */
  createReport(listingId: string, request: CreateReportRequest): Promise<void>;

  listReports(cursor: string | null, signal?: AbortSignal): Promise<CursorPage<Report>>;
  resolveReport(reportId: string, request: ResolveReportRequest): Promise<void>;
  moderateListing(listingId: string, request: ModerateListingRequest): Promise<void>;
  moderateReview(reviewId: string, request: ModerateReviewRequest): Promise<void>;
}
