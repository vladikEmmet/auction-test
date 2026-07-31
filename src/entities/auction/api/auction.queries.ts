import { queryOptions } from '@tanstack/react-query';

import { fetchAuction, fetchAuctionList } from '@/entities/auction/api/auction.api';
import { toAuctionCardVm } from '@/entities/auction/model/auction-card.vm';
import { toAuctionDetailVm } from '@/entities/auction/model/auction-detail.vm';
import type { AuctionListRequestDto } from '@/shared/api/contracts';

export const auctionKeys = {
  all: ['auctions'] as const,
  lists: () => [...auctionKeys.all, 'list'] as const,
  list: (request: AuctionListRequestDto) => [...auctionKeys.lists(), request] as const,
  details: () => [...auctionKeys.all, 'detail'] as const,
  detail: (auctionUuid: string) => [...auctionKeys.details(), auctionUuid] as const,
};

export function auctionListQuery(request: AuctionListRequestDto) {
  return queryOptions({
    queryKey: auctionKeys.list(request),
    queryFn: ({ signal }) => fetchAuctionList(request, signal),

    select: (data) => ({
      items: data.data.map(toAuctionCardVm),
      meta: data.meta,
    }),
  });
}

export function auctionDetailQuery(auctionUuid: string) {
  return queryOptions({
    queryKey: auctionKeys.detail(auctionUuid),
    queryFn: ({ signal }) => fetchAuction(auctionUuid, signal),
    select: toAuctionDetailVm,
  });
}
