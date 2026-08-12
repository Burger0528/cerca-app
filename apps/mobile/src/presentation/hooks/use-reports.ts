import type { CursorPage, ListingModeration, Report, ReportResolution } from '@cerca/contract';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listingKeys, reportKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

const INITIAL_CURSOR: string | null = null;

export function useReports() {
  const { moderationGateway } = useServices();

  const flatten = useCallback(
    (data: { pages: CursorPage<Report>[] }): Report[] => data.pages.flatMap((page) => page.items),
    [],
  );

  const query = useInfiniteQuery({
    queryKey: reportKeys.list(),
    queryFn: ({ pageParam, signal }) => moderationGateway.listReports(pageParam, signal),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: flatten,
  });

  return {
    reports: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

interface ReportDecision {
  readonly report: Report;
  readonly resolution: ReportResolution;
}

/** Retirar un anuncio son dos pasos: se modera el anuncio y se cierra el reporte. */
const MODERATION_FOR: Readonly<Record<ReportResolution, ListingModeration | null>> = {
  remove: 'removed',
  dismiss: null,
};

export function useResolveReport() {
  const { moderationGateway } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ report, resolution }: ReportDecision) => {
      const moderation = MODERATION_FOR[resolution];

      if (moderation !== null) {
        await moderationGateway.moderateListing(report.listingId, {
          action: moderation,
          reason: report.reason,
        });
      }

      await moderationGateway.resolveReport(report.id, { action: resolution });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      void queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}
