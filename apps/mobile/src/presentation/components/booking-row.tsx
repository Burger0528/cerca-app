import type { Booking, BookingRole, BookingStatus } from '@cerca/contract';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { assertNever } from '../../domain/assert-never';
import type { BookingAction } from '../../domain/bookings/ports';

import { Button } from './button';
import { Chip } from './chip';

/**
 * Qué puede hacer cada lado en cada estado. Un `switch` sobre `kind` con `assertNever`:
 * el día que el backend añada un estado, esto deja de compilar señalando el sitio.
 */
function actionsFor(status: BookingStatus, role: BookingRole): readonly BookingAction[] {
  switch (status.kind) {
    case 'requested':
      return role === 'provider' ? ['accept', 'decline'] : ['cancel'];
    case 'accepted':
      return role === 'provider' ? ['complete', 'cancel'] : ['cancel'];
    case 'declined':
    case 'completed':
    case 'cancelled':
      return [];
    default:
      return assertNever(status);
  }
}

/** Tres días a elegir en vez de un selector de fecha: la cita la decide quien acepta. */
const ACCEPT_OFFSETS_DAYS = [1, 3, 7] as const;

function dateIn(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0);

  return date.toISOString();
}

export interface BookingRowProps {
  readonly booking: Booking;
  readonly role: BookingRole;
  readonly locale: string;
  readonly isBusy: boolean;
  readonly onDecide: (bookingId: string, action: BookingAction, scheduledFor?: string) => void;
}

function BookingRowComponent({ booking, role, locale, isBusy, onDecide }: BookingRowProps) {
  const { t } = useTranslation();
  const [isPickingDate, setPickingDate] = useState(false);

  const actions = actionsFor(booking.status, role);

  return (
    <View
      className="gap-2 border-b border-subtle px-4 py-4"
      accessible
      accessibilityLabel={t('bookings.a11y.row', {
        status: t(`bookings.status.${booking.status.kind}`),
        date: new Date(booking.requestedAt).toLocaleDateString(locale),
      })}
    >
      <Text className="text-base font-semibold text-foreground">
        {t(`bookings.status.${booking.status.kind}`)}
      </Text>

      <Text className="text-sm text-muted">
        {booking.status.kind === 'accepted'
          ? t('bookings.scheduledFor', {
              date: new Date(booking.status.scheduledFor).toLocaleString(locale),
            })
          : new Date(booking.requestedAt).toLocaleDateString(locale)}
      </Text>

      {isPickingDate ? (
        <View className="flex-row flex-wrap gap-2">
          {ACCEPT_OFFSETS_DAYS.map((days) => (
            <Chip
              key={days}
              label={t('bookings.acceptIn', { count: days })}
              isSelected={false}
              onPress={() => {
                setPickingDate(false);
                onDecide(booking.id, 'accept', dateIn(days));
              }}
            />
          ))}
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === 'decline' || action === 'cancel' ? 'secondary' : 'primary'}
              isLoading={isBusy}
              onPress={() =>
                action === 'accept' ? setPickingDate(true) : onDecide(booking.id, action)
              }
            >
              {t(`bookings.action.${action}`)}
            </Button>
          ))}
        </View>
      )}
    </View>
  );
}

export const BookingRow = memo(BookingRowComponent);
