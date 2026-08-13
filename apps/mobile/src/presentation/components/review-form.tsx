/**
 * OWNER: Salvador.
 *
 * El botón bloqueado se deshabilita y explica -- nunca desaparece. Un botón que se esfuma
 * deja al usuario preguntándose qué pasó.
 */
import type { ReviewEligibility } from '@cerca/contract';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { Button } from './button';
import { cn } from './cn';

export interface ReviewFormProps {
  readonly eligibility: ReviewEligibility;
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly onSubmit: (rating: number, body: string) => void;
}

export function ReviewForm({ eligibility, isSubmitting, isSuccess, onSubmit }: ReviewFormProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  if (isSuccess) {
    return (
      <Text className="text-center text-sm text-muted" accessibilityLiveRegion="polite">
        {t('bookings.review.success')}
      </Text>
    );
  }

  if (!eligibility.ok) {
    return (
      <Text className="text-center text-sm text-muted">
        {t(`bookings.review.blocked.${eligibility.reason}`)}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted">{t('bookings.review.rating')}</Text>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <Button
            key={value}
            variant={value === rating ? 'primary' : 'secondary'}
            onPress={() => setRating(value)}
          >
            {String(value)}
          </Button>
        ))}
      </View>

      <TextInput
        className={cn(
          'min-h-touch rounded-xl border border-subtle px-4 py-3 text-base text-foreground',
        )}
        placeholder={t('bookings.review.bodyPlaceholder')}
        value={body}
        onChangeText={setBody}
        multiline
        accessibilityLabel={t('bookings.review.rating')}
      />

      <Button
        isLoading={isSubmitting}
        isDisabled={body.trim().length === 0}
        onPress={() => onSubmit(rating, body.trim())}
      >
        {t('bookings.review.submit')}
      </Button>
    </View>
  );
}
