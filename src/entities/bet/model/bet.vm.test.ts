import { describe, expect, it } from 'vitest';

import { toBetsSummaryVm, toBetVm } from '@/entities/bet/model/bet.vm';
import type { BetItemDto } from '@/shared/api/contracts';
import { CURRENT_USER } from '@/shared/config/env';

const OTHER_ORGANIZATION = 21;

const dto = (overrides: Partial<BetItemDto> & Pick<BetItemDto, 'id'>): BetItemDto => ({
  created_at: '2026-07-30T12:00:00',
  auction_id: 1000,
  subscriber_id: 31,
  contact_name: 'Петров Пётр',
  contact_phone: '+79001112233',
  price_with_vat: 30_000,
  price_no_vat: 25_000,
  organization_id: OTHER_ORGANIZATION,
  organization_inn: '7701234567',
  organization_name: 'ООО Автовек',
  transporter_comment: null,
  is_rejected: false,
  is_counter: false,
  place: null,
  is_win: false,
  run_number: 0,
  cancel_reason: '',
  price_info: {
    price_with_vat: 30_000,
    price_no_vat: 25_000,
    payment_type: 'Безналичная с НДС',
    vat_rate: '20',
  },
  ...overrides,
});

const mine = (overrides: Partial<BetItemDto> & Pick<BetItemDto, 'id'>): BetItemDto =>
  dto({
    organization_id: CURRENT_USER.organizationId,
    organization_name: CURRENT_USER.organizationName,
    subscriber_id: CURRENT_USER.subscriberId,
    ...overrides,
  });

const byId = (summary: ReturnType<typeof toBetsSummaryVm>, id: number) =>
  summary.bets.find((bet) => bet.id === id);

describe('toBetVm', () => {
  it('предпочитает цены из price_info, но падает на плоские поля', () => {
    const withInfo = toBetVm(dto({ id: 1 }));
    expect(withInfo.priceWithVat).toBe(30_000);

    const withoutInfo = toBetVm(
      dto({
        id: 2,
        price_with_vat: 28_000,
        price_no_vat: 23_333,
        price_info: {
          price_with_vat: null,
          price_no_vat: null,
          payment_type: null,
          vat_rate: null,
        },
      }),
    );
    expect(withoutInfo.priceWithVat).toBe(28_000);
    expect(withoutInfo.priceNoVat).toBe(23_333);
  });

  it('пустую причину отмены превращает в null, а пустое имя — в заглушку', () => {
    const vm = toBetVm(dto({ id: 1, cancel_reason: '', organization_name: '' }));
    expect(vm.cancelReason).toBeNull();
    expect(vm.carrierName).toBe('Перевозчик скрыт');
  });

  it('помечает ставки своей организации', () => {
    expect(toBetVm(mine({ id: 1 })).isMine).toBe(true);
    expect(toBetVm(dto({ id: 2 })).isMine).toBe(false);
  });
});

describe('toBetsSummaryVm', () => {
  it('считает участников по организациям, а не по числу ставок', () => {
    const summary = toBetsSummaryVm([
      mine({ id: 1, created_at: '2026-07-30T12:00:00' }),
      mine({ id: 2, created_at: '2026-07-30T12:05:00' }),
      dto({ id: 3 }),
    ]);

    expect(summary.bets).toHaveLength(3);
    expect(summary.participantsCount).toBe(2);
  });

  it('перекрытой считает прошлую ставку организации, действующей — ту, у которой место', () => {
    const summary = toBetsSummaryVm([
      mine({
        id: 1,
        created_at: '2026-07-30T12:00:00',
        price_with_vat: 30_000,
        place: null,
      }),
      mine({
        id: 2,
        created_at: '2026-07-30T12:05:00',
        price_with_vat: 29_000,
        place: 1,
      }),
    ]);

    expect(byId(summary, 1)?.isSuperseded).toBe(true);
    expect(byId(summary, 2)?.isSuperseded).toBe(false);
    expect(summary.supersededCount).toBe(1);
  });

  it('при скрытом рейтинге действующей считается последняя по времени ставка', () => {
    const summary = toBetsSummaryVm([
      mine({ id: 1, created_at: '2026-07-30T12:00:00' }),
      mine({ id: 2, created_at: '2026-07-30T12:07:00' }),
      mine({ id: 3, created_at: '2026-07-30T12:03:00' }),
    ]);

    expect(byId(summary, 2)?.isSuperseded).toBe(false);
    expect(byId(summary, 1)?.isSuperseded).toBe(true);
    expect(byId(summary, 3)?.isSuperseded).toBe(true);
  });

  it('при одинаковом времени действующей считается запись с большим id', () => {
    const summary = toBetsSummaryVm([
      mine({ id: 7, created_at: '2026-07-30T12:00:00' }),
      mine({ id: 9, created_at: '2026-07-30T12:00:00' }),
    ]);

    expect(byId(summary, 9)?.isSuperseded).toBe(false);
    expect(byId(summary, 7)?.isSuperseded).toBe(true);
  });

  it('перекрытие считается внутри организации, а не по всему аукциону', () => {
    const summary = toBetsSummaryVm([
      mine({ id: 1, created_at: '2026-07-30T12:00:00' }),
      dto({ id: 2, created_at: '2026-07-30T12:10:00' }),
    ]);

    expect(byId(summary, 1)?.isSuperseded).toBe(false);
    expect(byId(summary, 2)?.isSuperseded).toBe(false);
    expect(summary.supersededCount).toBe(0);
  });

  it('единственная ставка организации никогда не перекрыта', () => {
    const summary = toBetsSummaryVm([mine({ id: 1 })]);
    expect(byId(summary, 1)?.isSuperseded).toBe(false);
  });

  it('отменённые ставки не помечаются перекрытыми и не участвуют в подсчётах', () => {
    const summary = toBetsSummaryVm([
      mine({ id: 1, created_at: '2026-07-30T12:00:00' }),
      mine({
        id: 2,
        created_at: '2026-07-30T12:05:00',
        is_rejected: true,
        cancel_reason: 'Отозвана перевозчиком',
      }),
    ]);

    expect(byId(summary, 2)?.isSuperseded).toBe(false);
    expect(byId(summary, 2)?.cancelReason).toBe('Отозвана перевозчиком');

    expect(byId(summary, 1)?.isSuperseded).toBe(false);
    expect(summary.activeCount).toBe(1);
    expect(summary.rejectedCount).toBe(1);
    expect(summary.participantsCount).toBe(1);
  });

  it('находит лучшую собственную ставку по месту', () => {
    const summary = toBetsSummaryVm([
      mine({ id: 1, place: 3 }),
      mine({ id: 2, place: 1 }),
      dto({ id: 3, place: 2 }),
    ]);

    expect(summary.myBestBet?.id).toBe(2);
  });

  it('пустой список ставок не ломает подсчёты', () => {
    expect(toBetsSummaryVm([])).toMatchObject({
      bets: [],
      participantsCount: 0,
      activeCount: 0,
      supersededCount: 0,
      rejectedCount: 0,
      myBestBet: null,
    });
  });
});
