import type { UpdateListingRequest } from '@cerca/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

export function useListingDetail(listingId: string) {
  const { listingGateway } = useServices();

  return useQuery({
    queryKey: listingKeys.detail(listingId),
    queryFn: ({ signal }) => listingGateway.detail(listingId, signal),
  });
}

export function useUpdateListing(listingId: string) {
  const { listingGateway } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateListingRequest) => listingGateway.update(listingId, request),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
      void queryClient.invalidateQueries({ queryKey: listingKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}
