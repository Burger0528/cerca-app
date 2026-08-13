import type { Review } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export interface ReviewRowProps {
  readonly review: Review;
  readonly locale: string;
}

/**
 * Sin nombre de quien la escribe: la respuesta trae `authorId` y nada más, y el `Actor`
 * tampoco lleva nombre. Ver el punto 2 de `docs/contract-delta.md`.
 *
 * Una reseña = UNA parada del lector de pantalla. Sin `accessible`, recorrer veinte
 * reseñas son sesenta paradas.
 */
function ReviewRowComponent({ review, locale }: ReviewRowProps) {
  const { t } = useTranslation();

  const rating = t('listing.reviews.rating', { rating: review.rating });
  const date = new Date(review.createdAt).toLocaleDateString(locale);

  return (
    <View
      className="gap-1 border-b border-subtle px-4 py-3"
      accessible
      accessibilityLabel={`${rating}. ${review.body}. ${date}.`}
    >
      <Text className="text-sm font-semibold text-foreground">{rating}</Text>
      <Text className="text-base text-foreground">{review.body}</Text>
      <Text className="text-xs text-muted">{date}</Text>
    </View>
  );
}

export const ReviewRow = memo(ReviewRowComponent);
