import { describe, expect, it } from 'vitest';

import type { BetVm } from '@/entities/bet/model/bet.vm';
import { DEFAULT_BET_SORT, sortBets, toggleBetSort } from '@/entities/bet/model/sort-bets';

const bet = (overrides: Partial<BetVm> & Pick<BetVm, 'id'>): BetVm => ({
  createdAt: '2026-07-30T12:00:00',
  carrierName: 'ООО Перевозчик',
  carrierInn: '7700000000',
  contactName: null,
  priceWithVat: 30_000,
  priceNoVat: 25_000,
  vatRate: '20',
  paymentType: null,
  place: null,
  isWinner: false,
  isRejected: false,
  cancelReason: null,
  isCounter: false,
  isMine: false,
  comment: null,
  ...overrides,
});

const bets: BetVm[] = [
  bet({ id: 1, place: 2, priceWithVat: 29_500, createdAt: '2026-07-30T12:05:00' }),
  bet({ id: 2, place: 1, priceWithVat: 29_000, createdAt: '2026-07-30T12:10:00' }),
  bet({ id: 3, place: null, priceWithVat: 31_000, createdAt: '2026-07-30T12:01:00', isRejected: true }),
];

const ids = (result: BetVm[]) => result.map((item) => item.id);

describe('sortBets', () => {
  it('по умолчанию сортирует по месту, ставки без места — в конце', () => {
    expect(ids(sortBets(bets, DEFAULT_BET_SORT))).toEqual([2, 1, 3]);
  });

  it('ставки без места остаются в конце и при обратном порядке', () => {
    // Отменённые ставки не должны всплывать наверх только потому, что place = null.
    const result = sortBets(bets, { field: 'place', direction: 'desc' });
    expect(result.at(0)?.id).toBe(3);
    expect(ids(result)).toEqual([3, 1, 2]);
  });

  it('сортирует по цене в обе стороны', () => {
    expect(ids(sortBets(bets, { field: 'price', direction: 'asc' }))).toEqual([2, 1, 3]);
    expect(ids(sortBets(bets, { field: 'price', direction: 'desc' }))).toEqual([3, 1, 2]);
  });

  it('сортирует по времени', () => {
    expect(ids(sortBets(bets, { field: 'time', direction: 'asc' }))).toEqual([3, 1, 2]);
    expect(ids(sortBets(bets, { field: 'time', direction: 'desc' }))).toEqual([2, 1, 3]);
  });

  it('не мутирует исходный массив', () => {
    const original = [...bets];
    sortBets(bets, { field: 'price', direction: 'desc' });
    expect(bets).toEqual(original);
  });

  it('стабильна при равных значениях', () => {
    const equal = [bet({ id: 5, priceWithVat: 100 }), bet({ id: 4, priceWithVat: 100 })];
    expect(ids(sortBets(equal, { field: 'price', direction: 'asc' }))).toEqual([4, 5]);
  });
});

describe('toggleBetSort', () => {
  it('повторный клик по колонке переворачивает направление', () => {
    const first = toggleBetSort(DEFAULT_BET_SORT, 'place');
    expect(first).toEqual({ field: 'place', direction: 'desc' });
    expect(toggleBetSort(first, 'place')).toEqual({ field: 'place', direction: 'asc' });
  });

  it('новая колонка начинает с возрастания', () => {
    expect(toggleBetSort({ field: 'place', direction: 'desc' }, 'price')).toEqual({
      field: 'price',
      direction: 'asc',
    });
  });
});
