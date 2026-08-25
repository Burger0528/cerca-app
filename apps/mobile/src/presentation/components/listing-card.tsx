/**
 * OWNER: Salvador.
 *
 * La tarjeta de resultado (US-07), con sus tres niveles de jerarquía: título en semibold,
 * precio en su propio nivel tipográfico, y valoración y distancia atenuadas con su icono.
 *
 * Va envuelta en `memo` y su altura es FIJA y calculable desde fuera: las dos cosas son lo
 * que permite que la lista de 5.000 tarjetas del criterio de aceptación no baje de 55 FPS.
 *
 * La tarjeta flota sobre el fondo en vez de ser una fila a sangre con una línea debajo. Eso
 * mete un hueco entre tarjetas, y ese hueco ENTRA en la altura del hueco de lista: la
 * `View` de fuera es la ranura que mide `getItemLayout`, y la `Pressable` de dentro es lo
 * que se ve. Separarlas es lo que permite maquetar sin mentirle a la lista.
 *
 * SIN FOTO, y no por gusto: `listingSearchItemSchema` del backend no manda imágenes. El
 * día que las mande hará falta una librería de imagen con caché en disco, que hoy no está
 * instalada porque no había nada que pintar. Punto 4 de `docs/contract-delta.md`.
 */
import type { Listing } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Icon } from './icon';
import { distanceLabel, priceFromLabel, ratingLabel } from './listing-labels';
import { StatusBadge } from './status-badge';

/**
 * Tope de escala tipográfica de la tarjeta.
 *
 * La accesibilidad del sistema llega al 200 %, y a esa escala nada de alto fijo sobrevive.
 * Se limita a 1,3 y se reserva sitio para esa escala: el texto crece de verdad, pero la
 * altura sigue siendo predecible y `getItemLayout` sigue diciendo la verdad.
 */
export const MAX_FONT_SCALE = 1.3;

/** `py-3` arriba y abajo, dentro de la tarjeta. */
const CARD_PADDING = 24;
/** `pb-3`: el aire entre una tarjeta y la siguiente. */
const CARD_GAP = 12;
/** Alturas de línea de `text-base`, `text-lg` y `text-sm`, más los dos `gap-1`. */
const TEXT_BLOCK = 20 + 28 + 20 + 8;

/** Tamaño de los iconos de la línea atenuada: por debajo de su altura de línea (20). */
const META_ICON = 14;

/**
 * La altura EXACTA de una ranura de lista para una escala de fuente dada.
 *
 * La usan la tarjeta y el `getItemLayout` de la lista, para que no puedan discrepar. Si
 * discreparan, el scroll saltaría: la lista calcularía posiciones que no coinciden con lo
 * que hay pintado.
 */
export function listingCardHeight(fontScale: number): number {
  const scale = Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE);

  return Math.ceil(TEXT_BLOCK * scale) + CARD_PADDING + CARD_GAP;
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
    <View style={{ height }} className="px-4 pb-3">
      <Pressable
        // `active:` es el feedback al pulsar que pide el criterio de aceptación. En una lista
        // sin él, la tarjeta parece que no ha recibido el toque y la gente pulsa dos veces.
        className="flex-1 justify-center gap-1 rounded-card border border-subtle bg-surface-raised px-4 active:bg-surface-sunken"
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

        <View className="flex-row items-center gap-1">
          <Icon name="rating" size={META_ICON} className="text-muted" />
          <Text className="text-sm text-muted" maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {rating}
          </Text>

          <Icon name="distance" size={META_ICON} className="ml-2 text-muted" />
          <Text className="text-sm text-muted" maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {distance}
          </Text>
        </View>
      </Pressable>
    </View>
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
