import type { CreateListingRequest } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { listingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

/**
 * Crear y publicar son dos peticiones porque el servidor solo sabe crear borradores. Si la
 * segunda falla, el borrador ya existe y aparece en "Mis anuncios" con su botón de publicar;
 * por eso las cachés se invalidan pase lo que pase.
 */
export function useCreateListing() {
  const { listingGateway } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateListingRequest) => {
      const draft = await listingGateway.create(request);
      await listingGateway.setStatus(draft.id, 'publish');

      return draft;
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}
