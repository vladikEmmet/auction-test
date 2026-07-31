import type { AuctionType, BetItemDto, RoutePointDto } from '@/shared/api/contracts';
import { CURRENT_USER } from '@/shared/config/env';
import { roundMoney } from '@/shared/lib/bet-rules';
import { COMPETITORS } from '@/shared/api/msw/dictionaries';
import { CITY_DICTIONARY } from '@/shared/config/cities';
import { apiDate, HOUR } from '@/shared/api/msw/seed/lib';
import { withoutVat } from '@/shared/api/msw/vat';

export function buildRoutePoint(params: {
  rowNum: number;
  opType: 'Loading' | 'Unloading';
  cityIndex: number;
  date: Date;
  cargoName: string;
  weight: number;
  volume: number;
  hideContacts: boolean;
}): RoutePointDto {
  const city = CITY_DICTIONARY[params.cityIndex % CITY_DICTIONARY.length]!;

  return {
    row_num: params.rowNum,
    op_type: params.opType,
    start_date: apiDate(params.date),
    end_date: apiDate(new Date(params.date.getTime() + 9 * HOUR)),
    comment: null,
    contractor: '',
    contractor_inn: '',
    location: {
      city_name: city.name,
      city_full_name: city.fullName,
      city_gc_id: city.gcId,
      loading_address: params.hideContacts ? '' : `ул. Транспортная, ${params.rowNum * 7}`,
      lon: city.lon,
      lat: city.lat,
    },
    cargo: {
      name: params.cargoName,
      package_name: 'Паллета',
      weight: params.weight.toFixed(3),
      volume: params.volume.toFixed(3),
      length: '0',
      width: '0',
      height: '0',
      oversized: false,
      package_amount: null,
    },
    contact: {
      name: params.hideContacts ? '' : 'Смирнов Алексей',
      phone: params.hideContacts ? '' : '+79004561122',
    },
  };
}

export function buildBets(params: {
  auctionId: number;
  aucType: AuctionType;
  startPrice: number;
  step: number;
  createdAt: Date;
  paymentForm: string;
  competitorBets: number;
  ownBet: boolean;
  rejectedBet: boolean;
  winnerBet: boolean;
  startId: number;
}): BetItemDto[] {
  const bets: BetItemDto[] = [];
  const direction = params.aucType === 'Up' ? 1 : -1;
  let betId = params.startId;

  const makeBet = (
    price: number,
    offsetMinutes: number,
    party: { id: number; name: string; inn: string; subscriberId: number; contact: string },
    overrides: Partial<BetItemDto> = {},
  ): BetItemDto => {
    const priceWithVat = roundMoney(price);
    const priceNoVat = withoutVat(priceWithVat);
    return {
      id: betId++,
      created_at: apiDate(new Date(params.createdAt.getTime() + offsetMinutes * 60_000)),
      auction_id: params.auctionId,
      subscriber_id: party.subscriberId,
      contact_name: party.contact,
      contact_phone: '+79001112233',
      price_with_vat: priceWithVat,
      price_no_vat: priceNoVat,
      organization_id: party.id,
      organization_inn: party.inn,
      organization_name: party.name,
      transporter_comment: null,
      is_rejected: false,
      is_counter: false,
      place: null,
      is_win: false,
      run_number: 0,
      cancel_reason: '',
      price_info: {
        price_with_vat: priceWithVat,
        price_no_vat: priceNoVat,
        payment_type: params.paymentForm,
        vat_rate: '20',
      },
      ...overrides,
    };
  };

  for (let index = 0; index < params.competitorBets; index += 1) {
    const competitor = COMPETITORS[index % COMPETITORS.length]!;
    bets.push(
      makeBet(params.startPrice + direction * params.step * (index + 1), (index + 1) * 7, {
        id: competitor.id,
        name: competitor.name,
        inn: competitor.inn,
        subscriberId: competitor.subscriberId,
        contact: competitor.contact,
      }),
    );
  }

  if (params.ownBet) {
    bets.push(
      makeBet(
        params.startPrice + direction * params.step * (params.competitorBets + 1),
        (params.competitorBets + 1) * 7,
        {
          id: CURRENT_USER.organizationId,
          name: CURRENT_USER.organizationName,
          inn: CURRENT_USER.organizationInn,
          subscriberId: CURRENT_USER.subscriberId,
          contact: CURRENT_USER.contactName,
        },
        params.winnerBet ? { is_win: true } : {},
      ),
    );
  }

  if (params.rejectedBet) {
    const competitor = COMPETITORS[1]!;
    bets.push(
      makeBet(
        params.startPrice + direction * params.step * (params.competitorBets + 2),
        (params.competitorBets + 2) * 7,
        {
          id: competitor.id,
          name: competitor.name,
          inn: competitor.inn,
          subscriberId: competitor.subscriberId,
          contact: competitor.contact,
        },
        { is_rejected: true, cancel_reason: 'Перевозчик отозвал ставку: нет свободного ТС' },
      ),
    );
  }

  return bets;
}
