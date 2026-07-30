import { describe, expect, it } from 'vitest';

import {
  buildListRequest,
  toIsoWithOffset,
} from '@/features/filter-auctions/model/request-builder';
import { parseAuctionsSearch } from '@/features/filter-auctions/model/search-params';
import { auctionListRequestSchema } from '@/shared/api/contracts';

const build = (input: Record<string, unknown>) =>
  buildListRequest(parseAuctionsSearch(input), { offsetMinutes: -180 });

describe('toIsoWithOffset', () => {
  it('разворачивает дату в начало и конец дня со смещением', () => {
    expect(toIsoWithOffset('2026-05-26', 'start', -180)).toBe('2026-05-26T00:00:00+03:00');
    expect(toIsoWithOffset('2026-05-26', 'end', -180)).toBe('2026-05-26T23:59:59+03:00');
  });

  it('форматирует отрицательные и нулевые смещения', () => {
    expect(toIsoWithOffset('2026-05-26', 'start', 0)).toBe('2026-05-26T00:00:00+00:00');
    expect(toIsoWithOffset('2026-05-26', 'start', 300)).toBe('2026-05-26T00:00:00-05:00');
    expect(toIsoWithOffset('2026-05-26', 'start', -330)).toBe('2026-05-26T00:00:00+05:30');
  });
});

describe('buildListRequest', () => {
  it('всегда отправляет пагинацию и порядок сортировки', () => {
    expect(build({})).toEqual({ page: 1, per_page: 20, is_oldest: false });
  });

  it('не отправляет незаданные фильтры', () => {
    const request = build({ page: 2 });
    expect(Object.keys(request).sort()).toEqual(['is_oldest', 'page', 'per_page']);
  });

  it('переводит статусы аукциона в числовые коды', () => {
    expect(build({ statuses: ['Auction', 'Finished'] }).statuses).toEqual([2, 6]);
  });

  it('оставляет торговые статусы строками, как требует схема', () => {
    expect(build({ status: ['Leading', 'Winner'] }).status).toEqual(['Leading', 'Winner']);
  });

  it('переводит даты в ISO 8601 со смещением', () => {
    const request = build({ load_date_from: '2026-05-26', load_date_to: '2026-05-28' });
    expect(request.load_date_from).toBe('2026-05-26T00:00:00+03:00');
    expect(request.load_date_to).toBe('2026-05-28T23:59:59+03:00');
  });

  it('раскладывает сортировку в поля sort / is_oldest', () => {
    expect(build({ sort: 'oldest' })).toMatchObject({ is_oldest: true });
    expect(build({ sort: 'price_asc' }).sort).toEqual({ current_price: 'asc' });
    expect(build({ sort: 'per_km_desc' }).sort).toEqual({ price_per_km: 'desc' });
    expect(build({ sort: 'start_time_asc' }).sort).toEqual({ start_time: 'asc' });
  });

  it('переносит цены в поля current_price_from / current_price_to', () => {
    const request = build({ price_from: 10_000, price_to: 50_000 });
    expect(request.current_price_from).toBe(10_000);
    expect(request.current_price_to).toBe(50_000);
  });

  it('отправляет булевы фильтры только когда они включены', () => {
    expect(build({ is_available: true, is_bidder: false })).toMatchObject({ is_available: true });
    expect(build({ is_available: true, is_bidder: false }).is_bidder).toBeUndefined();
  });

  it('собирает тело, валидное по схеме AuctionListRequest', () => {
    const request = build({
      page: 3,
      per_page: 50,
      cargo_num: '00000001059',
      statuses: ['Auction'],
      status: ['Leading'],
      auc_type: ['Down', 'Up'],
      load_city: 'Пермь',
      unload_city: 'Москва',
      load_date_from: '2026-05-26',
      load_date_to: '2026-05-28',
      is_available: true,
      is_bidder: true,
      price_from: 1000,
      price_to: 2000,
      sort: 'price_desc',
    });

    expect(auctionListRequestSchema.safeParse(request).success).toBe(true);
  });
});
