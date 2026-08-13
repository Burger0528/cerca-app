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
 */
import type { ModerateReviewAction, Review } from '@cerca/contract';
import { formatDistance } from '@cerca/contract';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HttpError } from '../../domain/errors/app-error';
import { useActor } from '../auth/use-can';
import { BookListingButton } from '../components/book-listing-button';
import { Button } from '../components/button';
import { pricingLabel, ratingLabel } from '../components/listing-labels';
import { ReviewRow } from '../components/review-row';
import { StatusBadge } from '../components/status-badge';
import { useListingDetail } from '../hooks/use-edit-listing';
import { useListingReviews } from '../hooks/use-listing-reviews';
import { useLocale } from '../hooks/use-locale';
import { useModerateReview } from '../hooks/use-moderate-review';
import { messageKeyForError } from '../i18n/error-message-key';

export function ListingDetailScreen() {
  const { id, distanceMeters } = useLocalSearchParams<{
    id: string;
    distanceMeters?: string;
  }>();
  const { t } = useTranslation();
  const locale = useLocale();
  const actor = useActor();
  const detail = useListingDetail(id);
  const reviews = useListingReviews(id);

  const moderation = useModerateReview(id);
  const { mutate: moderateReview } = moderation;
  const moderatingId = moderation.isPending ? moderation.variables.reviewId : null;

  const onModerate = useCallback(
    (reviewId: string, action: ModerateReviewAction) => moderateReview({ reviewId, action }),
    [moderateReview],
  );

  const keyExtractor = useCallback((review: Review) => review.id, []);

  const renderReview = useCallback(
    ({ item }: { item: Review }) => (
      <ReviewRow
        review={item}
        actor={actor}
        locale={locale}
        isBusy={item.id === moderatingId}
        onModerate={onModerate}
      />
    ),
    [actor, locale, moderatingId, onModerate],
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
        <Text className="text-center text-base text-muted">
          {t(messageKeyForError(detail.error))}
        </Text>
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

  // El detalle ES la lista de reseñas, con el anuncio de cabecera. Así las reseñas se
  // virtualizan sin anidar una lista dentro de un scroll, que es lo que rompe el reciclado.
  const header = (
    <View className="gap-3 px-4 py-4">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-xl font-semibold text-foreground">{listing.title}</Text>
        {listing.status === 'published' ? null : <StatusBadge status={listing.status} />}
      </View>

      <Text className="text-2xl font-bold text-foreground">{price}</Text>

      <Text className="text-base text-muted">
        {distance === null ? rating : `${rating} · ${distance}`}
      </Text>

      <Text className="text-base text-foreground">{listing.description}</Text>

      {actor === null ? null : <BookListingButton listing={listing} actor={actor} />}

      <Button
        variant="secondary"
        className="self-start"
        onPress={() => {
          void Share.share({
            message: t('listing.detail.shareMessage', {
              title: listing.title,
              // Construido por expo-linking a partir del esquema y de la RUTA REAL. Escrito
              // a mano era `cerca://listing/…`, en singular, y no abría nada.
              url: Linking.createURL(`/listings/${listing.id}`),
            }),
          });
        }}
      >
        {t('listing.detail.share')}
      </Button>

      <Text className="pt-2 text-lg font-semibold text-foreground">
        {t('listing.reviews.title', { count: listing.ratingCount })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <FlatList
        data={reviews.reviews}
        keyExtractor={keyExtractor}
        renderItem={renderReview}
        ListHeaderComponent={header}
        removeClippedSubviews
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
        }}
        ListFooterComponent={
          reviews.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
        }
      />
    </SafeAreaView>
  );
}
