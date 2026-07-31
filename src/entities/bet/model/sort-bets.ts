import type { BetVm } from '@/entities/bet/model/bet.vm';

export const BET_SORT_FIELDS = ['place', 'price', 'time'] as const;
export type BetSortField = (typeof BET_SORT_FIELDS)[number];
export type SortDirection = 'asc' | 'desc';

export type BetSort = { field: BetSortField; direction: SortDirection };

export const DEFAULT_BET_SORT: BetSort = { field: 'place', direction: 'asc' };

function compare(a: BetVm, b: BetVm, field: BetSortField): number {
  switch (field) {
    case 'price':
      return a.priceWithVat - b.priceWithVat;
    case 'time':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case 'place':
    default:
      return (a.place ?? Number.POSITIVE_INFINITY) - (b.place ?? Number.POSITIVE_INFINITY);
  }
}

export function sortBets(bets: readonly BetVm[], sort: BetSort): BetVm[] {
  const sign = sort.direction === 'asc' ? 1 : -1;

  return [...bets].sort((a, b) => {
    const diff = compare(a, b, sort.field);
    return diff !== 0 ? diff * sign : a.id - b.id;
  });
}

export function toggleBetSort(current: BetSort, field: BetSortField): BetSort {
  if (current.field !== field) return { field, direction: 'asc' };
  return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}
