import type { CreateBookingRequest } from '@cerca/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { bookingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

/**
 * Una clave de idempotencia por INTENTO, no por petición.
 *
 * Se crea al montar la pantalla y no cambia mientras se esté reservando ese anuncio, así
 * que dos toques seguidos mandan la misma clave y el servidor devuelve la reserva que ya
 * creó en vez de crear otra. El botón deshabilitado evita el segundo toque; esto lo hace
 * imposible aunque el botón fallara.
 */
export function useRequestBooking() {
  const { bookingGateway, newIdempotencyKey } = useServices();
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(newIdempotencyKey);

  return useMutation({
    mutationFn: (request: CreateBookingRequest) => bookingGateway.create(request, idempotencyKey),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
