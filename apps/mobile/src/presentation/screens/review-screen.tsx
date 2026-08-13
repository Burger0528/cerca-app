import type { WriteReviewRequest } from '@cerca/contract';
import { REVIEW_RATING_MAX, canReviewBooking, writeReviewSchema } from '@cerca/contract';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnnounceFirstError } from '../a11y/use-announce-first-error';
import { useActor } from '../auth/use-can';
import { Button } from '../components/button';
import { Chip } from '../components/chip';
import { TextField } from '../components/text-field';
import { reviewBlockedReasonOf, useBookingDetail, useWriteReview } from '../hooks/use-write-review';
import { messageKeyForError } from '../i18n/error-message-key';
import { useServices } from '../providers/services-provider';

const RATINGS = Array.from({ length: REVIEW_RATING_MAX }, (_, index) => index + 1);

export function ReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const actor = useActor();
  const { now } = useServices();

  const booking = useBookingDetail(id);
  const review = useWriteReview(id);

  const form = useForm<WriteReviewRequest>({
    resolver: zodResolver(writeReviewSchema),
    defaultValues: { rating: 5, body: '' },
    mode: 'onBlur',
  });

  useAnnounceFirstError(form.formState.errors, form.formState.submitCount);

  const submit = form.handleSubmit(async (values) => {
    await review.mutateAsync(values);
    router.back();
  });

  // El motivo que manda el servidor gana al del cliente: es la autoridad, y puede saber algo
  // que la app no —una reseña creada desde otro dispositivo hace un segundo—.
  const eligibility =
    actor === null || booking.data === undefined
      ? null
      : canReviewBooking(actor, booking.data, new Date(now()));

  const serverReason = reviewBlockedReasonOf(review.error);
  const blockedReason = serverReason ?? (eligibility?.ok === false ? eligibility.reason : null);
  const rating = useWatch({ control: form.control, name: 'rating' });

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="gap-4 px-6 py-4">
        <Text className="text-3xl font-bold text-foreground">{t('review.title')}</Text>

        {booking.isPending ? <ActivityIndicator /> : null}

        {booking.data === undefined ? null : (
          <>
            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t('review.rating')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {RATINGS.map((value) => (
                  <Chip
                    key={value}
                    label={String(value)}
                    isSelected={rating === value}
                    onPress={() => form.setValue('rating', value, { shouldValidate: true })}
                  />
                ))}
              </View>
            </View>

            <TextField
              control={form.control}
              name="body"
              label={t('review.body')}
              placeholder={t('review.bodyPlaceholder')}
              multiline
            />

            {/* Bloqueado: el botón se queda a la vista y EXPLICA la regla. Si desapareciera,
                quien ya reseñó no sabría por qué no puede volver a hacerlo. */}
            <Button
              isDisabled={blockedReason !== null}
              isLoading={form.formState.isSubmitting}
              onPress={() => void submit()}
            >
              {form.formState.isSubmitting ? t('review.sending') : t('review.submit')}
            </Button>

            {blockedReason === null ? null : (
              <Text className="text-base text-muted" accessibilityLiveRegion="polite">
                {t(`review.blocked.${blockedReason}`)}
              </Text>
            )}

            {review.isError && blockedReason === null ? (
              <Text className="text-base text-danger" accessibilityLiveRegion="polite">
                {t(messageKeyForError(review.error))}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
