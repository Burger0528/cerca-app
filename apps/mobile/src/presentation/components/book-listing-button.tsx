import type { Actor, ListingDetail } from '@cerca/contract';
import { canRequestBooking } from '@cerca/contract';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useRequestBooking } from '../hooks/use-request-booking';
import { messageKeyForError } from '../i18n/error-message-key';

import { Button } from './button';

export interface BookListingButtonProps {
  readonly listing: ListingDetail;
  readonly actor: Actor;
}

export function BookListingButton({ listing, actor }: BookListingButtonProps) {
  const { t } = useTranslation();
  const booking = useRequestBooking();

  const eligibility = canRequestBooking(actor, listing);
  const isBooked = booking.isSuccess;

  return (
    <View className="gap-2">
      <Button
        isDisabled={!eligibility.ok || isBooked}
        isLoading={booking.isPending}
        onPress={() => booking.mutate({ listingId: listing.id })}
      >
        {t(bookLabel(booking.isPending, isBooked))}
      </Button>

      {/* Bloqueado por relación o por estado: el control se queda a la vista y explica la
          regla. Desaparecer dejaría al usuario preguntándose qué hizo mal. */}
      {eligibility.ok ? null : (
        <Text className="text-sm text-muted">{t(`booking.blocked.${eligibility.reason}`)}</Text>
      )}

      {booking.isError ? (
        <Text className="text-sm text-danger" accessibilityLiveRegion="polite">
          {t(messageKeyForError(booking.error))}
        </Text>
      ) : null}
    </View>
  );
}

function bookLabel(isPending: boolean, isBooked: boolean) {
  if (isPending) return 'booking.requesting' as const;
  if (isBooked) return 'booking.requested' as const;

  return 'booking.request' as const;
}
