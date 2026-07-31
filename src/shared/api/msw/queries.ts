import type {
  AuctionListRequestDto,
  AuctionListResponseDto,
  AuctionShowResponseDto,
  BetItemDto,
} from '@/shared/api/contracts';
import { AUCTION_STATUS_CODES, TRADING_STATUS_CODES } from '@/shared/api/contracts';
import { findRecord, getRecords, type AuctionRecord } from '@/shared/api/msw/db';
import { toListItem } from '@/shared/api/msw/projections';

function matchesCity(record: AuctionRecord, city: string, opType: 'Loading' | 'Unloading'): boolean {
  const needle = city.trim().toLowerCase();
  if (!needle) return true;
  return record.detail.routes.some(
    (point) =>
      point.op_type === opType && point.location.city_name.toLowerCase().includes(needle),
  );
}

function loadDate(record: AuctionRecord): number {
  const point = record.detail.routes.find((item) => item.op_type === 'Loading');
  return new Date(point?.start_date ?? record.detail.trading.start_time).getTime();
}

function matchesFilters(record: AuctionRecord, filters: AuctionListRequestDto): boolean {
  const { detail } = record;
  const trading = detail.trading;
  const price = trading.price.current;

  if (filters.cargo_num && !detail.main.cargo_num.includes(filters.cargo_num.trim())) return false;

  if (filters.status?.length && !filters.status.includes(trading.status_mobile)) return false;

  if (filters.mobile_statuses?.length) {
    const code = TRADING_STATUS_CODES[trading.status_mobile];
    if (code == null || !filters.mobile_statuses.includes(code)) return false;
  }

  if (filters.statuses?.length) {
    const code =
      trading.status === 'Unknown'
        ? null
        : AUCTION_STATUS_CODES[trading.status as keyof typeof AUCTION_STATUS_CODES];
    if (code == null || !filters.statuses.includes(code)) return false;
  }

  if (filters.auc_type?.length) {
    if (detail.main.auc_type === 'Unknown') return false;
    if (!filters.auc_type.includes(detail.main.auc_type as (typeof filters.auc_type)[number])) {
      return false;
    }
  }

  if (filters.load_city && !matchesCity(record, filters.load_city, 'Loading')) return false;
  if (filters.unload_city && !matchesCity(record, filters.unload_city, 'Unloading')) return false;

  if (filters.load_date_from && loadDate(record) < new Date(filters.load_date_from).getTime()) {
    return false;
  }
  if (filters.load_date_to && loadDate(record) > new Date(filters.load_date_to).getTime()) {
    return false;
  }

  if (filters.is_available === true && !record.list.isAvailable) return false;
  if (filters.is_bidder === true && !trading.is_bidder) return false;
  if (filters.is_favorite === true && !trading.is_favorite) return false;

  if (filters.current_price_from != null && (price == null || price < filters.current_price_from)) {
    return false;
  }
  if (filters.current_price_to != null && (price == null || price > filters.current_price_to)) {
    return false;
  }

  if (filters.body_types?.length && !filters.body_types.includes(detail.cargo.body_type)) {
    return false;
  }

  return true;
}

function sortValue(record: AuctionRecord, field: string): number {
  switch (field) {
    case 'current_price':
      return record.detail.trading.price.current ?? 0;
    case 'price_per_km':
      return record.detail.trading.price.price_per_km;
    case 'start_time':
      return new Date(record.detail.trading.start_time).getTime();
    case 'load_date':
      return loadDate(record);
    default:
      return record.detail.main.id;
  }
}

export function listAuctions(filters: AuctionListRequestDto): AuctionListResponseDto {
  const matched = getRecords().filter((record) => matchesFilters(record, filters));

  const sortEntries = Object.entries(filters.sort ?? {});
  if (sortEntries.length > 0) {
    matched.sort((a, b) => {
      for (const [field, direction] of sortEntries) {
        const diff = sortValue(a, field) - sortValue(b, field);
        if (diff !== 0) return direction === 'asc' ? diff : -diff;
      }
      return 0;
    });
  } else {
    matched.sort((a, b) => {
      const diff = new Date(a.detail.main.created_at).getTime() - new Date(b.detail.main.created_at).getTime();
      return filters.is_oldest === true ? diff : -diff;
    });
  }

  const perPage = filters.per_page ?? 20;
  const page = filters.page ?? 1;
  const total = matched.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const pageItems = matched.slice(start, start + perPage);

  return {
    data: pageItems.map(toListItem),
    meta: {
      current_page: page,
      from: total === 0 ? 0 : start + 1,
      last_page: lastPage,
      per_page: perPage,
      to: total === 0 ? 0 : start + pageItems.length,
      total,
    },
  };
}

export function getAuction(uuid: string): AuctionShowResponseDto | undefined {
  return findRecord(uuid)?.detail;
}

export function getBets(uuid: string, all: boolean): BetItemDto[] | undefined {
  const record = findRecord(uuid);
  if (!record) return undefined;

  const bets = all ? record.bets : record.bets.filter((bet) => !bet.is_rejected);
  return bets.map((bet) => ({
    ...bet,
    // hide_places скрывает рейтинг, но не сами ставки.
    place: record.detail.trading.hide_places ? null : bet.place,
  }));
}
