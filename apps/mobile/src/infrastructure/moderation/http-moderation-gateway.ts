import { cursorPageSchema, reportSchema } from '@cerca/contract';
import type {
  CreateReportRequest,
  CursorPage,
  ModerateListingRequest,
  ModerateReviewRequest,
  Report,
  ResolveReportRequest,
} from '@cerca/contract';

import type { ModerationGatewayPort } from '../../domain/moderation/ports';
import type { HttpClient } from '../http/http-client';

const reportPageSchema = cursorPageSchema(reportSchema);

export function createHttpModerationGateway(http: HttpClient): ModerationGatewayPort {
  return {
    createReport(listingId: string, request: CreateReportRequest): Promise<void> {
      return http.requestVoid({
        path: `/listings/${listingId}/report`,
        method: 'POST',
        body: request,
      });
    },

    listReports(cursor: string | null, signal?: AbortSignal): Promise<CursorPage<Report>> {
      return http.request({ path: '/reports', query: { cursor }, signal }, reportPageSchema);
    },

    resolveReport(reportId: string, request: ResolveReportRequest): Promise<void> {
      return http.requestVoid({
        path: `/reports/${reportId}/resolve`,
        method: 'POST',
        body: request,
      });
    },

    moderateListing(listingId: string, request: ModerateListingRequest): Promise<void> {
      return http.requestVoid({
        path: `/listings/${listingId}/moderate`,
        method: 'POST',
        body: request,
      });
    },

    moderateReview(reviewId: string, request: ModerateReviewRequest): Promise<void> {
      return http.requestVoid({
        path: `/reviews/${reviewId}/moderate`,
        method: 'POST',
        body: request,
      });
    },
  };
}
