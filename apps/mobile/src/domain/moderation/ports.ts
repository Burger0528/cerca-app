import type {
  CursorPage,
  ModerateListingRequest,
  Report,
  ResolveReportRequest,
} from '@cerca/contract';

export interface ModerationGatewayPort {
  listReports(cursor: string | null, signal?: AbortSignal): Promise<CursorPage<Report>>;
  resolveReport(reportId: string, request: ResolveReportRequest): Promise<void>;
  moderateListing(listingId: string, request: ModerateListingRequest): Promise<void>;
}
