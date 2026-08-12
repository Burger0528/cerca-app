import type { ListingStatusAction, MyListing } from '@cerca/contract';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActor } from '../auth/use-can';
import { Button } from '../components/button';
import { ListingListSkeleton } from '../components/listing-card-skeleton';
import { MyListingRow } from '../components/my-listing-row';
import { useListingStatus } from '../hooks/use-listing-status';
import { useLocale } from '../hooks/use-locale';
import { useMyListings } from '../hooks/use-my-listings';
import { messageKeyForError } from '../i18n/error-message-key';

export function MyListingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const actor = useActor();
  const locale = useLocale();
  const { fontScale } = useWindowDimensions();

  const mine = useMyListings();
  const status = useListingStatus();
  const { mutate } = status;

  const changingId = status.isPending ? status.variables.listingId : null;

  const changeStatus = useCallback(
    (listingId: string, action: ListingStatusAction) => mutate({ listingId, action }),
    [mutate],
  );

  const keyExtractor = useCallback((listing: MyListing) => listing.id, []);

  const editListing = useCallback(
    (listingId: string) => router.push(`/listings/${listingId}/edit`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: MyListing }) => (
      <MyListingRow
        listing={item}
        actor={actor}
        locale={locale}
        isBusy={item.id === changingId}
        onChangeStatus={changeStatus}
        onEdit={editListing}
      />
    ),
    [actor, locale, changingId, changeStatus, editListing],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center justify-between gap-3 px-4 py-3">
        <Text className="flex-1 text-3xl font-bold text-foreground">
          {t('provider.myListings.title')}
        </Text>

        <Button variant="secondary" onPress={() => router.push('/listings/new')}>
          {t('provider.myListings.create')}
        </Button>
      </View>

      {mine.isPending ? <ListingListSkeleton fontScale={fontScale} /> : null}

      {mine.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center text-base text-muted">
            {t(messageKeyForError(mine.error))}
          </Text>
          <Button variant="secondary" onPress={() => void mine.refetch()}>
            {t('common.retry')}
          </Button>
        </View>
      ) : null}

      {!mine.isPending && !mine.isError && mine.listings.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-lg font-semibold text-foreground">
            {t('provider.myListings.empty.title')}
          </Text>
          <Text className="text-center text-base text-muted">
            {t('provider.myListings.empty.body')}
          </Text>
        </View>
      ) : null}

      {mine.listings.length > 0 ? (
        <FlatList
          data={mine.listings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          removeClippedSubviews
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (mine.hasNextPage && !mine.isFetchingNextPage) void mine.fetchNextPage();
          }}
          ListFooterComponent={
            mine.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
