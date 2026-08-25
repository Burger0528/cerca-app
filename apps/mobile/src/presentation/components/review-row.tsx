/**
 * OWNER: Salvador.
 *
 * `memo`: en una lista con muchas reseñas, si el padre se re-renderiza (ej. al llegar la
 * siguiente página), las filas que no cambiaron no se vuelven a pintar.
 *
 * La fila NO decide quién puede retirar una reseña: recibe `onRemove` o no lo recibe. El
 * permiso lo mira la pantalla, que es quien conoce al actor.
 */
import type { ReviewResponse } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from './button';

export interface ReviewRowProps {
  readonly review: ReviewResponse;
  /** Solo llega si el actor puede moderar. Sin él, la fila no pinta ninguna acción. */
  readonly onRemove?: (reviewId: string) => void;
  readonly isRemoving?: boolean;
}

function ReviewRowComponent({ review, onRemove, isRemoving = false }: ReviewRowProps) {
  const { t } = useTranslation();

  return (
    <View
      className="gap-1 border-b border-subtle bg-surface px-4 py-3"
      accessibilityRole="text"
      accessibilityLabel={`${review.rating} / 5. ${review.body}`}
    >
      <Text className="text-sm font-semibold text-foreground">{review.rating} / 5</Text>
      <Text className="text-sm text-muted">{review.body}</Text>

      {onRemove === undefined ? null : (
        <Button
          variant="ghost"
          className="self-start px-0"
          isLoading={isRemoving}
          onPress={() => onRemove(review.id)}
        >
          {t('moderation.review.remove')}
        </Button>
      )}
    </View>
  );
}

export const ReviewRow = memo(ReviewRowComponent);
