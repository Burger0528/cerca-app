/**
 * OWNER: Salvador.
 *
 * El estado de un anuncio, con TEXTO.
 *
 * Criterio del enunciado: "un anuncio pausado se distingue por badge con texto, no solo
 * por gris". Distinguir por color a secas deja fuera a quien no distingue esos dos colores,
 * y en una lista en escala de grises no queda ninguna diferencia.
 */
import type { ListingStatus } from '@cerca/contract';
import { cva } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { cn } from './cn';

const badge = cva('self-start rounded-full px-2 py-0.5', {
  variants: {
    status: {
      draft: 'bg-surface-sunken',
      published: 'bg-status-published-surface',
      paused: 'bg-status-paused-surface',
      under_review: 'bg-status-paused-surface',
      removed: 'bg-status-removed-surface',
    },
  },
});

const badgeLabel = cva('text-xs font-semibold', {
  variants: {
    status: {
      draft: 'text-muted',
      published: 'text-status-published',
      paused: 'text-status-paused',
      under_review: 'text-status-paused',
      removed: 'text-status-removed',
    },
  },
});

export interface StatusBadgeProps {
  readonly status: ListingStatus;
  readonly className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <View className={cn(badge({ status }), className)}>
      <Text
        className={badgeLabel({ status })}
        // El badge tiene alto fijo dentro de una tarjeta de alto fijo. Sin tope, una fuente
        // del sistema al 200 % lo desborda y parte la lista.
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
      >
        {t(`listing.status.${status}`)}
      </Text>
    </View>
  );
}
