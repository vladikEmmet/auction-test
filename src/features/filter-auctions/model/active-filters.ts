import {
  AUCTION_STATUS_LABELS,
  AUCTION_TYPE_LABELS,
  TRADING_STATUS_LABELS,
} from '@/shared/api/contracts';
import type { AuctionsSearch } from '@/features/filter-auctions/model/search-params';

export type ActiveFilterChip = {
  id: string;
  label: string;

  patch: Partial<AuctionsSearch>;
};

function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

function withoutValue<T extends string>(values: readonly T[], value: T): T[] | undefined {
  const next = values.filter((item) => item !== value);
  return next.length > 0 ? next : undefined;
}

export function describeActiveFilters(search: AuctionsSearch): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const reset = { page: 1 as const };

  if (search.cargo_num) {
    chips.push({
      id: 'cargo_num',
      label: `Заявка: ${search.cargo_num}`,
      patch: { ...reset, cargo_num: undefined },
    });
  }

  for (const status of search.statuses ?? []) {
    chips.push({
      id: `statuses:${status}`,
      label: AUCTION_STATUS_LABELS[status],
      patch: {
        ...reset,
        statuses: withoutValue(search.statuses ?? [], status),
      },
    });
  }

  for (const status of search.status ?? []) {
    chips.push({
      id: `status:${status}`,
      label: `Мой статус: ${TRADING_STATUS_LABELS[status]}`,
      patch: { ...reset, status: withoutValue(search.status ?? [], status) },
    });
  }

  for (const type of search.auc_type ?? []) {
    chips.push({
      id: `auc_type:${type}`,
      label: AUCTION_TYPE_LABELS[type],
      patch: { ...reset, auc_type: withoutValue(search.auc_type ?? [], type) },
    });
  }

  if (search.load_city) {
    chips.push({
      id: 'load_city',
      label: `Погрузка: ${search.load_city}`,
      patch: { ...reset, load_city: undefined },
    });
  }

  if (search.unload_city) {
    chips.push({
      id: 'unload_city',
      label: `Выгрузка: ${search.unload_city}`,
      patch: { ...reset, unload_city: undefined },
    });
  }

  if (search.load_date_from) {
    chips.push({
      id: 'load_date_from',
      label: `Погрузка с ${formatDate(search.load_date_from)}`,
      patch: { ...reset, load_date_from: undefined },
    });
  }

  if (search.load_date_to) {
    chips.push({
      id: 'load_date_to',
      label: `Погрузка по ${formatDate(search.load_date_to)}`,
      patch: { ...reset, load_date_to: undefined },
    });
  }

  if (search.price_from != null) {
    chips.push({
      id: 'price_from',
      label: `Цена от ${search.price_from.toLocaleString('ru-RU')}`,
      patch: { ...reset, price_from: undefined },
    });
  }

  if (search.price_to != null) {
    chips.push({
      id: 'price_to',
      label: `Цена до ${search.price_to.toLocaleString('ru-RU')}`,
      patch: { ...reset, price_to: undefined },
    });
  }

  if (search.is_available) {
    chips.push({
      id: 'is_available',
      label: 'Только доступные',
      patch: { ...reset, is_available: undefined },
    });
  }

  if (search.is_bidder) {
    chips.push({
      id: 'is_bidder',
      label: 'Только мои торги',
      patch: { ...reset, is_bidder: undefined },
    });
  }

  return chips;
}
