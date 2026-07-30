import { describe, expect, it } from 'vitest';

import { toAuctionCardVm } from '@/entities/auction/model/auction-card.vm';
import { toAuctionDetailVm } from '@/entities/auction/model/auction-detail.vm';
import { getPrimaryAction } from '@/entities/auction/model/primary-action';
import { createSeed } from '@/shared/api/msw/seed';
import { toListItem, type AuctionRecord } from '@/shared/api/msw/store';

/** Фиксированная дата — данные сида детерминированы и в тестах, и в браузере. */
const seed = createSeed(new Date('2026-07-30T12:00:00'));

const record = (index: number): AuctionRecord => {
  const item = seed[index];
  if (!item) throw new Error(`В сиде нет записи ${index}`);
  return item;
};

describe('toAuctionCardVm', () => {
  it('берёт uuid для роутинга из order_uid', () => {
    const vm = toAuctionCardVm(toListItem(record(0)));
    expect(vm.uuid).toBe(record(0).detail.main.order_uid);
  });

  it('переводит enum-значения в подписи', () => {
    const vm = toAuctionCardVm(toListItem(record(0)));
    expect(vm.aucTypeLabel).toBe('На понижение');
    expect(vm.statusLabel).toBe('Торги идут');
    expect(vm.tradingStatusLabel).toBe('Не участвую');
  });

  it('шаг ставки в списочном DTO отсутствует и остаётся null', () => {
    expect(toAuctionCardVm(toListItem(record(0))).price.step).toBeNull();
  });

  it('переживает отсутствие блоков price и your', () => {
    // Седьмая запись сида: торги в статусе Planning, блоки price/your в списке = null.
    const vm = toAuctionCardVm(toListItem(record(6)));
    expect(vm.price.current).toBeNull();
    expect(vm.price.perKm).toBeNull();
    expect(vm.yourBet).toEqual({ hasBet: false, lastBet: null });
  });

  it('скрывает адреса, когда взведён hide_points_address_and_contacts', () => {
    const vm = toAuctionCardVm(toListItem(record(4)));
    expect(vm.route.addressHidden).toBe(true);
    expect(vm.route.fromAddress).toBeNull();
    expect(vm.route.toAddress).toBeNull();
    // Город при этом остаётся видимым.
    expect(vm.route.fromCity).not.toBe('');
  });

  it('схлопывает незнакомый торговый статус в Unknown', () => {
    // Девятая запись: status_mobile = OnPending, которого нет в списочном enum.
    const listItem = toListItem(record(8));
    expect(listItem.trading.status_mobile).toBe('Unknown');
    expect(toAuctionCardVm(listItem).tradingStatusLabel).toBe('Неизвестный статус');
  });
});

describe('toAuctionDetailVm', () => {
  it('собирает маршрут в порядке row_num и делит точки на погрузку/выгрузку', () => {
    const vm = toAuctionDetailVm(record(7).detail);
    expect(vm.route.points.map((point) => point.rowNum)).toEqual([1, 2, 3, 4]);
    expect(vm.route.points.filter((point) => point.isLoading)).toHaveLength(2);
    expect(vm.route.fromCity).toBe(vm.route.points[0]?.city);
  });

  it('скрывает контакты и адреса по флагу DTO', () => {
    const vm = toAuctionDetailVm(record(4).detail);
    expect(vm.restrictions.hidePointsAddressAndContacts).toBe(true);
    expect(vm.contacts).toEqual([]);
    expect(vm.route.points.every((point) => point.address === null)).toBe(true);
    expect(vm.route.points.every((point) => point.contact === null)).toBe(true);
  });

  it('скрывает цену груза по no_view_cargo_price', () => {
    expect(toAuctionDetailVm(record(4).detail).cargo.price).toBeNull();
    expect(toAuctionDetailVm(record(0).detail).cargo.price).not.toBeNull();
  });

  it('учитывает hide_bets_history из любого из двух мест контракта', () => {
    const detail = structuredClone(record(0).detail);
    expect(toAuctionDetailVm(detail).restrictions.hideBetsHistory).toBe(false);

    detail.hide_bets_history = true;
    expect(toAuctionDetailVm(detail).restrictions.hideBetsHistory).toBe(true);

    detail.hide_bets_history = false;
    detail.trading.hide_bets_history = true;
    expect(toAuctionDetailVm(detail).restrictions.hideBetsHistory).toBe(true);
  });

  it('отдаёт null вместо требований к ТС, когда car = null', () => {
    expect(toAuctionDetailVm(record(7).detail).cargo.car).toBeNull();
    expect(toAuctionDetailVm(record(0).detail).cargo.car).not.toBeNull();
  });

  it('собирает подпись отсрочки платежа из delay и delay_type', () => {
    const vm = toAuctionDetailVm(record(0).detail);
    expect(vm.payment.delayLabel).toMatch(/^\d+ (календарных|рабочих) дней$/);
  });

  it('превращает флаги погрузки и документов в списки подписей', () => {
    const detail = structuredClone(record(0).detail);
    detail.cargo.loading_types = { side: true, top: false, rear: true, full: false };
    detail.cargo.docs = { tir: false, cmr: true, t1: false, med: false };

    const vm = toAuctionDetailVm(detail);
    expect(vm.cargo.loadingTypes).toEqual(['боковая', 'задняя']);
    expect(vm.cargo.docs).toEqual(['CMR']);
  });
});

describe('getPrimaryAction', () => {
  const auction = (overrides: Partial<Parameters<typeof getPrimaryAction>[0]>) =>
    getPrimaryAction({
      canSetBet: false,
      isBidder: false,
      yourBet: { hasBet: false, lastBet: null },
      status: 'Auction',
      ...overrides,
    });

  it('предлагает сделать ставку, когда торги открыты и ставки нет', () => {
    expect(auction({ canSetBet: true }).kind).toBe('set-bet');
  });

  it('предлагает изменить ставку, когда своя ставка уже есть', () => {
    expect(auction({ canSetBet: true, yourBet: { hasBet: true, lastBet: 100 } }).kind).toBe(
      'edit-bet',
    );
  });

  it('участнику закрытых торгов показывает ставки', () => {
    expect(auction({ isBidder: true }).kind).toBe('view-bets');
  });

  it('в остальных случаях отдаёт disabled с причиной', () => {
    const planning = auction({ status: 'Planning' });
    expect(planning.kind).toBe('disabled');
    expect(planning.kind === 'disabled' && planning.reason).toBe('Торги ещё не начались');

    const finished = auction({ status: 'Finished' });
    expect(finished.kind === 'disabled' && finished.reason).toBe('Торги завершены');
  });
});
