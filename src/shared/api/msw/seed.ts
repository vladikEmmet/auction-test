import type {
  AuctionShowResponseDto,
  AuctionStatus,
  AuctionType,
  BetItemDto,
  RoutePointDto,
  TradingStatus,
} from '@/shared/api/contracts';
import { CURRENT_USER } from '@/shared/config/env';
import { roundMoney } from '@/shared/lib/bet-rules';
import {
  BODY_TYPES,
  CARGO_NAMES,
  CITY_DICTIONARY,
  COMPETITORS,
  ORGANIZATIONS,
  PAYMENT_FORMS,
} from '@/shared/api/msw/dictionaries';
import { withoutVat, type AuctionRecord } from '@/shared/api/msw/store';

const TOTAL_AUCTIONS = 57;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Детерминированный PRNG: одинаковый сид — одинаковые данные между перезапусками. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** API отдаёт даты без смещения: `2026-05-26T09:00:00`. */
function apiDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function uuidFor(index: number): string {
  const tail = String(index + 1).padStart(12, '0');
  return `a0000000-0000-4000-8000-${tail}`;
}

type EdgeCase = {
  aucType: AuctionType;
  status: AuctionStatus;
  statusMobile: TradingStatus;
  canSetBet: boolean;
  hideBetsHistory?: boolean;
  hidePointsAndContacts?: boolean;
  noViewCargoPrice?: boolean;
  hidePlaces?: boolean;
  competitorBets?: number;
  ownBet?: boolean;
  rejectedBet?: boolean;
  winnerBet?: boolean;
  noCarRequirements?: boolean;
  noPriceBlockInList?: boolean;
  noYourBlockInList?: boolean;
  multiPoint?: boolean;
  noContacts?: boolean;
};

/**
 * Первые записи фиксируют edge cases схемы, чтобы их можно было открыть по прямой ссылке
 * и проверить руками. Остальные генерируются PRNG для наполнения списка и пагинации.
 */
const EDGE_CASES: EdgeCase[] = [
  // 1 — обычный аукцион на понижение с историей ставок, ставок пользователя нет.
  { aucType: 'Down', status: 'Auction', statusMobile: 'NotParticipating', canSetBet: true, competitorBets: 3 },
  // 2 — пользователь лидирует, доступно изменение ставки.
  { aucType: 'Up', status: 'Auction', statusMobile: 'Leading', canSetBet: true, competitorBets: 2, ownBet: true },
  // 3 — ставок нет вообще: empty state списка ставок.
  { aucType: 'FixPrice', status: 'Auction', statusMobile: 'NotParticipating', canSetBet: true, competitorBets: 0 },
  // 4 — история ставок скрыта организатором.
  {
    aucType: 'Request',
    status: 'Auction',
    statusMobile: 'NotParticipating',
    canSetBet: true,
    hideBetsHistory: true,
    competitorBets: 2,
  },
  // 5 — контакты и адреса скрыты, цена груза скрыта, пользователь перебит, ставка запрещена.
  {
    aucType: 'Down',
    status: 'DeterminateWinner',
    statusMobile: 'Losing',
    canSetBet: false,
    hidePointsAndContacts: true,
    noViewCargoPrice: true,
    competitorBets: 3,
    ownBet: true,
    noContacts: true,
  },
  // 6 — завершённый аукцион: есть победитель и отменённая ставка с причиной.
  {
    aucType: 'Down',
    status: 'Finished',
    statusMobile: 'Winner',
    canSetBet: false,
    competitorBets: 3,
    ownBet: true,
    rejectedBet: true,
    winnerBet: true,
  },
  // 7 — торги ещё не начались: в списке нет блоков price и your.
  {
    aucType: 'Down',
    status: 'Planning',
    statusMobile: 'NotParticipating',
    canSetBet: false,
    competitorBets: 0,
    noPriceBlockInList: true,
    noYourBlockInList: true,
  },
  // 8 — неизвестные enum-значения, скрытый рейтинг, нет требований к ТС, маршрут из 4 точек.
  {
    aucType: 'Unknown',
    status: 'Unknown',
    statusMobile: 'Unknown',
    canSetBet: false,
    hidePlaces: true,
    competitorBets: 2,
    noCarRequirements: true,
    multiPoint: true,
  },
  // 9 — статус «на рассмотрении»: есть в детальном DTO, но отсутствует в списочном.
  {
    aucType: 'Request',
    status: 'WaitDeal',
    statusMobile: 'OnPending',
    canSetBet: false,
    competitorBets: 2,
    ownBet: true,
  },
];

const AUC_TYPE_CYCLE: AuctionType[] = ['Down', 'Up', 'Request', 'FixPrice'];
const STATUS_CYCLE: AuctionStatus[] = [
  'Auction',
  'Auction',
  'Planning',
  'InProgress',
  'Finished',
  'Stopped',
  'Canceled',
  'WaitDeal',
];
const MOBILE_STATUS_CYCLE: TradingStatus[] = [
  'NotParticipating',
  'NotParticipating',
  'Leading',
  'Losing',
  'Confirmed',
  'Winner',
];

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function buildRoutePoint(params: {
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

function buildBets(params: {
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

function buildRecord(index: number, now: Date, random: () => number): AuctionRecord {
  const edge = EDGE_CASES[index];
  const aucType = edge?.aucType ?? pick(AUC_TYPE_CYCLE, index);
  const status = edge?.status ?? pick(STATUS_CYCLE, index);
  const statusMobile = edge?.statusMobile ?? pick(MOBILE_STATUS_CYCLE, index);
  const canSetBet = edge?.canSetBet ?? (status === 'Auction' && random() > 0.25);

  const organization = pick(ORGANIZATIONS, index);
  const loadCityIndex = index % CITY_DICTIONARY.length;
  const unloadCityIndex = (index * 5 + 3) % CITY_DICTIONARY.length;
  const cargoName = pick(CARGO_NAMES, index);
  const bodyType = pick(BODY_TYPES, index);
  const paymentForm = pick(PAYMENT_FORMS, index);

  const weight = roundMoney(1 + Math.floor(random() * 20));
  const volume = roundMoney(5 + Math.floor(random() * 78));
  const distance = 150 + Math.floor(random() * 2500);

  const createdAt = new Date(now.getTime() - (index + 1) * 3 * HOUR);
  const startTime = new Date(now.getTime() - HOUR + (index % 7) * HOUR);
  const stopTime = new Date(startTime.getTime() + 2 * HOUR);
  const loadDate = new Date(now.getTime() + ((index % 12) + 1) * DAY);
  const unloadDate = new Date(loadDate.getTime() + 2 * DAY);

  const startPrice = 30_000 + Math.floor(random() * 40) * 2_500;
  const step = 500;
  const competitorBets = edge?.competitorBets ?? (random() > 0.4 ? Math.floor(random() * 3) + 1 : 0);
  const ownBet = edge?.ownBet ?? ['Leading', 'Losing', 'Winner', 'Confirmed'].includes(statusMobile);

  const bets = buildBets({
    auctionId: 1000 + index,
    aucType,
    startPrice,
    step,
    createdAt,
    paymentForm,
    competitorBets,
    ownBet,
    rejectedBet: edge?.rejectedBet ?? false,
    winnerBet: edge?.winnerBet ?? false,
    startId: index * 20 + 1,
  });

  const activeBets = bets.filter((bet) => !bet.is_rejected);
  const currentPrice = activeBets.at(-1)?.price_with_vat ?? startPrice;
  const available =
    aucType === 'Up'
      ? roundMoney(currentPrice + step)
      : aucType === 'FixPrice'
        ? currentPrice
        : roundMoney(currentPrice - step);

  const ownBets = activeBets.filter((bet) => bet.organization_id === CURRENT_USER.organizationId);
  const ownLastBet = ownBets.at(-1) ?? null;

  const hideContacts = edge?.hidePointsAndContacts ?? false;
  const pointCount = edge?.multiPoint ? 2 : 1;

  const routes: RoutePointDto[] = [];
  let rowNum = 1;
  for (let point = 0; point < pointCount; point += 1) {
    routes.push(
      buildRoutePoint({
        rowNum: rowNum++,
        opType: 'Loading',
        cityIndex: loadCityIndex + point,
        date: new Date(loadDate.getTime() + point * DAY),
        cargoName,
        weight: roundMoney(weight / pointCount),
        volume: roundMoney(volume / pointCount),
        hideContacts,
      }),
    );
  }
  for (let point = 0; point < pointCount; point += 1) {
    routes.push(
      buildRoutePoint({
        rowNum: rowNum++,
        opType: 'Unloading',
        cityIndex: unloadCityIndex + point,
        date: new Date(unloadDate.getTime() + point * DAY),
        cargoName,
        weight: roundMoney(weight / pointCount),
        volume: roundMoney(volume / pointCount),
        hideContacts,
      }),
    );
  }

  const hideBetsHistory = edge?.hideBetsHistory ?? false;
  const currentNoVat = withoutVat(currentPrice);

  const detail: AuctionShowResponseDto = {
    main: {
      id: 1000 + index,
      cargo_num: String(1_000_000 + index).padStart(11, '0'),
      cargo_date: apiDate(createdAt),
      order_uid: uuidFor(index),
      auc_type: aucType,
      created_at: apiDate(createdAt),
    },
    organizer: {
      subscriber_id: organization.subscriberId,
      subscriber_code: String(10_000 + organization.subscriberId),
      infobase_code: 'RU_Cargo_01',
      organization_name: organization.name,
      organization_inn: organization.inn,
      organization_kpp: organization.kpp,
      organization_id: organization.id,
    },
    contacts:
      hideContacts || edge?.noContacts
        ? []
        : [
            {
              name: 'Иванов Иван Иванович',
              phone: '+79001234567',
              work_phone: index % 3 === 0 ? null : '+74951234567',
              uid: `c0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
              email: 'ivanov@example.com',
            },
          ],
    cargo: {
      price: edge?.noViewCargoPrice ? '0' : String(150_000 + index * 1_000),
      currency: 643,
      is_international: false,
      distance,
      truck_count: 1,
      body_type: bodyType,
      temp_from: bodyType === 'рефрижератор' ? -18 : null,
      temp_to: bodyType === 'рефрижератор' ? -12 : null,
      conics: null,
      belts: index % 4 === 0 ? 6 : null,
      adr: null,
      coupling: null,
      air_pass: null,
      low_loader: null,
      additional_load: null,
      containered: false,
      container_type: null,
      container_size: null,
      loading_types: {
        side: index % 2 === 0,
        top: index % 3 === 0,
        rear: true,
        full: false,
      },
      docs: {
        tir: false,
        cmr: index % 5 === 0,
        t1: false,
        med: bodyType === 'рефрижератор',
      },
      car: edge?.noCarRequirements
        ? null
        : { type: 'Тягач', weight: 20, volume: 82, width: 2.45, length: 13.6, height: 2.7 },
    },
    trading: {
      status,
      status_mobile: statusMobile,
      start_time: apiDate(startTime),
      stop_time: apiDate(stopTime),
      bid_measurement_type: index % 9 === 4 ? 'PerKm' : 'PerRoute',
      can_set_bet: canSetBet,
      allow_counter_bets: index % 3 !== 0,
      hide_bets_history: hideBetsHistory,
      hide_places: edge?.hidePlaces ?? false,
      no_view_cargo_price: edge?.noViewCargoPrice ?? false,
      hide_points_address_and_contacts: hideContacts,
      is_bidder: ownBets.length > 0,
      is_favorite: index % 6 === 0,
      is_last_bet_with_vat: ownLastBet ? true : null,
      red_bet_with_vat: false,
      red_bet_no_vat: false,
      send_deal_before_load: false,
      chat_id: null,
      price: {
        start: startPrice,
        start_no_vat: withoutVat(startPrice),
        current: currentPrice,
        current_no_vat: currentNoVat,
        available,
        available_no_vat: withoutVat(available),
        min: aucType === 'Down' ? roundMoney(startPrice * 0.6) : startPrice,
        min_no_vat: withoutVat(aucType === 'Down' ? roundMoney(startPrice * 0.6) : startPrice),
        max: aucType === 'Up' ? roundMoney(startPrice * 1.6) : startPrice,
        max_no_vat: withoutVat(aucType === 'Up' ? roundMoney(startPrice * 1.6) : startPrice),
        step,
        step_no_vat: withoutVat(step),
        price_per_km: distance ? roundMoney(currentNoVat / distance) : 0,
      },
      your: {
        bet: ownLastBet != null,
        last_bet: ownLastBet ? ownLastBet.price_no_vat : null,
        last_bet_with_vat: ownLastBet ? ownLastBet.price_with_vat : null,
        win: edge?.winnerBet ?? false,
      },
      settings: {
        prolong_after_bet: index % 4 === 0 ? 10 : null,
        winner_confirm: 1,
        winner_counter_mode: null,
        transmission_time_in: 24,
        coefficient: index % 5 === 0 ? 10 : null,
      },
    },
    payment: {
      condition: 'По оригиналам накладных (ТН, ТТН, CMR)',
      condition_predefined: 'ПоОригиналамНакладных',
      form: paymentForm,
      delay: index % 3 === 0 ? 30 : 14,
      delay_type: index % 3 === 0 ? 'CalendarDays' : 'WorkDays',
      currency_code: '643',
      prepay: '0',
    },
    assembly: {
      num: index % 8 === 0 ? `СБ-${1000 + index}` : null,
      date: index % 8 === 0 ? apiDate(createdAt) : null,
    },
    routes,
    admitted_organizations:
      index % 4 === 0
        ? [
            {
              id: CURRENT_USER.organizationId,
              inn: CURRENT_USER.organizationInn,
              is_main: true,
              name: CURRENT_USER.organizationName,
              full_name: `Общество с ограниченной ответственностью «${CURRENT_USER.organizationName}»`,
              site: null,
              subscriber_id: CURRENT_USER.subscriberId,
              subscriber_code: CURRENT_USER.subscriberCode,
              subscriber_role: null,
              infobase_code: 'RU_Cargo_01',
              infobase_address: null,
              nalog_key: null,
              hide_me: false,
              current_vat_rate: '20',
            },
          ]
        : [],
    hide_bets_history: hideBetsHistory,
  };

  return {
    uuid: uuidFor(index),
    detail,
    bets,
    list: {
      prioritySort: index % 10,
      isAssembly: detail.assembly.num != null,
      isHideOrganization: index % 11 === 0,
      isAvailable: canSetBet && status === 'Auction',
      isAccredited: index % 3 !== 2,
      direction: null,
      comment: index % 7 === 0 ? 'Требуется гидроборт' : null,
      consignor: null,
      consignee: null,
      hasPriceBlock: !(edge?.noPriceBlockInList ?? false),
      hasYourBlock: !(edge?.noYourBlockInList ?? false),
    },
  };
}

/** Собирает набор аукционов. `now` фиксируется в тестах для воспроизводимости. */
export function createSeed(now: Date = new Date(), seed = 20260730): AuctionRecord[] {
  const random = mulberry32(seed);
  return Array.from({ length: TOTAL_AUCTIONS }, (_, index) => buildRecord(index, now, random));
}

export { uuidFor };
