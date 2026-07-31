import type {
  AuctionShowResponseDto,
  AuctionStatus,
  AuctionType,
  BidMeasurementType,
  TradingStatus,
} from '@/shared/api/contracts';
import {
  AUCTION_STATUS_LABELS,
  AUCTION_TYPE_LABELS,
  BID_MEASUREMENT_LABELS,
  OPERATION_TYPE_LABELS,
  PAYMENT_DELAY_LABELS,
  TRADING_STATUS_LABELS,
} from '@/shared/api/contracts';
import { currencyFromCode } from '@/shared/lib/format';

export type AuctionRestrictions = {
  canSetBet: boolean;
  hideBetsHistory: boolean;
  hidePointsAddressAndContacts: boolean;
  noViewCargoPrice: boolean;
  hidePlaces: boolean;
};

export type RoutePointVm = {
  rowNum: number;
  opTypeLabel: string;
  isLoading: boolean;
  city: string;
  cityFullName: string;
  address: string | null;
  startDate: string;
  endDate: string;
  cargoName: string;
  weight: string;
  volume: string;
  packageName: string | null;
  oversized: boolean;
  comment: string | null;
  contact: { name: string; phone: string } | null;
};

export type AuctionOrganizerVm = {
  name: string;
  inn: string;
  kpp: string;
  subscriberCode: string;
  infobaseCode: string;
};

export type AuctionContactVm = {
  name: string | null;
  phone: string | null;
  workPhone: string | null;
  email: string | null;
};

export type AuctionRouteVm = {
  points: RoutePointVm[];
  fromCity: string;
  toCity: string;
  loadDate: string | null;
  unloadDate: string | null;
};

export type AuctionCarVm = {
  type: string;
  weight: number | null;
  volume: number | null;
  width: number | null;
  length: number | null;
  height: number | null;
};

export type AuctionCargoVm = {
  name: string;
  bodyType: string;
  truckCount: number;
  distanceKm: number | null;

  price: string | null;
  isInternational: boolean;
  containered: boolean;
  containerType: string | null;
  containerSize: string | null;
  tempFrom: number | null;
  tempTo: number | null;
  belts: number | null;
  conics: number | null;
  adr: number | null;
  loadingTypes: string[];
  docs: string[];
  car: AuctionCarVm | null;
};

export type AuctionPaymentVm = {
  form: string;
  condition: string | null;
  delayLabel: string | null;
  prepay: string | null;
  currencyCode: string;

  currency: string;
};

export type AuctionTradingVm = {
  startTime: string;
  stopTime: string;
  measurementType: BidMeasurementType;
  measurementLabel: string;
  allowCounterBets: boolean;
  sendDealBeforeLoad: boolean;
  settings: {
    prolongAfterBet: number | null;
    winnerConfirm: number | null;
    transmissionTimeIn: number | null;
    coefficient: number | null;
  };
};

export type AuctionPriceVm = {
  start: number | null;
  startNoVat: number | null;
  current: number | null;
  currentNoVat: number | null;
  available: number | null;
  availableNoVat: number | null;
  min: number | null;
  max: number | null;
  step: number | null;
  stepNoVat: number | null;
  perKm: number;
};

export type AuctionYourBetVm = {
  hasBet: boolean;
  lastBet: number | null;
  lastBetWithVat: number | null;
  win: boolean;
};

export type AuctionDetailVm = {
  uuid: string;
  id: number;
  cargoNum: string;
  cargoDate: string;
  createdAt: string;
  aucType: AuctionType;
  aucTypeLabel: string;
  status: AuctionStatus;
  statusLabel: string;
  tradingStatus: TradingStatus;
  tradingStatusLabel: string;
  restrictions: AuctionRestrictions;

  isBidder: boolean;
  organizer: AuctionOrganizerVm;
  contacts: AuctionContactVm[];
  route: AuctionRouteVm;
  cargo: AuctionCargoVm;
  payment: AuctionPaymentVm;
  trading: AuctionTradingVm;
  price: AuctionPriceVm;
  your: AuctionYourBetVm;
  admittedOrganizations: Array<{
    id: number;
    name: string;
    inn: string;
    isMain: boolean;
  }>;
  assembly: { num: string | null; date: string | null };
};

const LOADING_TYPE_LABELS: Record<string, string> = {
  side: 'боковая',
  top: 'верхняя',
  rear: 'задняя',
  full: 'полная растентовка',
};

const DOC_LABELS: Record<string, string> = {
  tir: 'TIR',
  cmr: 'CMR',
  t1: 'T1',
  med: 'Медкнижка',
};

function collectFlags(source: Record<string, boolean>, labels: Record<string, string>): string[] {
  return Object.entries(source)
    .filter(([, enabled]) => enabled)
    .map(([key]) => labels[key] ?? key);
}

function toOrganizerVm(dto: AuctionShowResponseDto): AuctionOrganizerVm {
  const { organizer } = dto;
  return {
    name: organizer.organization_name,
    inn: organizer.organization_inn,
    kpp: organizer.organization_kpp,
    subscriberCode: organizer.subscriber_code,
    infobaseCode: organizer.infobase_code,
  };
}

function toRoutePointsVm(dto: AuctionShowResponseDto, hideContacts: boolean): RoutePointVm[] {
  return [...dto.routes]
    .sort((a, b) => a.row_num - b.row_num)
    .map((point) => ({
      rowNum: point.row_num,
      opTypeLabel: OPERATION_TYPE_LABELS[point.op_type],
      isLoading: point.op_type === 'Loading',
      city: point.location.city_name,
      cityFullName: point.location.city_full_name,
      address:
        hideContacts || !point.location.loading_address ? null : point.location.loading_address,
      startDate: point.start_date,
      endDate: point.end_date,
      cargoName: point.cargo.name,
      weight: point.cargo.weight,
      volume: point.cargo.volume,
      packageName: point.cargo.package_name || null,
      oversized: point.cargo.oversized,
      comment: point.comment ?? null,
      contact:
        hideContacts || (!point.contact.name && !point.contact.phone)
          ? null
          : { name: point.contact.name, phone: point.contact.phone },
    }));
}

function toRouteVm(points: RoutePointVm[]): AuctionRouteVm {
  const loading = points.filter((point) => point.isLoading);
  const unloading = points.filter((point) => !point.isLoading);

  return {
    points,
    fromCity: loading[0]?.city ?? points[0]?.city ?? '',
    toCity: unloading.at(-1)?.city ?? points.at(-1)?.city ?? '',
    loadDate: loading[0]?.startDate ?? null,
    unloadDate: unloading.at(-1)?.startDate ?? null,
  };
}

function toCargoVm(dto: AuctionShowResponseDto, cargoName: string): AuctionCargoVm {
  const { cargo, trading } = dto;

  return {
    name: cargoName,
    bodyType: cargo.body_type,
    truckCount: cargo.truck_count,
    distanceKm: cargo.distance ?? null,
    price: trading.no_view_cargo_price ? null : cargo.price,
    isInternational: cargo.is_international,
    containered: cargo.containered,
    containerType: cargo.container_type ?? null,
    containerSize: cargo.container_size ?? null,
    tempFrom: cargo.temp_from ?? null,
    tempTo: cargo.temp_to ?? null,
    belts: cargo.belts ?? null,
    conics: cargo.conics ?? null,
    adr: cargo.adr ?? null,
    loadingTypes: collectFlags(cargo.loading_types, LOADING_TYPE_LABELS),
    docs: collectFlags(cargo.docs, DOC_LABELS),
    car: cargo.car
      ? {
          type: cargo.car.type,
          weight: cargo.car.weight ?? null,
          volume: cargo.car.volume ?? null,
          width: cargo.car.width ?? null,
          length: cargo.car.length ?? null,
          height: cargo.car.height ?? null,
        }
      : null,
  };
}

function toPaymentVm(dto: AuctionShowResponseDto): AuctionPaymentVm {
  const { payment } = dto;

  return {
    form: payment.form,
    condition: payment.condition ?? null,
    delayLabel:
      payment.delay == null
        ? null
        : `${payment.delay} ${PAYMENT_DELAY_LABELS[payment.delay_type ?? 'Unknown']}`,
    prepay: payment.prepay ?? null,
    currencyCode: payment.currency_code,
    currency: currencyFromCode(payment.currency_code),
  };
}

function toTradingVm(dto: AuctionShowResponseDto): AuctionTradingVm {
  const { trading } = dto;

  return {
    startTime: trading.start_time,
    stopTime: trading.stop_time,
    measurementType: trading.bid_measurement_type,
    measurementLabel: BID_MEASUREMENT_LABELS[trading.bid_measurement_type],
    allowCounterBets: trading.allow_counter_bets,
    sendDealBeforeLoad: trading.send_deal_before_load,
    settings: {
      prolongAfterBet: trading.settings.prolong_after_bet ?? null,
      winnerConfirm: trading.settings.winner_confirm ?? null,
      transmissionTimeIn: trading.settings.transmission_time_in ?? null,
      coefficient: trading.settings.coefficient ?? null,
    },
  };
}

function toPriceVm(dto: AuctionShowResponseDto): AuctionPriceVm {
  const { price } = dto.trading;

  return {
    start: price.start ?? null,
    startNoVat: price.start_no_vat ?? null,
    current: price.current ?? null,
    currentNoVat: price.current_no_vat ?? null,
    available: price.available ?? null,
    availableNoVat: price.available_no_vat ?? null,
    min: price.min ?? null,
    max: price.max ?? null,
    step: price.step ?? null,
    stepNoVat: price.step_no_vat ?? null,
    perKm: price.price_per_km,
  };
}

function toYourBetVm(dto: AuctionShowResponseDto): AuctionYourBetVm {
  const { your } = dto.trading;

  return {
    hasBet: your.bet,
    lastBet: your.last_bet ?? null,
    lastBetWithVat: your.last_bet_with_vat ?? null,
    win: your.win,
  };
}

export function toAuctionDetailVm(dto: AuctionShowResponseDto): AuctionDetailVm {
  const { main, trading } = dto;

  const hideBetsHistory = trading.hide_bets_history || dto.hide_bets_history === true;
  const hideContacts = trading.hide_points_address_and_contacts;

  const points = toRoutePointsVm(dto, hideContacts);
  const route = toRouteVm(points);

  return {
    uuid: main.order_uid,
    id: main.id,
    cargoNum: main.cargo_num,
    cargoDate: main.cargo_date,
    createdAt: main.created_at,
    aucType: main.auc_type,
    aucTypeLabel: AUCTION_TYPE_LABELS[main.auc_type],
    status: trading.status,
    statusLabel: AUCTION_STATUS_LABELS[trading.status],
    tradingStatus: trading.status_mobile,
    tradingStatusLabel: TRADING_STATUS_LABELS[trading.status_mobile],
    restrictions: {
      canSetBet: trading.can_set_bet,
      hideBetsHistory,
      hidePointsAddressAndContacts: hideContacts,
      noViewCargoPrice: trading.no_view_cargo_price,
      hidePlaces: trading.hide_places,
    },
    isBidder: trading.is_bidder,
    organizer: toOrganizerVm(dto),
    contacts: hideContacts
      ? []
      : dto.contacts.map((contact) => ({
          name: contact.name ?? null,
          phone: contact.phone ?? null,
          workPhone: contact.work_phone ?? null,
          email: contact.email ?? null,
        })),
    route,
    cargo: toCargoVm(
      dto,
      points.find((point) => point.isLoading)?.cargoName ?? points[0]?.cargoName ?? '',
    ),
    payment: toPaymentVm(dto),
    trading: toTradingVm(dto),
    price: toPriceVm(dto),
    your: toYourBetVm(dto),
    admittedOrganizations: dto.admitted_organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      inn: organization.inn,
      isMain: organization.is_main,
    })),
    assembly: {
      num: dto.assembly.num ?? null,
      date: dto.assembly.date ?? null,
    },
  };
}
