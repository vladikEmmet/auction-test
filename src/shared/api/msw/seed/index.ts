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
import { BODY_TYPES, CARGO_NAMES, ORGANIZATIONS, PAYMENT_FORMS } from '@/shared/api/msw/dictionaries';
import { CITY_DICTIONARY } from '@/shared/config/cities';
import type { AuctionRecord } from '@/shared/api/msw/db';
import { recalculatePlaces } from '@/shared/api/msw/ranking';
import { withoutVat } from '@/shared/api/msw/vat';
import { buildBets, buildRoutePoint } from '@/shared/api/msw/seed/builders';
import {
  AUC_TYPE_CYCLE,
  EDGE_CASES,
  type EdgeCase,
  MOBILE_STATUS_CYCLE,
  STATUS_CYCLE,
} from '@/shared/api/msw/seed/edge-cases';
import { apiDate, DAY, HOUR, mulberry32, pick, uuidFor } from '@/shared/api/msw/seed/lib';

const TOTAL_AUCTIONS = 57;

/** Точки маршрута: сначала все погрузки, затем все выгрузки, нумерация сквозная. */
function buildRoutes(params: {
  pointCount: number;
  loadCityIndex: number;
  unloadCityIndex: number;
  loadDate: Date;
  unloadDate: Date;
  cargoName: string;
  weight: number;
  volume: number;
  hideContacts: boolean;
}): RoutePointDto[] {
  const routes: RoutePointDto[] = [];
  let rowNum = 1;

  for (const [opType, cityIndex, date] of [
    ['Loading', params.loadCityIndex, params.loadDate],
    ['Unloading', params.unloadCityIndex, params.unloadDate],
  ] as const) {
    for (let point = 0; point < params.pointCount; point += 1) {
      routes.push(
        buildRoutePoint({
          rowNum: rowNum++,
          opType,
          cityIndex: cityIndex + point,
          date: new Date(date.getTime() + point * DAY),
          cargoName: params.cargoName,
          weight: roundMoney(params.weight / params.pointCount),
          volume: roundMoney(params.volume / params.pointCount),
          hideContacts: params.hideContacts,
        }),
      );
    }
  }

  return routes;
}

/** Груз и требования к ТС: часть значений зависит от типа кузова и edge case. */
function buildCargo(params: {
  index: number;
  bodyType: string;
  distance: number;
  noViewCargoPrice: boolean;
  noCarRequirements: boolean;
}): AuctionShowResponseDto['cargo'] {
  const { index, bodyType, distance, noViewCargoPrice, noCarRequirements } = params;

  return {
    price: noViewCargoPrice ? '0' : String(150_000 + index * 1_000),
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
    car: noCarRequirements
      ? null
      : { type: 'Тягач', weight: 20, volume: 82, width: 2.45, length: 13.6, height: 2.7 },
  };
}

/** Параметры торгов: цены, флаги видимости и состояние ставки пользователя. */
function buildTrading(params: {
  index: number;
  edge: EdgeCase | undefined;
  status: AuctionStatus;
  statusMobile: TradingStatus;
  canSetBet: boolean;
  aucType: AuctionType;
  startTime: Date;
  stopTime: Date;
  startPrice: number;
  currentPrice: number;
  currentNoVat: number;
  available: number;
  step: number;
  distance: number;
  hideContacts: boolean;
  hideBetsHistory: boolean;
  ownLastBet: BetItemDto | null;
}): AuctionShowResponseDto['trading'] {
  const {
    index,
    edge,
    status,
    statusMobile,
    canSetBet,
    aucType,
    startTime,
    stopTime,
    startPrice,
    currentPrice,
    currentNoVat,
    available,
    step,
    distance,
    hideContacts,
    hideBetsHistory,
    ownLastBet,
  } = params;

  return {
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
    is_bidder: ownLastBet != null,
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
  };
}

function buildPayment(index: number, paymentForm: string): AuctionShowResponseDto['payment'] {
  return {
    condition: 'По оригиналам накладных (ТН, ТТН, CMR)',
    condition_predefined: 'ПоОригиналамНакладных',
    form: paymentForm,
    delay: index % 3 === 0 ? 30 : 14,
    delay_type: index % 3 === 0 ? 'CalendarDays' : 'WorkDays',
    currency_code: '643',
    prepay: '0',
  };
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

  const routes = buildRoutes({
    pointCount,
    loadCityIndex,
    unloadCityIndex,
    loadDate,
    unloadDate,
    cargoName,
    weight,
    volume,
    hideContacts,
  });

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
    cargo: buildCargo({
      index,
      bodyType,
      distance,
      noViewCargoPrice: edge?.noViewCargoPrice ?? false,
      noCarRequirements: edge?.noCarRequirements ?? false,
    }),
    trading: buildTrading({
      index,
      edge,
      status,
      statusMobile,
      canSetBet,
      aucType,
      startTime,
      stopTime,
      startPrice,
      currentPrice,
      currentNoVat,
      available,
      step,
      distance,
      hideContacts,
      hideBetsHistory,
      ownLastBet,
    }),
    payment: buildPayment(index, paymentForm),
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

  const record: AuctionRecord = {
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

  // Места считаются той же функцией, что и после ставки: иначе в сиде рейтинг пустой.
  recalculatePlaces(record);
  return record;
}

/** Собирает набор аукционов. `now` фиксируется в тестах для воспроизводимости. */
export function createSeed(now: Date = new Date(), seed = 20260730): AuctionRecord[] {
  const random = mulberry32(seed);
  return Array.from({ length: TOTAL_AUCTIONS }, (_, index) => buildRecord(index, now, random));
}

export { uuidFor };
