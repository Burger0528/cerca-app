import type { CreateReportRequest } from '@cerca/contract';
import { useMutation } from '@tanstack/react-query';

import { useServices } from '../providers/services-provider';

/**
 * Denunciar un anuncio.
 *
 * No invalida nada: la denuncia no cambia lo que el usuario está viendo. El anuncio sigue
 * publicado hasta que un moderador decida, y decirle lo contrario sería mentirle.
 */
export function useReportListing(listingId: string) {
  const { moderationGateway } = useServices();

  return useMutation({
    mutationFn: (request: CreateReportRequest) =>
      moderationGateway.createReport(listingId, request),
  });
}
