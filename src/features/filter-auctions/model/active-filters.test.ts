import { describe, expect, it } from 'vitest';

import { describeActiveFilters } from '@/features/filter-auctions/model/active-filters';
import { parseAuctionsSearch } from '@/features/filter-auctions/model/search-params';

const chips = (input: Record<string, unknown>) =>
  describeActiveFilters(parseAuctionsSearch(input));

describe('describeActiveFilters', () => {
  it('без фильтров чипсов нет', () => {
    expect(chips({})).toEqual([]);
    expect(chips({ page: 3, per_page: 50, sort: 'price_asc' })).toEqual([]);
  });

  it('переводит enum-значения в человеческие подписи', () => {
    expect(chips({ statuses: ['Auction'] })[0]?.label).toBe('Торги идут');
    expect(chips({ status: ['Leading'] })[0]?.label).toBe('Мой статус: Лидирую');
    expect(chips({ auc_type: ['Down'] })[0]?.label).toBe('На понижение');
  });

  it('на каждое значение массива даёт отдельный чипс', () => {
    const result = chips({ statuses: ['Auction', 'Finished'] });
    expect(result).toHaveLength(2);
    expect(result.map((chip) => chip.id)).toEqual(['statuses:Auction', 'statuses:Finished']);
  });

  it('патч снимает одно значение, а остальные оставляет', () => {
    const [first] = chips({ statuses: ['Auction', 'Finished', 'Stopped'] });
    expect(first?.patch.statuses).toEqual(['Finished', 'Stopped']);
    expect(first?.patch.page).toBe(1);
  });

  it('последнее значение массива снимается целиком', () => {
    const [only] = chips({ auc_type: ['Up'] });
    expect(only?.patch.auc_type).toBeUndefined();
  });

  it('скалярные фильтры снимаются через undefined', () => {
    const [city] = chips({ load_city: 'Пермь' });
    expect(city?.label).toBe('Погрузка: Пермь');
    expect(city?.patch).toEqual({ page: 1, load_city: undefined });
  });

  it('форматирует даты по-русски', () => {
    expect(chips({ load_date_from: '2026-05-26' })[0]?.label).toBe('Погрузка с 26.05.2026');
    expect(chips({ load_date_to: '2026-06-01' })[0]?.label).toBe('Погрузка по 01.06.2026');
  });

  it('показывает цены и булевы фильтры', () => {
    expect(chips({ price_from: 10_000 })[0]?.label).toMatch(/^Цена от 10\s?000$/);
    expect(chips({ is_available: true })[0]?.label).toBe('Только доступные');
    expect(chips({ is_bidder: true })[0]?.label).toBe('Только мои торги');
  });

  it('любой чипс сбрасывает страницу на первую', () => {
    const result = chips({
      page: 7,
      cargo_num: '123',
      load_city: 'Москва',
      is_bidder: true,
      statuses: ['Auction'],
    });
    expect(result.length).toBeGreaterThan(3);
    expect(result.every((chip) => chip.patch.page === 1)).toBe(true);
  });

  it('идентификаторы чипсов уникальны', () => {
    const result = chips({
      statuses: ['Auction', 'Finished'],
      status: ['Leading'],
      auc_type: ['Down', 'Up'],
      load_city: 'Пермь',
      unload_city: 'Москва',
      price_from: 1,
      price_to: 2,
    });
    expect(new Set(result.map((chip) => chip.id)).size).toBe(result.length);
  });
});
