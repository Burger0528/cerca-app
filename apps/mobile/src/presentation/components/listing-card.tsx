/**
 * OWNER: Salvador.
 *
 * La tarjeta de resultado (US-07), con sus tres niveles de jerarquía: título en semibold,
 * precio en su propio nivel tipográfico, y valoración y distancia atenuadas.
 *
 * Va envuelta en `memo` y su altura es FIJA y calculable desde fuera: las dos cosas son lo
 * que permite que la lista de 5.000 tarjetas del criterio de aceptación no baje de 55 FPS.
 *
 * SIN FOTO, y no por gusto: `listingSearchItemSchema` del backend no manda imágenes. En
 * cuanto las mande, aquí entra `expo-image` con `cachePolicy: "memory-disk"` y blurhash.
 * Punto 4 de `docs/contract-delta.md`.
 */
import type { Listing } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { distanceLabel, priceFromLabel, ratingLabel } from './listing-labels';
import { StatusBadge } from './status-badge';

/**
 * Tope de escala tipográfica de la tarjeta.
 *
 * La accesibilidad del sistema llega al 200 %, y a esa escala nada de alto fijo sobrevive.
 * Se limita a 1,3 y se reserva sitio para esa escala: el texto crece de verdad, pero la
 * altura sigue siendo predecible y `getItemLayout` sigue diciendo la verdad. Por encima de
 * eso la lista necesitaría otra maqueta, y eso es sprint 2.
 */
export const MAX_FONT_SCALE = 1.3;

const VERTICAL_PADDING = 24;
const SEPARATOR = 1;
/** Alturas de línea de `text-base`, `text-lg` y `text-sm`, más los dos `gap-1`. */
const TEXT_BLOCK = 20 + 28 + 20 + 8;

/**
 * La altura EXACTA de una tarjeta para una escala de fuente dada.
 *
 * La usan la tarjeta y el `getItemLayout` de la lista, para que no puedan discrepar. Si
 * discreparan, el scroll saltaría: la lista calcularía posiciones que no coinciden con lo
 * que hay pintado.
 */
export function listingCardHeight(fontScale: number): number {
  const scale = Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE);

  return Math.ceil(TEXT_BLOCK * scale) + VERTICAL_PADDING + SEPARATOR;
}

export interface ListingCardProps {
  readonly listing: Listing;
  readonly locale: string;
  readonly height: number;
  readonly onPress?: (listing: Listing) => void;
}

function ListingCardComponent({ listing, locale, height, onPress }: ListingCardProps) {
  const { t } = useTranslation();

  const price = priceFromLabel(listing.priceFrom, locale, t);
  const rating = ratingLabel(listing.ratingAvg, listing.ratingCount, locale, t);
  const distance = distanceLabel(listing.distanceMeters, locale);

  return (
    <Pressable
      // `active:` es el feedback al pulsar que pide el criterio de aceptación. En una lista
      // sin él, la tarjeta parece que no ha recibido el toque y la gente pulsa dos veces.
      className="justify-center gap-1 border-b border-subtle bg-surface px-4 active:bg-surface-raised"
      style={{ height }}
      accessibilityRole="button"
      accessibilityLabel={t('listing.a11y.card', {
        title: listing.title,
        price,
        rating,
        distance,
      })}
      onPress={() => onPress?.(listing)}
    >
      <View className="flex-row items-center gap-2">
        <Text
          className="flex-1 text-base font-semibold text-foreground"
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
        >
          {listing.title}
        </Text>

        {listing.status === 'published' ? null : <StatusBadge status={listing.status} />}
      </View>

      <Text
        className="text-lg font-bold text-foreground"
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
      >
        {price}
      </Text>

      <Text className="text-sm text-muted" numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {`${rating} · ${distance}`}
      </Text>
    </Pressable>
  );
}

/**
 * `memo` con comparación por identidad de `listing`.
 *
 * `useListingSearch` aplana las páginas con el `select` de TanStack Query, que aplica
 * structural sharing: los objetos que no han cambiado conservan su referencia entre
 * fetches. Con eso, teclear en el buscador no vuelve a renderizar las tarjetas que ya
 * estaban — que es exactamente lo que mide el `console.count("ListingCard")` del criterio.
 */
export const ListingCard = memo(ListingCardComponent);
