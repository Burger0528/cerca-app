/**
 * OWNER: Salvador.
 *
 * S3 (primera mitad): la lista, con selector de lado y sus cuatro estados. El detalle y
 * las acciones (aceptar/rechazar/completar/cancelar) van en un bloque aparte.
 */
import type { BookingResponse } from '@cerca/contract';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHasCapacity } from '../auth/use-can';
import { BookingRow } from '../components/booking-row';
import { Chip } from '../components/chip';
import { useMyBookings } from '../hooks/use-my-bookings';
import { messageKeyForError } from '../i18n/error-message-key';

export function MyBookingsScreen() {
  const { t } = useTranslation();
  const isProvider = useHasCapacity('provider');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');

  const bookings = useMyBookings(role);
  const keyExtractor = useCallback((booking: BookingResponse) => booking.id, []);
  const renderItem = useCallback(
    ({ item }: { item: BookingResponse }) => <BookingRow booking={item} role={role} />,
    [role],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="gap-3 px-4 py-3">
        <Text className="text-3xl font-bold text-foreground">{t('bookings.title')}</Text>

        {isProvider ? (
          <View className="flex-row gap-2" accessibilityRole="radiogroup">
            <Chip
              label={t('bookings.role.customer')}
              isSelected={role === 'customer'}
              onPress={() => setRole('customer')}
            />
            <Chip
              label={t('bookings.role.provider')}
              isSelected={role === 'provider'}
              onPress={() => setRole('provider')}
            />
          </View>
        ) : null}
      </View>

      {bookings.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : null}

      {bookings.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center text-base text-muted">
            {t(messageKeyForError(bookings.error))}
          </Text>
        </View>
      ) : null}

      {!bookings.isPending && !bookings.isError && bookings.bookings.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-lg font-semibold text-foreground">
            {t('bookings.empty.title')}
          </Text>
          <Text className="text-center text-base text-muted">{t('bookings.empty.body')}</Text>
        </View>
      ) : null}

      {bookings.bookings.length > 0 ? (
        <FlatList
          data={bookings.bookings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          removeClippedSubviews
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (bookings.hasNextPage && !bookings.isFetchingNextPage) {
              void bookings.fetchNextPage();
            }
          }}
          ListFooterComponent={
            bookings.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
