/**
 * OWNER: Salvador.
 *
 * `memo`: en una lista con muchas reseñas, si el padre se re-renderiza (ej. al llegar la
 * siguiente página), las filas que no cambiaron no se vuelven a pintar.
 */
import type { ReviewResponse } from '@cerca/contract';
import { memo } from 'react';
import { Text, View } from 'react-native';

export interface ReviewRowProps {
  readonly review: ReviewResponse;
}

function ReviewRowComponent({ review }: ReviewRowProps) {
  return (
    <View
      className="gap-1 border-b border-subtle bg-surface px-4 py-3"
      accessibilityRole="text"
      accessibilityLabel={`${review.rating} / 5. ${review.body}`}
    >
      <Text className="text-sm font-semibold text-foreground">{review.rating} / 5</Text>
      <Text className="text-sm text-muted">{review.body}</Text>
    </View>
  );
}

export const ReviewRow = memo(ReviewRowComponent);
