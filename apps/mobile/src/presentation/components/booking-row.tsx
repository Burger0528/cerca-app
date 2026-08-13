/**
 * OWNER: Salvador.
 *
 * Una tarjeta = una parada del lector: el `accessibilityLabel` en el `Pressable` lee todo
 * junto, no cada `<Text>` por separado. Mismo patrón que `listing-card.tsx`.
 *
 * La fecha va porque `GET /bookings` no manda el título del anuncio (ver `contract-delta`):
 * sin ella, tres solicitudes seguidas son tres filas idénticas.
 */
import type { BookingResponse } from '@cerca/contract';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useLocale } from '../hooks/use-locale';

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

  return (
    <Pressable
      className="min-h-touch gap-1 border-b border-subtle bg-surface px-4 py-3 active:bg-surface-raised"
      accessibilityRole="button"
      accessibilityLabel={t('bookings.a11y.row', { status, role: roleLabel, date: requestedAt })}
      onPress={() => router.push(`/bookings/${booking.id}`)}
    >
      <View>
        <Text className="text-base font-semibold text-foreground">{status}</Text>
        <Text className="text-sm text-muted">{roleLabel}</Text>
        <Text className="text-sm text-muted">{requestedAt}</Text>
      </View>
    </Pressable>
  );
}

export const BookingRow = memo(BookingRowComponent);
