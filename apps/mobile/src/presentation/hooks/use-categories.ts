import { useQuery } from '@tanstack/react-query';

import { categoryKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

/**
 * Las categorías del modal de filtros.
 *
 * `staleTime` largo a propósito: el catálogo no cambia entre dos aperturas del modal, y
 * refrescarlo cada vez es una petición por gesto a cambio de nada.
 */
export function useCategories() {
  const { categoryGateway } = useServices();

  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => categoryGateway.list(signal),
    staleTime: 30 * 60_000,
  });
}
