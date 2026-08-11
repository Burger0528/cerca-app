import type { ListingStatus, ListingStatusAction, MyListing } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from './button';
import { priceFromLabel } from './listing-labels';
import { StatusBadge } from './status-badge';

type LockedStatus = Extract<ListingStatus, 'under_review' | 'removed'>;

function lockedStatusOf(status: ListingStatus): LockedStatus | null {
  return status === 'under_review' || status === 'removed' ? status : null;
}

function actionFor(status: ListingStatus): ListingStatusAction {
  return status === 'published' ? 'pause' : 'publish';
}

export interface MyListingRowProps {
  readonly listing: MyListing;
  readonly locale: string;
  readonly isBusy: boolean;
  readonly onChangeStatus: (listingId: string, action: ListingStatusAction) => void;
}

function MyListingRowComponent({ listing, locale, isBusy, onChangeStatus }: MyListingRowProps) {
  const { t } = useTranslation();

  const locked = lockedStatusOf(listing.status);
  const action = actionFor(listing.status);

  return (
    <View className="gap-2 border-b border-subtle px-4 py-4">
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={2}>
          {listing.title}
        </Text>
        <StatusBadge status={listing.status} />
      </View>

      <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
        {priceFromLabel(listing.priceFrom, locale, t)}
      </Text>

      {locked === null ? (
        <Button
          variant="secondary"
          className="self-start"
          isLoading={isBusy}
          onPress={() => onChangeStatus(listing.id, action)}
        >
          {t(`provider.myListings.action.${action}`)}
        </Button>
      ) : (
        <Text className="text-sm text-muted">{t(`provider.myListings.locked.${locked}`)}</Text>
      )}
    </View>
  );
}

export const MyListingRow = memo(MyListingRowComponent);
