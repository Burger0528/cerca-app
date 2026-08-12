/**
 * OWNER: Salvador.
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

  return (
    <Pressable
      className="min-h-touch gap-1 border-b border-subtle bg-surface px-4 py-3 active:bg-surface-raised"
      accessibilityRole="button"
      onPress={() => router.push(`/bookings/${booking.id}`)}
    >
      <View>
        <Text className="text-base font-semibold text-foreground">
          {t(`bookings.status.${booking.status}`)}
        </Text>
        <Text className="text-sm text-muted">
          {role === 'customer' ? t('bookings.row.asCustomer') : t('bookings.row.asProvider')}
        </Text>
      </View>
    </Pressable>
  );
}

export const BookingRow = memo(BookingRowComponent);
