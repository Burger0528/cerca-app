/**
 * OWNER: Salvador.
 *
 * `status` llega plano desde el backend, sin `reason`/`cancelledBy`/`cancelledAt` (ver
 * `booking-detail-screen.tsx`). El texto de aquí es genérico por estado, no específico
 * del motivo -- ese dato no existe todavía en la respuesta real.
 */
import type { BookingResponse } from '@cerca/contract';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { assertNever } from '../../domain/assert-never';

export interface BookingStatusExplanationProps {
  readonly status: BookingResponse['status'];
}

export function BookingStatusExplanation({ status }: BookingStatusExplanationProps) {
  const { t } = useTranslation();

  switch (status) {
    case 'requested':
      return <Text className="text-base text-muted">{t('bookings.explain.requested')}</Text>;
    case 'accepted':
      return <Text className="text-base text-muted">{t('bookings.explain.accepted')}</Text>;
    case 'declined':
      return <Text className="text-base text-muted">{t('bookings.explain.declined')}</Text>;
    case 'completed':
      return <Text className="text-base text-muted">{t('bookings.explain.completed')}</Text>;
    case 'cancelled':
      return <Text className="text-base text-muted">{t('bookings.explain.cancelled')}</Text>;
    default:
      return assertNever(status);
  }
}
