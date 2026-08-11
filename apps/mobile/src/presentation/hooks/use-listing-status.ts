import type { CursorPage, ListingStatus, ListingStatusAction, MyListing } from '@cerca/contract';
import type { InfiniteData } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { listingKeys } from '../../application/listings/query-keys';
import { useServices } from '../providers/services-provider';

type MyListingPages = InfiniteData<CursorPage<MyListing>, string | null>;

interface StatusChange {
  readonly listingId: string;
  readonly action: ListingStatusAction;
}

const STATUS_AFTER: Readonly<Record<ListingStatusAction, ListingStatus>> = {
  publish: 'published',
  pause: 'paused',
};

export function useListingStatus() {
  const { listingGateway } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, action }: StatusChange) =>
      listingGateway.setStatus(listingId, action),

    onMutate: async ({ listingId, action }: StatusChange) => {
      await queryClient.cancelQueries({ queryKey: listingKeys.mine() });

      const previous = queryClient.getQueryData<MyListingPages>(listingKeys.mine());

      queryClient.setQueryData<MyListingPages>(listingKeys.mine(), (pages) =>
        pages === undefined ? pages : withStatus(pages, listingId, STATUS_AFTER[action]),
      );

      return { previous };
    },

    onError: (_error, _change, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(listingKeys.mine(), context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

function withStatus(pages: MyListingPages, listingId: string, status: ListingStatus) {
  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.map((listing) =>
        listing.id === listingId ? { ...listing, status } : listing,
      ),
    })),
  };
}
