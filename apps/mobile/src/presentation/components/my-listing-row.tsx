import type { Actor, ListingStatus, ListingStatusAction, MyListing } from '@cerca/contract';
import { canEditListing } from '@cerca/contract';
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
  readonly actor: Actor | null;
  readonly locale: string;
  readonly isBusy: boolean;
  readonly onChangeStatus: (listingId: string, action: ListingStatusAction) => void;
  readonly onEdit: (listingId: string) => void;
}

function MyListingRowComponent({
  listing,
  actor,
  locale,
  isBusy,
  onChangeStatus,
  onEdit,
}: MyListingRowProps) {
  const { t } = useTranslation();

  const locked = lockedStatusOf(listing.status);
  const action = actionFor(listing.status);
  const edit = actor === null ? null : canEditListing(actor, listing);

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

      <View className="flex-row flex-wrap gap-2">
        {locked === null ? (
          <Button
            variant="secondary"
            isLoading={isBusy}
            onPress={() => onChangeStatus(listing.id, action)}
          >
            {t(`provider.myListings.action.${action}`)}
          </Button>
        ) : null}

        {/* Sin capacidad o sin propiedad el botón no existe; bloqueado por estado sí se pinta,
            deshabilitado, para que la regla se pueda leer. */}
        {edit === null || (!edit.ok && edit.kind === 'hidden') ? null : (
          <Button variant="secondary" isDisabled={!edit.ok} onPress={() => onEdit(listing.id)}>
            {t('provider.myListings.action.edit')}
          </Button>
        )}
      </View>

      {locked === null ? null : (
        <Text className="text-sm text-muted">{t(`provider.myListings.locked.${locked}`)}</Text>
      )}
    </View>
  );
}

export const MyListingRow = memo(MyListingRowComponent);
