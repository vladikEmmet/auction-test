import { beforeEach, describe, expect, it } from 'vitest';

import type { AuctionListItemDto } from '@/shared/api/contracts';

import { createSeed, uuidFor } from '@/shared/api/msw/seed';
import {
  getAuction,
  getBets,
  listAuctions,
  placeBet,
  resetStore,
  toListItem,
  withoutVat,
} from '@/shared/api/msw/store';
import { CURRENT_USER } from '@/shared/config/env';

const NOW = new Date('2026-07-30T12:00:00');

const DOWN_AUCTION = uuidFor(0);

const CLOSED_AUCTION = uuidFor(4);

const FINISHED_AUCTION = uuidFor(5);

beforeEach(() => {
  resetStore(createSeed(NOW));
});

describe('listAuctions', () => {
  it('отдаёт первую страницу с корректной мета-информацией', () => {
    const response = listAuctions({ page: 1, per_page: 10 });
    expect(response.data).toHaveLength(10);
    expect(response.meta).toMatchObject({
      current_page: 1,
      per_page: 10,
      from: 1,
      to: 10,
    });
    expect(response.meta.total).toBeGreaterThan(10);
  });

  it('не выдаёт элементы за последней страницей', () => {
    const { meta } = listAuctions({ page: 1, per_page: 20 });
    const beyond = listAuctions({ page: meta.last_page + 5, per_page: 20 });
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.total).toBe(meta.total);
  });

  it('фильтрует по номеру заявки', () => {
    const all = listAuctions({ per_page: 100 });
    const target = all.data[3]?.main.cargo_num;
    const filtered = listAuctions({ cargo_num: target, per_page: 100 });
    expect(filtered.data).toHaveLength(1);
    expect(filtered.data[0]?.main.cargo_num).toBe(target);
  });

  it('фильтрует по числовому статусу аукциона', () => {
    const filtered = listAuctions({ statuses: [2], per_page: 100 });
    expect(filtered.data.length).toBeGreaterThan(0);
    expect(filtered.data.every((item) => item.trading.status === 'Auction')).toBe(true);
  });

  it('фильтрует по городу погрузки', () => {
    const filtered = listAuctions({ load_city: 'Москва', per_page: 100 });
    expect(filtered.data.every((item) => item.route.load.city === 'Москва')).toBe(true);
  });

  const visiblePrices = (items: AuctionListItemDto[]) =>
    items
      .map((item) => item.trading.price?.current)
      .filter((price): price is number => price != null);

  it('фильтрует по диапазону цены', () => {
    const filtered = listAuctions({
      current_price_from: 60_000,
      per_page: 100,
    });
    expect(filtered.data.length).toBeGreaterThan(0);
    expect(visiblePrices(filtered.data).every((price) => price >= 60_000)).toBe(true);
  });

  it('сортирует по текущей цене', () => {
    const { data } = listAuctions({
      sort: { current_price: 'asc' },
      per_page: 100,
    });
    const prices = visiblePrices(data);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('пустая выборка возвращает нулевую мету, а не отрицательные индексы', () => {
    const empty = listAuctions({
      cargo_num: 'такого-номера-нет',
      per_page: 20,
    });
    expect(empty.data).toEqual([]);
    expect(empty.meta).toMatchObject({
      total: 0,
      from: 0,
      to: 0,
      last_page: 1,
    });
  });
});

describe('getBets', () => {
  it('по умолчанию скрывает отменённые ставки', () => {
    const active = getBets(FINISHED_AUCTION, false) ?? [];
    const all = getBets(FINISHED_AUCTION, true) ?? [];
    expect(all.length).toBeGreaterThan(active.length);
    expect(active.every((bet) => !bet.is_rejected)).toBe(true);
    expect(all.some((bet) => bet.is_rejected && bet.cancel_reason !== '')).toBe(true);
  });

  it('скрывает места, когда взведён hide_places', () => {
    const hidden = getBets(uuidFor(7), true) ?? [];
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every((bet) => bet.place === null)).toBe(true);
  });

  it('для неизвестного аукциона возвращает undefined', () => {
    expect(getBets('нет-такого', false)).toBeUndefined();
  });
});

describe('места в сиде', () => {
  it('рейтинг проставлен сразу, а не появляется после первой ставки', () => {
    const bets = getBets(DOWN_AUCTION, false)!;
    expect(bets.length).toBeGreaterThan(1);
    expect(bets.every((bet) => bet.place != null)).toBe(true);

    const places = bets.map((bet) => bet.place);
    expect(new Set(places).size).toBe(places.length);
    expect(Math.min(...(places as number[]))).toBe(1);
  });

  it('места пустые только там, где организатор скрыл рейтинг', () => {
    const withoutPlaces: string[] = [];

    for (let index = 0; index < 57; index += 1) {
      const uuid = uuidFor(index);
      const bets = getBets(uuid, false) ?? [];
      if (bets.length > 0 && bets.every((bet) => bet.place == null)) withoutPlaces.push(uuid);
    }

    expect(withoutPlaces).toEqual([uuidFor(7)]);
  });
});

describe('placeBet', () => {
  it('отклоняет ставку, если ставки запрещены', () => {
    const result = placeBet(CLOSED_AUCTION, 1000);
    expect(result).toMatchObject({ ok: false });
    expect(result && !result.ok && result.errors[0]?.code).toBe('bet_not_allowed');
  });

  it('отклоняет ставку, нарушающую направление торгов', () => {
    const before = getAuction(DOWN_AUCTION)!;
    const result = placeBet(DOWN_AUCTION, (before.trading.price.current ?? 0) + 1000);
    expect(result).toMatchObject({ ok: false });
  });

  it('принимает корректную ставку и двигает текущую цену', () => {
    const before = getAuction(DOWN_AUCTION)!;
    const price = before.trading.price.available!;

    const result = placeBet(DOWN_AUCTION, price);
    expect(result).toMatchObject({ ok: true });

    const after = getAuction(DOWN_AUCTION)!;
    expect(after.trading.price.current).toBe(price);
    expect(after.trading.price.current_no_vat).toBe(withoutVat(price));
    expect(after.trading.price.available).toBe(price - (after.trading.price.step ?? 0));
  });

  it('обновляет состояние своей ставки и торговый статус', () => {
    const price = getAuction(DOWN_AUCTION)!.trading.price.available!;
    placeBet(DOWN_AUCTION, price);

    const after = getAuction(DOWN_AUCTION)!;
    expect(after.trading.your.bet).toBe(true);
    expect(after.trading.your.last_bet_with_vat).toBe(price);
    expect(after.trading.is_bidder).toBe(true);
    expect(after.trading.status_mobile).toBe('Leading');
  });

  it('добавляет ставку в историю и пересчитывает места', () => {
    const before = getBets(DOWN_AUCTION, false)!.length;
    const price = getAuction(DOWN_AUCTION)!.trading.price.available!;
    placeBet(DOWN_AUCTION, price);

    const bets = getBets(DOWN_AUCTION, false)!;
    expect(bets).toHaveLength(before + 1);

    const mine = bets.find((bet) => bet.organization_id === CURRENT_USER.organizationId);
    expect(mine?.place).toBe(1);
    expect(mine?.price_no_vat).toBe(withoutVat(price));

    const places = bets.map((bet) => bet.place).filter((place): place is number => place != null);
    expect([...new Set(places)]).toHaveLength(places.length);
    expect(Math.min(...places)).toBe(1);
  });

  it('рейтинг строится по лучшей ставке организации, а не по каждой ставке', () => {
    const step = getAuction(DOWN_AUCTION)!.trading.price.step ?? 500;
    placeBet(DOWN_AUCTION, getAuction(DOWN_AUCTION)!.trading.price.available!);
    placeBet(DOWN_AUCTION, getAuction(DOWN_AUCTION)!.trading.price.available!);

    const bets = getBets(DOWN_AUCTION, false)!;
    const mine = bets.filter((bet) => bet.organization_id === CURRENT_USER.organizationId);
    expect(mine).toHaveLength(2);

    const ranked = mine.filter((bet) => bet.place != null);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.place).toBe(1);
    expect(ranked[0]?.price_with_vat).toBe(Math.min(...mine.map((bet) => bet.price_with_vat)));
    expect(step).toBeGreaterThan(0);
  });

  it('изменения видны и в списке аукционов', () => {
    const price = getAuction(DOWN_AUCTION)!.trading.price.available!;
    placeBet(DOWN_AUCTION, price);

    const item = listAuctions({ per_page: 100 }).data.find(
      (auction) => auction.main.order_uid === DOWN_AUCTION,
    );
    expect(item?.trading.price?.current).toBe(price);
    expect(item?.trading.your).toEqual({ bet: true, last_bet: price });
    expect(item?.trading.status_mobile).toBe('Leading');
  });

  it('для неизвестного аукциона возвращает undefined', () => {
    expect(placeBet('нет-такого', 1000)).toBeUndefined();
  });
});

describe('toListItem', () => {
  it('складывает вес и объём по точкам погрузки', () => {
    const seed = createSeed(NOW);
    const record = seed.find((item) => item.detail.routes.length > 2)!;
    const item = toListItem(record);

    const expectedWeight = record.detail.routes
      .filter((point) => point.op_type === 'Loading')
      .reduce((sum, point) => sum + Number.parseFloat(point.cargo.weight), 0);

    expect(item.cargo.weight).toBeCloseTo(expectedWeight, 2);
    expect(item.route.load.points_count).toBe(2);
  });
});
