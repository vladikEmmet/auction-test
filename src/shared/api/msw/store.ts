import type {
  AuctionListItemDto,
  AuctionListRequestDto,
  AuctionListResponseDto,
  AuctionShowResponseDto,
  AuctionType,
  BetItemDto,
  ListTradingStatus,
  TradingStatus,
  ValidationErrorDto,
} from '@/shared/api/contracts';
import {
  AUCTION_STATUS_CODES,
  LIST_TRADING_STATUSES,
  TRADING_STATUS_CODES,
} from '@/shared/api/contracts';
import { CURRENT_USER } from '@/shared/config/env';
import {
  getBetConstraintsFromDto,
  isBetterBet,
  roundMoney,
  validateBetPrice,
} from '@/shared/lib/bet-rules';

export const VAT_RATE = 0.2;

export function withoutVat(value: number): number {
  return roundMoney(value / (1 + VAT_RATE));
}

/**
 * Запись мок-базы. Источник правды — `detail`; элемент списка строится проекцией,
 * поэтому после мутации список, деталка и ставки не могут разойтись.
 */
export type AuctionRecord = {
  uuid: string;
  detail: AuctionShowResponseDto;
  bets: BetItemDto[];
  /** Поля, которые есть только в списочном DTO. */
  list: {
    prioritySort: number;
    isAssembly: boolean;
    isHideOrganization: boolean;
    isAvailable: boolean;
    isAccredited: boolean;
    direction: string | null;
    comment: string | null;
    consignor: string | null;
    consignee: string | null;
    /** Список объявляет trading.price и trading.your nullable — воспроизводим и этот случай. */
    hasPriceBlock: boolean;
    hasYourBlock: boolean;
  };
};

let records: AuctionRecord[] = [];
let nextBetId = 1;

export function resetStore(seed: AuctionRecord[]): void {
  records = seed.map(cloneRecord);
  nextBetId = records.reduce(
    (max, record) => record.bets.reduce((inner, bet) => Math.max(inner, bet.id), max),
    0,
  ) + 1;
}

export function getRecords(): AuctionRecord[] {
  return records;
}

function cloneRecord(record: AuctionRecord): AuctionRecord {
  return structuredClone(record);
}

/* ------------------------------------------------------------------ проекции */

function toListTradingStatus(status: TradingStatus): ListTradingStatus {
  return (LIST_TRADING_STATUSES as readonly string[]).includes(status)
    ? (status as ListTradingStatus)
    : 'Unknown';
}

function sumRouteCargo(record: AuctionRecord, field: 'weight' | 'volume'): number {
  return roundMoney(
    record.detail.routes
      .filter((point) => point.op_type === 'Loading')
      .reduce((sum, point) => sum + Number.parseFloat(point.cargo[field] || '0'), 0),
  );
}

export function toListItem(record: AuctionRecord): AuctionListItemDto {
  const { detail, list } = record;
  const loadPoints = detail.routes.filter((point) => point.op_type === 'Loading');
  const unloadPoints = detail.routes.filter((point) => point.op_type === 'Unloading');
  const load = loadPoints[0] ?? detail.routes[0];
  const unload = unloadPoints.at(-1) ?? detail.routes.at(-1);
  const price = detail.trading.price;
  const hideAddress = detail.trading.hide_points_address_and_contacts;

  return {
    main: {
      id: detail.main.id,
      cargo_num: detail.main.cargo_num,
      cargo_date: detail.main.cargo_date,
      auc_type: detail.main.auc_type,
      order_uid: detail.main.order_uid,
      created_at: detail.main.created_at,
      priority_sort: list.prioritySort,
      is_assembly: list.isAssembly,
      price_per_km: list.hasPriceBlock ? price.price_per_km : null,
    },
    organizer: {
      subscriber_id: detail.organizer.subscriber_id,
      organization_id: detail.organizer.organization_id,
      organization_name: detail.organizer.organization_name,
      organization_inn: detail.organizer.organization_inn,
      organization_kpp: detail.organizer.organization_kpp,
      is_hide_organization: list.isHideOrganization,
    },
    route: {
      load: {
        city: load?.location.city_name ?? '',
        address: hideAddress ? '' : (load?.location.loading_address ?? ''),
        date: load?.start_date ?? detail.trading.start_time,
        city_gc_id: load?.location.city_gc_id ?? 0,
        points_count: loadPoints.length,
      },
      unload: {
        city: unload?.location.city_name ?? '',
        address: hideAddress ? '' : (unload?.location.loading_address ?? ''),
        date: unload?.start_date ?? detail.trading.stop_time,
        city_gc_id: unload?.location.city_gc_id ?? 0,
        points_count: unloadPoints.length,
      },
    },
    cargo: {
      name: loadPoints[0]?.cargo.name ?? detail.routes[0]?.cargo.name ?? '',
      weight: sumRouteCargo(record, 'weight'),
      volume: sumRouteCargo(record, 'volume'),
      body_type: detail.cargo.body_type,
      truck_count: detail.cargo.truck_count,
      is_cargo: true,
      is_international: detail.cargo.is_international,
      containered: detail.cargo.containered,
      incoterms: null,
      conics: detail.cargo.conics,
      belts: detail.cargo.belts,
      adr: detail.cargo.adr,
      coupling: detail.cargo.coupling,
      air_pass: detail.cargo.air_pass,
      low_loader: detail.cargo.low_loader,
      additional_load: detail.cargo.additional_load,
      temp_from: detail.cargo.temp_from == null ? null : Math.round(detail.cargo.temp_from),
      temp_to: detail.cargo.temp_to == null ? null : Math.round(detail.cargo.temp_to),
      loading_types: detail.cargo.loading_types,
      docs: detail.cargo.docs,
      car: detail.cargo.car ?? null,
    },
    trading: {
      status: detail.trading.status,
      status_mobile: toListTradingStatus(detail.trading.status_mobile),
      start_time: detail.trading.start_time,
      stop_time: detail.trading.stop_time,
      bid_measurement_type: detail.trading.bid_measurement_type,
      can_set_bet: detail.trading.can_set_bet,
      allow_counter_bets: detail.trading.allow_counter_bets,
      hide_points_address_and_contacts: hideAddress,
      direction: list.direction,
      comment: list.comment,
      is_bidder: detail.trading.is_bidder,
      is_available: list.isAvailable,
      is_accredited: list.isAccredited,
      is_favorite: detail.trading.is_favorite,
      price:
        list.hasPriceBlock && price.start != null && price.current != null
          ? {
              start: price.start,
              current: price.current,
              current_no_vat: price.current_no_vat ?? withoutVat(price.current),
            }
          : null,
      your: list.hasYourBlock
        ? {
            bet: detail.trading.your.bet,
            // В списке доступно одно поле: показываем цену с НДС — как в примере схемы.
            last_bet: detail.trading.your.last_bet_with_vat ?? detail.trading.your.last_bet ?? null,
          }
        : null,
      red_bet_with_vat: detail.trading.red_bet_with_vat,
      red_bet_no_vat: detail.trading.red_bet_no_vat,
      is_last_bet_with_vat: detail.trading.is_last_bet_with_vat,
    },
    payment: {
      form: detail.payment.form,
      currency_code: detail.payment.currency_code,
      consignor: list.consignor,
      consignee: list.consignee,
    },
  };
}

/* ------------------------------------------------------------------ выборки */

function matchesCity(record: AuctionRecord, city: string, opType: 'Loading' | 'Unloading'): boolean {
  const needle = city.trim().toLowerCase();
  if (!needle) return true;
  return record.detail.routes.some(
    (point) =>
      point.op_type === opType && point.location.city_name.toLowerCase().includes(needle),
  );
}

function loadDate(record: AuctionRecord): number {
  const point = record.detail.routes.find((item) => item.op_type === 'Loading');
  return new Date(point?.start_date ?? record.detail.trading.start_time).getTime();
}

function matchesFilters(record: AuctionRecord, filters: AuctionListRequestDto): boolean {
  const { detail } = record;
  const trading = detail.trading;
  const price = trading.price.current;

  if (filters.cargo_num && !detail.main.cargo_num.includes(filters.cargo_num.trim())) return false;

  if (filters.status?.length && !filters.status.includes(trading.status_mobile)) return false;

  if (filters.mobile_statuses?.length) {
    const code = TRADING_STATUS_CODES[trading.status_mobile];
    if (code == null || !filters.mobile_statuses.includes(code)) return false;
  }

  if (filters.statuses?.length) {
    const code =
      trading.status === 'Unknown'
        ? null
        : AUCTION_STATUS_CODES[trading.status as keyof typeof AUCTION_STATUS_CODES];
    if (code == null || !filters.statuses.includes(code)) return false;
  }

  if (filters.auc_type?.length) {
    if (detail.main.auc_type === 'Unknown') return false;
    if (!filters.auc_type.includes(detail.main.auc_type as (typeof filters.auc_type)[number])) {
      return false;
    }
  }

  if (filters.load_city && !matchesCity(record, filters.load_city, 'Loading')) return false;
  if (filters.unload_city && !matchesCity(record, filters.unload_city, 'Unloading')) return false;

  if (filters.load_date_from && loadDate(record) < new Date(filters.load_date_from).getTime()) {
    return false;
  }
  if (filters.load_date_to && loadDate(record) > new Date(filters.load_date_to).getTime()) {
    return false;
  }

  if (filters.is_available === true && !record.list.isAvailable) return false;
  if (filters.is_bidder === true && !trading.is_bidder) return false;
  if (filters.is_favorite === true && !trading.is_favorite) return false;

  if (filters.current_price_from != null && (price == null || price < filters.current_price_from)) {
    return false;
  }
  if (filters.current_price_to != null && (price == null || price > filters.current_price_to)) {
    return false;
  }

  if (filters.body_types?.length && !filters.body_types.includes(detail.cargo.body_type)) {
    return false;
  }

  return true;
}

function sortValue(record: AuctionRecord, field: string): number {
  switch (field) {
    case 'current_price':
      return record.detail.trading.price.current ?? 0;
    case 'price_per_km':
      return record.detail.trading.price.price_per_km;
    case 'start_time':
      return new Date(record.detail.trading.start_time).getTime();
    case 'load_date':
      return loadDate(record);
    default:
      return record.detail.main.id;
  }
}

export function listAuctions(filters: AuctionListRequestDto): AuctionListResponseDto {
  const matched = records.filter((record) => matchesFilters(record, filters));

  const sortEntries = Object.entries(filters.sort ?? {});
  if (sortEntries.length > 0) {
    matched.sort((a, b) => {
      for (const [field, direction] of sortEntries) {
        const diff = sortValue(a, field) - sortValue(b, field);
        if (diff !== 0) return direction === 'asc' ? diff : -diff;
      }
      return 0;
    });
  } else {
    matched.sort((a, b) => {
      const diff = new Date(a.detail.main.created_at).getTime() - new Date(b.detail.main.created_at).getTime();
      return filters.is_oldest === true ? diff : -diff;
    });
  }

  const perPage = filters.per_page ?? 20;
  const page = filters.page ?? 1;
  const total = matched.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const pageItems = matched.slice(start, start + perPage);

  return {
    data: pageItems.map(toListItem),
    meta: {
      current_page: page,
      from: total === 0 ? 0 : start + 1,
      last_page: lastPage,
      per_page: perPage,
      to: total === 0 ? 0 : start + pageItems.length,
      total,
    },
  };
}

export function findRecord(uuid: string): AuctionRecord | undefined {
  return records.find((record) => record.uuid === uuid);
}

export function getAuction(uuid: string): AuctionShowResponseDto | undefined {
  return findRecord(uuid)?.detail;
}

export function getBets(uuid: string, all: boolean): BetItemDto[] | undefined {
  const record = findRecord(uuid);
  if (!record) return undefined;

  const bets = all ? record.bets : record.bets.filter((bet) => !bet.is_rejected);
  return bets.map((bet) => ({
    ...bet,
    // hide_places скрывает рейтинг, но не сами ставки.
    place: record.detail.trading.hide_places ? null : bet.place,
  }));
}

/* ------------------------------------------------------------------ мутации */

/** Пересчитывает места: рейтинг строится по лучшей активной ставке каждой организации. */
function recalculatePlaces(record: AuctionRecord): void {
  const aucType: AuctionType = record.detail.main.auc_type;
  const active = record.bets.filter((bet) => !bet.is_rejected);

  const bestByOrganization = new Map<number, BetItemDto>();
  for (const bet of active) {
    const current = bestByOrganization.get(bet.organization_id);
    if (!current || isBetterBet(bet.price_with_vat, current.price_with_vat, aucType)) {
      bestByOrganization.set(bet.organization_id, bet);
    }
  }

  const ranked = [...bestByOrganization.values()].sort((a, b) =>
    isBetterBet(a.price_with_vat, b.price_with_vat, aucType) ? -1 : 1,
  );
  const placeByBetId = new Map(ranked.map((bet, index) => [bet.id, index + 1]));

  for (const bet of record.bets) {
    bet.place = bet.is_rejected ? null : (placeByBetId.get(bet.id) ?? null);
  }
}

export type PlaceBetResult =
  | { ok: true; bet: BetItemDto }
  | { ok: false; errors: ValidationErrorDto[] };

export function placeBet(uuid: string, price: number): PlaceBetResult | undefined {
  const record = findRecord(uuid);
  if (!record) return undefined;

  const constraints = getBetConstraintsFromDto(record.detail);

  if (!constraints.canSetBet) {
    return {
      ok: false,
      errors: [
        {
          field: 'price',
          message: 'Ставки в этом аукционе сейчас недоступны.',
          code: 'bet_not_allowed',
        },
      ],
    };
  }

  const errors = validateBetPrice(price, constraints);
  if (errors.length > 0) return { ok: false, errors };

  const trading = record.detail.trading;
  const priceWithVat = roundMoney(price);
  const priceNoVat = withoutVat(priceWithVat);

  const bet: BetItemDto = {
    id: nextBetId++,
    created_at: new Date().toISOString().slice(0, 19),
    auction_id: record.detail.main.id,
    subscriber_id: CURRENT_USER.subscriberId,
    contact_name: CURRENT_USER.contactName,
    contact_phone: CURRENT_USER.contactPhone,
    price_with_vat: priceWithVat,
    price_no_vat: priceNoVat,
    organization_id: CURRENT_USER.organizationId,
    organization_inn: CURRENT_USER.organizationInn,
    organization_name: CURRENT_USER.organizationName,
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
      payment_type: record.detail.payment.form,
      vat_rate: String(VAT_RATE * 100),
    },
  };

  record.bets.push(bet);
  recalculatePlaces(record);

  // Текущая цена аукциона двигается к последней ставке.
  trading.price.current = priceWithVat;
  trading.price.current_no_vat = priceNoVat;
  trading.price.price_per_km = record.detail.cargo.distance
    ? roundMoney(priceNoVat / record.detail.cargo.distance)
    : 0;

  const step = trading.price.step ?? 0;
  if (step > 0) {
    const next =
      record.detail.main.auc_type === 'Up' ? priceWithVat + step : priceWithVat - step;
    trading.price.available = next > 0 ? roundMoney(next) : priceWithVat;
  } else {
    trading.price.available = priceWithVat;
  }
  trading.price.available_no_vat =
    trading.price.available == null ? null : withoutVat(trading.price.available);

  trading.your = {
    bet: true,
    last_bet: priceNoVat,
    last_bet_with_vat: priceWithVat,
    win: false,
  };
  trading.is_bidder = true;
  trading.is_last_bet_with_vat = true;
  trading.status_mobile = bet.place === 1 ? 'Leading' : 'Losing';

  record.list.hasYourBlock = true;
  record.list.hasPriceBlock = true;

  return { ok: true, bet };
}
