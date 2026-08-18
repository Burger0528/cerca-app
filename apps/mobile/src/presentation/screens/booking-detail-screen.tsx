/**
 * OWNER: Salvador.
 *
 * `scheduledFor` al aceptar se fija a "ahora + 1 hora": no hay selector de fecha en este
 * bloque, es una simplificación de alcance, no un límite del contrato.
 *
 * Las acciones se separan por lado: cliente cancela, proveedor acepta/rechaza/completa.
 * Ninguna comprobación de aquí protege nada -- es UX, la autorización real la hace el
 * backend con el 403 correspondiente si se fuerza.
 */
import { canReviewBooking } from '@cerca/contract';
import type { BookingResponse } from '@cerca/contract';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActor } from '../auth/use-can';
import { BookingStatusExplanation } from '../components/booking-status-explanation';
import { BOOKING_STATUS_STYLE } from '../components/booking-status-style';
import { Button } from '../components/button';
import { DeclineButtons } from '../components/decline-buttons';
import { Icon } from '../components/icon';
import { ReviewForm } from '../components/review-form';
import {
  useAcceptBooking,
  useCancelBooking,
  useCompleteBooking,
  useDeclineBooking,
} from '../hooks/use-booking-actions';
import { useBookingDetail } from '../hooks/use-booking-detail';
import { useWriteReview } from '../hooks/use-write-review';
import { messageKeyForError } from '../i18n/error-message-key';

const ONE_HOUR_MS = 60 * 60 * 1000;

export function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const detail = useBookingDetail(id);
  const actor = useActor();

  const accept = useAcceptBooking();
  const decline = useDeclineBooking();
  const complete = useCompleteBooking();
  const cancel = useCancelBooking();
  const review = useWriteReview();

  if (detail.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }

  if (detail.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface px-8">
        <Text className="text-center text-base text-muted">
          {t(messageKeyForError(detail.error))}
        </Text>
        <Button variant="secondary" onPress={() => void detail.refetch()}>
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  const booking: BookingResponse = detail.data;
  const busy = accept.isPending || decline.isPending || complete.isPending || cancel.isPending;
  const isCustomer = actor !== null && actor.id === booking.customerId;
  const eligibility =
    actor === null
      ? ({ ok: false, reason: 'not_your_booking' } as const)
      : canReviewBooking(actor, booking, new Date());

  return (
    <SafeAreaView className="flex-1 gap-3 bg-surface px-4 py-4" edges={['top']}>
      {/* El estado manda en esta pantalla: es lo primero que se viene a mirar. */}
      <View className="items-center gap-2 rounded-card border border-subtle bg-surface-raised px-4 py-6">
        <Icon
          name={BOOKING_STATUS_STYLE[booking.status].icon}
          size={48}
          className={BOOKING_STATUS_STYLE[booking.status].color}
        />

        <Text className={`text-2xl font-bold ${BOOKING_STATUS_STYLE[booking.status].color}`}>
          {t(`bookings.status.${booking.status}`)}
        </Text>

        <BookingStatusExplanation status={booking.status} />
      </View>

      {isCustomer ? (
        booking.status === 'requested' || booking.status === 'accepted' ? (
          <Button
            variant="secondary"
            isLoading={cancel.isPending}
            isDisabled={busy}
            onPress={() => cancel.mutate(booking.id)}
          >
            {t('bookings.actions.cancel')}
          </Button>
        ) : null
      ) : (
        <>
          {booking.status === 'requested' ? (
            <View className="gap-2">
              <Button
                isLoading={accept.isPending}
                isDisabled={busy}
                onPress={() =>
                  accept.mutate({
                    bookingId: booking.id,
                    request: { scheduledFor: new Date(Date.now() + ONE_HOUR_MS).toISOString() },
                  })
                }
              >
                {t('bookings.actions.accept')}
              </Button>
              <DeclineButtons
                isBusy={busy}
                isLoading={decline.isPending}
                onDecline={(reason) =>
                  decline.mutate({ bookingId: booking.id, request: { reason } })
                }
              />
            </View>
          ) : null}

          {booking.status === 'accepted' ? (
            <Button
              isLoading={complete.isPending}
              isDisabled={busy}
              onPress={() => complete.mutate(booking.id)}
            >
              {t('bookings.actions.complete')}
            </Button>
          ) : null}
        </>
      )}

      {isCustomer ? (
        <ReviewForm
          eligibility={eligibility}
          isSubmitting={review.isPending}
          isSuccess={review.isSuccess}
          onSubmit={(rating, body) =>
            review.mutate({ bookingId: booking.id, request: { rating, body } })
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
