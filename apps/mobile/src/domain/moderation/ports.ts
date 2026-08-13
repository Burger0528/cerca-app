import type {
  CursorPage,
  ModerateListingRequest,
  ModerateReviewRequest,
  Report,
  ResolveReportRequest,
} from '@cerca/contract';

export interface ModerationGatewayPort {
  listReports(cursor: string | null, signal?: AbortSignal): Promise<CursorPage<Report>>;
  resolveReport(reportId: string, request: ResolveReportRequest): Promise<void>;
  moderateListing(listingId: string, request: ModerateListingRequest): Promise<void>;
  moderateReview(reviewId: string, request: ModerateReviewRequest): Promise<void>;
}
