import type { AuctionListRequestDto } from '@/shared/api/contracts';
import { AUCTION_STATUS_CODES } from '@/shared/api/contracts';
import type { AuctionsSearch, SortOption } from '@/features/filter-auctions/model/search-params';

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes > 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

export function toIsoWithOffset(
  date: string,
  edge: 'start' | 'end',
  offsetMinutes?: number,
): string {
  const time = edge === 'start' ? '00:00:00' : '23:59:59';
  const local = new Date(`${date}T${time}`);
  const offset = offsetMinutes ?? local.getTimezoneOffset();
  return `${date}T${time}${formatOffset(offset)}`;
}

const SORT_MAP: Record<SortOption, Pick<AuctionListRequestDto, 'sort' | 'is_oldest'>> = {
  newest: { is_oldest: false },
  oldest: { is_oldest: true },
  price_asc: { sort: { current_price: 'asc' } },
  price_desc: { sort: { current_price: 'desc' } },
  per_km_asc: { sort: { price_per_km: 'asc' } },
  per_km_desc: { sort: { price_per_km: 'desc' } },
  start_time_asc: { sort: { start_time: 'asc' } },
};

export function buildListRequest(
  search: AuctionsSearch,
  options: { offsetMinutes?: number } = {},
): AuctionListRequestDto {
  const request: AuctionListRequestDto = {
    page: search.page,
    per_page: search.per_page,
    ...SORT_MAP[search.sort],
  };

  if (search.cargo_num) request.cargo_num = search.cargo_num;
  if (search.status?.length) request.status = search.status;
  if (search.auc_type?.length) request.auc_type = search.auc_type;

  if (search.statuses?.length) {
    const codes = search.statuses
      .filter((status): status is keyof typeof AUCTION_STATUS_CODES => status !== 'Unknown')
      .map((status) => AUCTION_STATUS_CODES[status]);
    if (codes.length > 0) request.statuses = codes;
  }

  if (search.load_city) request.load_city = search.load_city;
  if (search.unload_city) request.unload_city = search.unload_city;

  if (search.load_date_from) {
    request.load_date_from = toIsoWithOffset(search.load_date_from, 'start', options.offsetMinutes);
  }
  if (search.load_date_to) {
    request.load_date_to = toIsoWithOffset(search.load_date_to, 'end', options.offsetMinutes);
  }

  if (search.is_available === true) request.is_available = true;
  if (search.is_bidder === true) request.is_bidder = true;

  if (search.price_from != null) request.current_price_from = search.price_from;
  if (search.price_to != null) request.current_price_to = search.price_to;

  return request;
}
