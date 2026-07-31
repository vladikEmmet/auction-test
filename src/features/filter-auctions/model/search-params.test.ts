import { describe, expect, it } from 'vitest';

import {
  clearFilters,
  DEFAULT_PER_PAGE,
  hasActiveFilters,
  parseAuctionsSearch,
} from '@/features/filter-auctions/model/search-params';

describe('parseAuctionsSearch', () => {
  it('подставляет значения по умолчанию для пустого URL', () => {
    expect(parseAuctionsSearch({})).toEqual({
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      sort: 'newest',
    });
  });

  it('переживает полностью мусорный вход', () => {
    expect(parseAuctionsSearch('не объект')).toEqual({
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      sort: 'newest',
    });
    expect(parseAuctionsSearch(null)).toEqual({
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      sort: 'newest',
    });
  });

  it('приводит числовые параметры из строк', () => {
    const search = parseAuctionsSearch({
      page: '3',
      per_page: '50',
      price_from: '1000.5',
    });
    expect(search.page).toBe(3);
    expect(search.per_page).toBe(50);
    expect(search.price_from).toBe(1000.5);
  });

  it('заменяет некорректную страницу на первую', () => {
    expect(parseAuctionsSearch({ page: 'abc' }).page).toBe(1);
    expect(parseAuctionsSearch({ page: 0 }).page).toBe(1);
    expect(parseAuctionsSearch({ page: -5 }).page).toBe(1);
    expect(parseAuctionsSearch({ page: 2.7 }).page).toBe(1);
  });

  it('разрешает только фиксированные размеры страницы', () => {
    expect(parseAuctionsSearch({ per_page: 999 }).per_page).toBe(DEFAULT_PER_PAGE);
    expect(parseAuctionsSearch({ per_page: 10 }).per_page).toBe(10);
  });

  it('отбрасывает неизвестную сортировку', () => {
    expect(parseAuctionsSearch({ sort: 'по-настроению' }).sort).toBe('newest');
    expect(parseAuctionsSearch({ sort: 'price_desc' }).sort).toBe('price_desc');
  });

  it('игнорирует enum-значения вне схемы', () => {
    expect(parseAuctionsSearch({ statuses: ['НЛО'] }).statuses).toBeUndefined();
    expect(parseAuctionsSearch({ status: ['Leading', 'Losing'] }).status).toEqual([
      'Leading',
      'Losing',
    ]);
    expect(parseAuctionsSearch({ auc_type: ['Unknown'] }).auc_type).toBeUndefined();
  });

  it('принимает только города из мок-словаря', () => {
    expect(parseAuctionsSearch({ load_city: 'Пермь' }).load_city).toBe('Пермь');
    expect(parseAuctionsSearch({ load_city: 'Готэм' }).load_city).toBeUndefined();
  });

  it('принимает даты только в формате YYYY-MM-DD', () => {
    expect(parseAuctionsSearch({ load_date_from: '2026-05-26' }).load_date_from).toBe('2026-05-26');
    expect(parseAuctionsSearch({ load_date_from: 'вчера' }).load_date_from).toBeUndefined();
    expect(parseAuctionsSearch({ load_date_from: '26.05.2026' }).load_date_from).toBeUndefined();
    expect(parseAuctionsSearch({ load_date_to: '2026-13-45' }).load_date_to).toBeUndefined();
  });

  it('принимает числовой номер заявки из URL как строку', () => {
    expect(parseAuctionsSearch({ cargo_num: 99_999_999_999 }).cargo_num).toBe('99999999999');
  });

  it('отбрасывает пустые строки и отрицательные цены', () => {
    expect(parseAuctionsSearch({ cargo_num: '   ' }).cargo_num).toBeUndefined();
    expect(parseAuctionsSearch({ cargo_num: '  00001 ' }).cargo_num).toBe('00001');
    expect(parseAuctionsSearch({ price_from: -100 }).price_from).toBeUndefined();
    expect(parseAuctionsSearch({ price_to: 'дорого' }).price_to).toBeUndefined();
  });

  it('не пропускает чужие query-параметры в состояние', () => {
    const search = parseAuctionsSearch({ utm_source: 'mail', page: 2 });
    expect(search).not.toHaveProperty('utm_source');
    expect(search.page).toBe(2);
  });

  it('один невалидный параметр не ломает остальные', () => {
    const search = parseAuctionsSearch({
      page: 'abc',
      load_city: 'Пермь',
      sort: 'price_asc',
    });
    expect(search).toMatchObject({
      page: 1,
      load_city: 'Пермь',
      sort: 'price_asc',
    });
  });
});

describe('hasActiveFilters / clearFilters', () => {
  it('пагинация и сортировка не считаются фильтрами', () => {
    expect(hasActiveFilters(parseAuctionsSearch({ page: 5, sort: 'price_asc' }))).toBe(false);
    expect(hasActiveFilters(parseAuctionsSearch({ is_bidder: true }))).toBe(true);
  });

  it('сброс сохраняет размер страницы и сортировку', () => {
    const search = parseAuctionsSearch({
      per_page: 50,
      sort: 'oldest',
      page: 4,
      load_city: 'Москва',
    });
    expect(clearFilters(search)).toEqual({
      page: 1,
      per_page: 50,
      sort: 'oldest',
    });
  });
});
