import { z } from 'zod';

export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reportSchema = z.object({
  id: z.uuid(),
  listingId: z.uuid(),
  reporterId: z.uuid(),
  reason: z.string(),
  status: z.enum(REPORT_STATUSES),
  createdAt: z.iso.datetime(),
});

export type Report = z.infer<typeof reportSchema>;

export const REPORT_RESOLUTIONS = ['remove', 'dismiss'] as const;

export type ReportResolution = (typeof REPORT_RESOLUTIONS)[number];

export const resolveReportSchema = z
  .object({
    action: z.enum(REPORT_RESOLUTIONS),
    note: z.string().max(500).optional(),
  })
  .strict();

export type ResolveReportRequest = z.infer<typeof resolveReportSchema>;

export const LISTING_MODERATIONS = ['under_review', 'removed'] as const;

export type ListingModeration = (typeof LISTING_MODERATIONS)[number];

export const moderateListingSchema = z
  .object({
    action: z.enum(LISTING_MODERATIONS),
    reason: z.string().min(1).max(500),
  })
  .strict();

export type ModerateListingRequest = z.infer<typeof moderateListingSchema>;
