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
};

export type BetsSummaryVm = {
  bets: BetVm[];
  /** Участники считаются по уникальным организациям, а не по числу ставок. */
  participantsCount: number;
  activeCount: number;
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
  };
}

export function toBetsSummaryVm(dtos: BetItemDto[]): BetsSummaryVm {
  const bets = dtos.map(toBetVm);
  const active = bets.filter((bet) => !bet.isRejected);
  const myBets = active.filter((bet) => bet.isMine);

  return {
    bets,
    participantsCount: new Set(dtos.filter((bet) => !bet.is_rejected).map((bet) => bet.organization_id))
      .size,
    activeCount: active.length,
    rejectedCount: bets.length - active.length,
    myBestBet:
      myBets.length === 0
        ? null
        : myBets.reduce((best, bet) => ((bet.place ?? Infinity) < (best.place ?? Infinity) ? bet : best)),
  };
}
