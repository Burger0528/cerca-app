import type { Booking, BookingRole } from '@cerca/contract';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { BookingAction } from '../../domain/bookings/ports';
import { useHasCapacity } from '../auth/use-can';
import { BookingRow } from '../components/booking-row';
import { Button } from '../components/button';
import { Chip } from '../components/chip';
import { useBookingDecision, useBookings } from '../hooks/use-bookings';
import { useLocale } from '../hooks/use-locale';
import { messageKeyForError } from '../i18n/error-message-key';

export function BookingsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const isProvider = useHasCapacity('provider');
  const [role, setRole] = useState<BookingRole>('customer');

  const list = useBookings(role);
  const decision = useBookingDecision();
  const { mutate } = decision;

  const decidingId = decision.isPending ? decision.variables.bookingId : null;

  const decide = useCallback(
    (bookingId: string, action: BookingAction, scheduledFor?: string) =>
      mutate({ bookingId, action, ...(scheduledFor === undefined ? {} : { scheduledFor }) }),
    [mutate],
  );

  const keyExtractor = useCallback((booking: Booking) => booking.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Booking }) => (
      <BookingRow
        booking={item}
        role={role}
        locale={locale}
        isBusy={item.id === decidingId}
        onDecide={decide}
      />
    ),
    [role, locale, decidingId, decide],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Text className="px-4 py-3 text-3xl font-bold text-foreground">{t('bookings.title')}</Text>

      {/* El lado de proveedor no se ofrece si la cuenta no vende: no es un filtro vacío,
          es una vista que no le corresponde. */}
      {isProvider ? (
        <View className="flex-row gap-2 px-4 pb-3">
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

      {list.isPending ? <ActivityIndicator className="py-8" /> : null}

      {list.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center text-base text-muted">
            {t(messageKeyForError(list.error))}
          </Text>
          <Button variant="secondary" onPress={() => void list.refetch()}>
            {t('common.retry')}
          </Button>
        </View>
      ) : null}

      {!list.isPending && !list.isError && list.bookings.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-lg font-semibold text-foreground">
            {t(`bookings.empty.${role}.title`)}
          </Text>
          <Text className="text-center text-base text-muted">
            {t(`bookings.empty.${role}.body`)}
          </Text>
        </View>
      ) : null}

      {list.bookings.length > 0 ? (
        <FlatList
          data={list.bookings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          removeClippedSubviews
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          ListFooterComponent={
            list.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
