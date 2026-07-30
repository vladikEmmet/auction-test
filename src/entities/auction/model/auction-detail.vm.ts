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
  organizer: {
    name: string;
    inn: string;
    kpp: string;
    subscriberCode: string;
    infobaseCode: string;
  };
  contacts: Array<{
    name: string | null;
    phone: string | null;
    workPhone: string | null;
    email: string | null;
  }>;
  route: {
    points: RoutePointVm[];
    fromCity: string;
    toCity: string;
    loadDate: string | null;
    unloadDate: string | null;
  };
  cargo: {
    name: string;
    bodyType: string;
    truckCount: number;
    distanceKm: number | null;
    /** null, когда организатор скрыл цену груза (no_view_cargo_price). */
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
    car: {
      type: string;
      weight: number | null;
      volume: number | null;
      width: number | null;
      length: number | null;
      height: number | null;
    } | null;
  };
  payment: {
    form: string;
    condition: string | null;
    delayLabel: string | null;
    prepay: string | null;
    currencyCode: string;
  };
  trading: {
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
  price: {
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
  your: {
    hasBet: boolean;
    lastBet: number | null;
    lastBetWithVat: number | null;
    win: boolean;
  };
  admittedOrganizations: Array<{ id: number; name: string; inn: string; isMain: boolean }>;
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

export function toAuctionDetailVm(dto: AuctionShowResponseDto): AuctionDetailVm {
  const { main, trading, cargo, payment, organizer, routes } = dto;

  // Флаг приходит в двух местах контракта; скрываем историю, если он взведён хотя бы в одном.
  const hideBetsHistory = trading.hide_bets_history || dto.hide_bets_history === true;
  const hideContacts = trading.hide_points_address_and_contacts;

  const points: RoutePointVm[] = [...routes]
    .sort((a, b) => a.row_num - b.row_num)
    .map((point) => ({
      rowNum: point.row_num,
      opTypeLabel: OPERATION_TYPE_LABELS[point.op_type],
      isLoading: point.op_type === 'Loading',
      city: point.location.city_name,
      cityFullName: point.location.city_full_name,
      address: hideContacts || !point.location.loading_address ? null : point.location.loading_address,
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

  const loadingPoints = points.filter((point) => point.isLoading);
  const unloadingPoints = points.filter((point) => !point.isLoading);

  const delayLabel =
    payment.delay == null
      ? null
      : `${payment.delay} ${PAYMENT_DELAY_LABELS[payment.delay_type ?? 'Unknown']}`;

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
    organizer: {
      name: organizer.organization_name,
      inn: organizer.organization_inn,
      kpp: organizer.organization_kpp,
      subscriberCode: organizer.subscriber_code,
      infobaseCode: organizer.infobase_code,
    },
    contacts: hideContacts
      ? []
      : dto.contacts.map((contact) => ({
          name: contact.name ?? null,
          phone: contact.phone ?? null,
          workPhone: contact.work_phone ?? null,
          email: contact.email ?? null,
        })),
    route: {
      points,
      fromCity: loadingPoints[0]?.city ?? points[0]?.city ?? '',
      toCity: unloadingPoints.at(-1)?.city ?? points.at(-1)?.city ?? '',
      loadDate: loadingPoints[0]?.startDate ?? null,
      unloadDate: unloadingPoints.at(-1)?.startDate ?? null,
    },
    cargo: {
      name: loadingPoints[0]?.cargoName ?? points[0]?.cargoName ?? '',
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
    },
    payment: {
      form: payment.form,
      condition: payment.condition ?? null,
      delayLabel,
      prepay: payment.prepay ?? null,
      currencyCode: payment.currency_code,
    },
    trading: {
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
    },
    price: {
      start: trading.price.start ?? null,
      startNoVat: trading.price.start_no_vat ?? null,
      current: trading.price.current ?? null,
      currentNoVat: trading.price.current_no_vat ?? null,
      available: trading.price.available ?? null,
      availableNoVat: trading.price.available_no_vat ?? null,
      min: trading.price.min ?? null,
      max: trading.price.max ?? null,
      step: trading.price.step ?? null,
      stepNoVat: trading.price.step_no_vat ?? null,
      perKm: trading.price.price_per_km,
    },
    your: {
      hasBet: trading.your.bet,
      lastBet: trading.your.last_bet ?? null,
      lastBetWithVat: trading.your.last_bet_with_vat ?? null,
      win: trading.your.win,
    },
    admittedOrganizations: dto.admitted_organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      inn: organization.inn,
      isMain: organization.is_main,
    })),
    assembly: { num: dto.assembly.num ?? null, date: dto.assembly.date ?? null },
  };
}
