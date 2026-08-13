import { useQuery } from '@tanstack/react-query';

import { bookingKeys } from '../../application/booking/query-keys';
import { useServices } from '../providers/services-provider';

export function useBookingDetail(bookingId: string) {
  const { bookingGateway } = useServices();

  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: ({ signal }) => bookingGateway.detail(bookingId, signal),
  });
}
