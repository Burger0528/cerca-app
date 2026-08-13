/**
 * OWNER: Salvador.
 *
 * US-05 (parte de precio/distancia) y US-07 en el detalle. Los mismos cuatro estados que
 * `search-screen`, más un quinto que no es un error: el anuncio retirado o inexistente
 * (404), que se enseña como su propia salida, no como "algo ha salido mal".
 *
 * `distanceMeters` llega por parámetro de ruta, no del backend: `listingDetailSchema` no
 * trae distancia (ver `packages/contract/src/schemas/listing.ts`). La tarjeta de búsqueda
 * ya la conoce en el momento de navegar, y no cambia en los segundos entre lista y
 * detalle, así que no hace falta pedirla de nuevo. Si el detalle se abre por deep link
 * (sin pasar por la lista), no hay distancia que enseñar y la línea se omite: el dato no
 * se inventa en el cliente.
 *
 * La lista de reseñas al final va virtualizada (`FlatList`), con `keyExtractor` estable y
 * `renderItem`/`ReviewRow` memoizados -- una fila que no cambió no se vuelve a pintar
 * cuando llega la siguiente página.
 */
import { formatDistance } from '@cerca/contract';
import type { ReviewResponse } from '@cerca/contract';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Share, Text, View } from 'react-native';

import {
  ContractViolationError,
  HttpError,
  NetworkError,
  TimeoutError,
} from '../../domain/errors/app-error';
import { useActor } from '../auth/use-can';
import { Button } from '../components/button';
import { pricingLabel, ratingLabel } from '../components/listing-labels';
import { ReviewRow } from '../components/review-row';
import { StatusBadge } from '../components/status-badge';
import { useListingDetail } from '../hooks/use-edit-listing';
import { useListingReviews } from '../hooks/use-listing-reviews';
import { useLocale } from '../hooks/use-locale';
import { useRequestBooking } from '../hooks/use-request-booking';
import type { FeedbackMessageKey } from '../i18n/message-keys';

export function ListingDetailScreen() {
  const { id, distanceMeters } = useLocalSearchParams<{
    id: string;
    distanceMeters?: string;
  }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const detail = useListingDetail(id);
  const actor = useActor();
  const booking = useRequestBooking();
  const reviews = useListingReviews(id);

  const keyExtractor = useCallback((review: ReviewResponse) => review.id, []);
  const renderReview = useCallback(
    ({ item }: { item: ReviewResponse }) => <ReviewRow review={item} />,
    [],
  );

  if (detail.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }

  if (detail.isError) {
    if (detail.error instanceof HttpError && detail.error.status === 404) {
      return (
        <View className="flex-1 items-center justify-center gap-2 bg-surface px-8">
          <Text className="text-center text-lg font-semibold text-foreground">
            {t('listing.detail.notFound.title')}
          </Text>
          <Text className="text-center text-base text-muted">
            {t('listing.detail.notFound.body')}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface px-8">
        <Text className="text-center text-base text-muted">{t(messageKeyFor(detail.error))}</Text>
        <Button variant="secondary" onPress={() => void detail.refetch()}>
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  const listing = detail.data;
  const price = pricingLabel(listing.pricing, locale, t);
  const rating = ratingLabel(listing.ratingAvg, listing.ratingCount, locale, t);
  const distance =
    distanceMeters === undefined
      ? null
      : formatDistance({ meters: Number(distanceMeters) }, locale);
  const isOwnListing = actor !== null && actor.id === listing.ownerId;

  return (
    <View className="flex-1 gap-3 bg-surface px-4 py-4">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-xl font-semibold text-foreground">{listing.title}</Text>
        {listing.status === 'published' ? null : <StatusBadge status={listing.status} />}
      </View>

      <Text className="text-2xl font-bold text-foreground">{price}</Text>

      <Text className="text-base text-muted">
        {distance === null ? rating : `${rating} · ${distance}`}
      </Text>

      <Text className="text-base text-foreground">{listing.description}</Text>

      <Button
        variant="secondary"
        onPress={() => {
          void Share.share({
            message: t('listing.detail.shareMessage', {
              title: listing.title,
              url: `cerca://listing/${listing.id}`,
            }),
          });
        }}
      >
        {t('listing.detail.share')}
      </Button>

      <Button
        isDisabled={isOwnListing || booking.isSuccess}
        isLoading={booking.isPending}
        onPress={() => booking.mutate({ listingId: listing.id })}
      >
        {booking.isPending ? t('listing.detail.booking') : t('listing.detail.book')}
      </Button>

      {isOwnListing ? (
        <Text className="text-center text-sm text-muted">{t('listing.detail.bookOwnListing')}</Text>
      ) : null}

      {booking.isSuccess ? (
        <Text className="text-center text-sm text-muted" accessibilityLiveRegion="polite">
          {t('listing.detail.bookSuccess')}
        </Text>
      ) : null}

      {booking.isError ? (
        <Text className="text-center text-sm text-danger" accessibilityLiveRegion="polite">
          {t(messageKeyFor(booking.error))}
        </Text>
      ) : null}

      <FlatList
        data={reviews.reviews}
        keyExtractor={keyExtractor}
        renderItem={renderReview}
        removeClippedSubviews
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
        }}
        ListFooterComponent={
          reviews.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
        }
      />
    </View>
  );
}

function messageKeyFor(error: unknown): FeedbackMessageKey {
  if (error instanceof NetworkError) return 'errors.network';
  if (error instanceof TimeoutError) return 'errors.timeout';
  if (error instanceof ContractViolationError) return 'errors.contract';
  if (error instanceof HttpError) return error.status >= 500 ? 'errors.server' : 'errors.unknown';

  return 'errors.unknown';
}
