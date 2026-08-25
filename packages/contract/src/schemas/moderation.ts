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

/**
 * Denunciar un anuncio.
 *
 * Los límites son los del backend (`CreateReportDto`: min 3, max 500), copiados a
 * propósito: así el usuario ve el error mientras escribe y no después de un 400.
 */
export const createReportSchema = z
  .object({
    reason: z.string().min(3).max(500),
  })
  .strict();

export type CreateReportRequest = z.infer<typeof createReportSchema>;

/**
 * Motivos que ofrece la app. El backend acepta texto libre; estos son la parte fija que se
 * antepone al detalle, para que la cola del moderador se lea de un vistazo.
 */
export const REPORT_REASONS = ['spam', 'misleading', 'inappropriate', 'other'] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

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

export const moderateReviewSchema = z
  .object({
    action: z.enum(['remove', 'keep']),
    reason: z.string().max(500).optional(),
  })
  .strict();

export type ModerateReviewRequest = z.infer<typeof moderateReviewSchema>;
export type ModerateReviewAction = ModerateReviewRequest['action'];
