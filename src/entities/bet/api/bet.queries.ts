import { queryOptions } from '@tanstack/react-query';

import { fetchBets } from '@/entities/bet/api/bet.api';
import { toBetsSummaryVm } from '@/entities/bet/model/bet.vm';

export const betKeys = {
  all: ['bets'] as const,
  lists: () => [...betKeys.all, 'list'] as const,
  list: (auctionUuid: string, all: boolean) => [...betKeys.lists(), auctionUuid, { all }] as const,
};

export function betListQuery(auctionUuid: string, all: boolean, enabled = true) {
  return queryOptions({
    queryKey: betKeys.list(auctionUuid, all),
    queryFn: ({ signal }) => fetchBets(auctionUuid, all, signal),
    select: (data) => toBetsSummaryVm(data.bets),
    enabled,
  });
}
