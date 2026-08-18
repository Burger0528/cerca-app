/**
 * OWNER: Salvador.
 *
 * El esqueleto de carga, con LA FORMA de la tarjeta.
 *
 * El criterio del enunciado dice "skeleton con forma de tarjeta, no un spinner", y la razón
 * no es estética: un spinner centrado no dice cuánto viene ni dónde va a estar cada cosa, y
 * cuando llegan los datos la pantalla salta entera. Con la silueta correcta, la lista real
 * aparece exactamente donde ya estaban los bloques grises.
 */
import { View } from 'react-native';

import { listingCardHeight } from './listing-card';

/**
 * Claves propias en vez del índice del array.
 *
 * Aquí el índice sería inofensivo — la lista es estática y nunca se reordena — pero el
 * criterio del enunciado no admite excepciones, y una excepción "inofensiva" es justo lo
 * que hace que la siguiente pase desapercibida en la revisión.
 */
const PLACEHOLDER_KEYS = [
  'skeleton-1',
  'skeleton-2',
  'skeleton-3',
  'skeleton-4',
  'skeleton-5',
  'skeleton-6',
  'skeleton-7',
  'skeleton-8',
] as const;

/** Misma ranura y misma caja que `ListingCard`: la silueta solo sirve si encaja al píxel. */
function SkeletonRow({ height }: { height: number }) {
  return (
    <View style={{ height }} className="px-4 pb-3">
      <View className="flex-1 justify-center gap-2 rounded-card border border-subtle bg-surface-raised px-4">
        <View className="h-4 w-3/4 rounded bg-surface-sunken" />
        <View className="h-5 w-2/5 rounded bg-surface-sunken" />
        <View className="h-3 w-1/2 rounded bg-surface-sunken" />
      </View>
    </View>
  );
}

export interface ListingListSkeletonProps {
  readonly fontScale: number;
}

export function ListingListSkeleton({ fontScale }: ListingListSkeletonProps) {
  const height = listingCardHeight(fontScale);

  return (
    <View
      // Un solo nodo accesible para todo el bloque: si no, el lector de pantalla recita
      // ocho filas vacías.
      accessible
      accessibilityRole="progressbar"
      className="flex-1"
    >
      {PLACEHOLDER_KEYS.map((key) => (
        <SkeletonRow key={key} height={height} />
      ))}
    </View>
  );
}
