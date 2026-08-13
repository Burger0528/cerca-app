import type { Actor, ModerateReviewAction, Review } from '@cerca/contract';
import { canModerateReview } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from './button';

export interface ReviewRowProps {
  readonly review: Review;
  readonly actor: Actor | null;
  readonly locale: string;
  readonly isBusy: boolean;
  readonly onModerate: (reviewId: string, action: ModerateReviewAction) => void;
}

/**
 * Sin nombre de quien la escribe: la respuesta trae `authorId` y nada más, y el `Actor`
 * tampoco lleva nombre. Ver el punto 2 de `docs/contract-delta.md`.
 *
 * Una reseña = UNA parada del lector de pantalla. Sin `accessible`, recorrer veinte
 * reseñas son sesenta paradas.
 */
function ReviewRowComponent({ review, actor, locale, isBusy, onModerate }: ReviewRowProps) {
  const { t } = useTranslation();

  const rating = t('listing.reviews.rating', { rating: review.rating });
  const date = new Date(review.createdAt).toLocaleDateString(locale);
  const moderation = actor === null ? null : canModerateReview(actor, review);
  const isHidden = moderation === null || (!moderation.ok && moderation.kind === 'hidden');

  // Se saca el motivo aquí y no en el JSX: un booleano no estrecha la unión, y el tipo de
  // `reason` acabaría incluyendo el caso oculto, que no tiene texto que enseñar.
  const disabledReason =
    moderation !== null && !moderation.ok && moderation.kind === 'disabled'
      ? moderation.reason
      : null;

  return (
    <View
      className="gap-1 border-b border-subtle px-4 py-3"
      accessible
      accessibilityLabel={`${rating}. ${review.body}. ${date}.`}
    >
      <Text className="text-sm font-semibold text-foreground">{rating}</Text>
      <Text className="text-base text-foreground">{review.body}</Text>
      <Text className="text-xs text-muted">{date}</Text>

      {isHidden ? null : (
        <View className="gap-1 pt-1">
          <View className="flex-row flex-wrap gap-2">
            <Button
              variant="danger"
              isDisabled={moderation.ok !== true}
              isLoading={isBusy}
              onPress={() => onModerate(review.id, 'remove')}
            >
              {t('moderation.reviews.action.remove')}
            </Button>

            <Button
              variant="secondary"
              isDisabled={moderation.ok !== true}
              isLoading={isBusy}
              onPress={() => onModerate(review.id, 'keep')}
            >
              {t('moderation.reviews.action.keep')}
            </Button>
          </View>

          {/* Moderar la propia reseña se deshabilita Y se explica: es una regla, no un fallo. */}
          {disabledReason === null ? null : (
            <Text className="text-sm text-muted">
              {t(`moderation.reviews.blocked.${disabledReason}`)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export const ReviewRow = memo(ReviewRowComponent);
