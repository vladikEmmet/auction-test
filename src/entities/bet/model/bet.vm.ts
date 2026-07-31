import type { BetItemDto } from '@/shared/api/contracts';
import { CURRENT_USER } from '@/shared/config/env';

export type BetVm = {
  id: number;
  createdAt: string;
  carrierName: string;
  carrierInn: string;
  contactName: string | null;
  priceWithVat: number;
  priceNoVat: number;
  vatRate: string | null;
  paymentType: string | null;
  place: number | null;
  isWinner: boolean;
  isRejected: boolean;
  cancelReason: string | null;
  isCounter: boolean;
  isMine: boolean;
  comment: string | null;
  /**
   * Ставка перекрыта более поздней ставкой того же перевозчика. В DTO такого признака нет —
   * он выводится на клиенте, потому что история торгов хранит все ставки, а действующей
   * у каждой организации остаётся одна.
   */
  isSuperseded: boolean;
};

export type BetsSummaryVm = {
  bets: BetVm[];
  /** Участники считаются по уникальным организациям, а не по числу ставок. */
  participantsCount: number;
  activeCount: number;
  /** Ставки, перекрытые более поздними ставками тех же перевозчиков. */
  supersededCount: number;
  rejectedCount: number;
  myBestBet: BetVm | null;
};

export function toBetVm(dto: BetItemDto): BetVm {
  return {
    id: dto.id,
    createdAt: dto.created_at,
    carrierName: dto.organization_name || 'Перевозчик скрыт',
    carrierInn: dto.organization_inn,
    contactName: dto.contact_name || null,
    priceWithVat: dto.price_info.price_with_vat ?? dto.price_with_vat,
    priceNoVat: dto.price_info.price_no_vat ?? dto.price_no_vat,
    vatRate: dto.price_info.vat_rate ?? null,
    paymentType: dto.price_info.payment_type ?? null,
    place: dto.place ?? null,
    isWinner: dto.is_win,
    isRejected: dto.is_rejected,
    // В схеме причина — пустая строка, когда ставка не отменена.
    cancelReason: dto.cancel_reason ? dto.cancel_reason : null,
    isCounter: dto.is_counter,
    isMine: dto.organization_id === CURRENT_USER.organizationId,
    comment: dto.transporter_comment ?? null,
    isSuperseded: false,
  };
}

/**
 * Находит id действующих ставок — по одной на организацию.
 *
 * Если сервер проставил места, действующими считаются ставки с местом: это его решение,
 * и спорить с ним клиент не должен. Когда рейтинг скрыт (`hide_places`), места приходят
 * пустыми у всех — тогда действующей считается последняя по времени ставка организации.
 */
function findCurrentBetIds(dtos: BetItemDto[]): Set<number> {
  const active = dtos.filter((dto) => !dto.is_rejected);
  const byOrganization = new Map<number, BetItemDto[]>();

  for (const dto of active) {
    const group = byOrganization.get(dto.organization_id);
    if (group) group.push(dto);
    else byOrganization.set(dto.organization_id, [dto]);
  }

  const current = new Set<number>();

  for (const group of byOrganization.values()) {
    const ranked = group.filter((dto) => dto.place != null);

    if (ranked.length > 0) {
      for (const dto of ranked) current.add(dto.id);
      continue;
    }

    const latest = group.reduce((best, dto) => {
      const diff = new Date(dto.created_at).getTime() - new Date(best.created_at).getTime();
      // При одинаковом времени берём запись с большим id: она создана позже.
      return diff > 0 || (diff === 0 && dto.id > best.id) ? dto : best;
    });
    current.add(latest.id);
  }

  return current;
}

export function toBetsSummaryVm(dtos: BetItemDto[]): BetsSummaryVm {
  const currentIds = findCurrentBetIds(dtos);

  const bets = dtos.map((dto) => ({
    ...toBetVm(dto),
    isSuperseded: !dto.is_rejected && !currentIds.has(dto.id),
  }));

  const active = bets.filter((bet) => !bet.isRejected);
  const myBets = active.filter((bet) => bet.isMine);

  return {
    bets,
    participantsCount: new Set(dtos.filter((bet) => !bet.is_rejected).map((bet) => bet.organization_id))
      .size,
    activeCount: active.length,
    supersededCount: active.filter((bet) => bet.isSuperseded).length,
    rejectedCount: bets.length - active.length,
    myBestBet:
      myBets.length === 0
        ? null
        : myBets.reduce((best, bet) => ((bet.place ?? Infinity) < (best.place ?? Infinity) ? bet : best)),
  };
}
