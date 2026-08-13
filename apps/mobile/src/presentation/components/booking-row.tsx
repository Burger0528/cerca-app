/**
 * OWNER: Salvador.
 *
 * Una tarjeta = una parada del lector: el `accessibilityLabel` en el `Pressable` lee todo
 * junto, no cada `<Text>` por separado. Mismo patrón que `listing-card.tsx`.
 */
import type { BookingResponse } from '@cerca/contract';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

export interface BookingRowProps {
  readonly booking: BookingResponse;
  readonly role: 'customer' | 'provider';
}

function BookingRowComponent({ booking, role }: BookingRowProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const status = t(`bookings.status.${booking.status}`);
  const roleLabel =
    role === 'customer' ? t('bookings.row.asCustomer') : t('bookings.row.asProvider');

  return (
    <Pressable
      className="min-h-touch gap-1 border-b border-subtle bg-surface px-4 py-3 active:bg-surface-raised"
      accessibilityRole="button"
      accessibilityLabel={t('bookings.a11y.row', { status, role: roleLabel })}
      onPress={() => router.push(`/bookings/${booking.id}`)}
    >
      <View>
        <Text className="text-base font-semibold text-foreground">{status}</Text>
        <Text className="text-sm text-muted">{roleLabel}</Text>
      </View>
    </Pressable>
  );
}

export const BookingRow = memo(BookingRowComponent);
