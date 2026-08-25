/**
 * OWNER: Salvador.
 *
 * Una tarjeta = una parada del lector: el `accessibilityLabel` en el `Pressable` lee todo
 * junto, no cada `<Text>` por separado. Mismo patrón que `listing-card.tsx`.
 *
 * La fecha va porque `GET /bookings` no manda el título del anuncio (ver `contract-delta`):
 * sin ella, tres solicitudes seguidas son tres filas idénticas.
 *
 * El icono y su color salen del estado. Es redundante con el texto A PROPÓSITO: el color
 * solo nunca puede ser el único portador de un significado, y el icono da la lectura rápida
 * a quien recorre la lista sin leerla.
 */
import type { BookingResponse } from '@cerca/contract';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useLocale } from '../hooks/use-locale';

import { BOOKING_STATUS_STYLE } from './booking-status-style';
import { Icon } from './icon';

export interface BookingRowProps {
  readonly booking: BookingResponse;
  readonly role: 'customer' | 'provider';
}

/** Un formateador por locale, no uno por fila: construirlo es caro y el locale no cambia. */
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dateFormatterFor(locale: string): Intl.DateTimeFormat {
  const cached = dateFormatterCache.get(locale);
  if (cached !== undefined) return cached;

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  dateFormatterCache.set(locale, formatter);

  return formatter;
}

function BookingRowComponent({ booking, role }: BookingRowProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocale();

  const status = t(`bookings.status.${booking.status}`);
  const roleLabel =
    role === 'customer' ? t('bookings.row.asCustomer') : t('bookings.row.asProvider');
  const requestedAt = dateFormatterFor(locale).format(new Date(booking.requestedAt));
  const style = BOOKING_STATUS_STYLE[booking.status];

  return (
    <View className="px-4 pb-3">
      <Pressable
        className="min-h-touch flex-row items-center gap-3 rounded-card border border-subtle bg-surface-raised px-4 py-3 active:bg-surface-sunken"
        accessibilityRole="button"
        accessibilityLabel={t('bookings.a11y.row', { status, role: roleLabel, date: requestedAt })}
        onPress={() => router.push(`/bookings/${booking.id}`)}
      >
        <Icon name={style.icon} size={28} className={style.color} />

        <View className="flex-1">
          <Text className={`text-base font-semibold ${style.color}`}>{status}</Text>
          <Text className="text-sm text-muted">{roleLabel}</Text>
          <Text className="text-sm text-muted">{requestedAt}</Text>
        </View>

        <Icon name="chevron" size={20} className="text-muted" />
      </Pressable>
    </View>
  );
}

export const BookingRow = memo(BookingRowComponent);
