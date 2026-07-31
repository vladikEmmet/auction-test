import type {
  AuctionListItemDto,
  AuctionStatus,
  AuctionType,
  BidMeasurementType,
  ListTradingStatus,
} from '@/shared/api/contracts';
import {
  AUCTION_STATUS_LABELS,
  AUCTION_TYPE_LABELS,
  BID_MEASUREMENT_LABELS,
  TRADING_STATUS_LABELS,
} from '@/shared/api/contracts';
import { currencyFromCode } from '@/shared/lib/format';

export type AuctionCardVm = {
  uuid: string;
  id: number;
  cargoNum: string;
  aucType: AuctionType;
  aucTypeLabel: string;
  status: AuctionStatus;
  statusLabel: string;
  tradingStatus: ListTradingStatus;
  tradingStatusLabel: string;
  organizerName: string | null;

  currency: string;
  route: {
    fromCity: string;
    toCity: string;
    fromAddress: string | null;
    toAddress: string | null;
    loadDate: string;
    unloadDate: string;
    loadPointsCount: number;
    unloadPointsCount: number;
    addressHidden: boolean;
  };
  cargo: {
    name: string;
    weight: number;
    volume: number;
    bodyType: string;
    truckCount: number;
  };
  price: {
    current: number | null;
    currentNoVat: number | null;
    start: number | null;
    perKm: number | null;

    measurementLabel: string;
  };
  bidMeasurementType: BidMeasurementType | null;
  yourBet: {
    hasBet: boolean;
    lastBet: number | null;
  };
  canSetBet: boolean;
  isBidder: boolean;
  isAvailable: boolean;
  startTime: string;
  stopTime: string;
  comment: string | null;
};

export function toAuctionCardVm(dto: AuctionListItemDto): AuctionCardVm {
  const { main, trading, route, cargo, organizer, payment } = dto;
  const addressHidden = trading.hide_points_address_and_contacts;
  const measurement = trading.bid_measurement_type ?? null;

  return {
    uuid: main.order_uid,
    id: main.id,
    cargoNum: main.cargo_num,
    aucType: main.auc_type,
    aucTypeLabel: AUCTION_TYPE_LABELS[main.auc_type],
    status: trading.status,
    statusLabel: AUCTION_STATUS_LABELS[trading.status],
    tradingStatus: trading.status_mobile,
    tradingStatusLabel: TRADING_STATUS_LABELS[trading.status_mobile],
    organizerName: organizer.is_hide_organization ? null : organizer.organization_name,
    currency: currencyFromCode(payment.currency_code),
    route: {
      fromCity: route.load.city,
      toCity: route.unload.city,
      fromAddress: addressHidden || !route.load.address ? null : route.load.address,
      toAddress: addressHidden || !route.unload.address ? null : route.unload.address,
      loadDate: route.load.date,
      unloadDate: route.unload.date,
      loadPointsCount: route.load.points_count,
      unloadPointsCount: route.unload.points_count,
      addressHidden,
    },
    cargo: {
      name: cargo.name,
      weight: cargo.weight,
      volume: cargo.volume,
      bodyType: cargo.body_type,
      truckCount: cargo.truck_count,
    },
    price: {
      current: trading.price?.current ?? null,
      currentNoVat: trading.price?.current_no_vat ?? null,
      start: trading.price?.start ?? null,
      perKm: main.price_per_km ?? null,
      measurementLabel: measurement ? BID_MEASUREMENT_LABELS[measurement] : '',
    },
    bidMeasurementType: measurement,
    yourBet: {
      hasBet: trading.your?.bet ?? false,
      lastBet: trading.your?.last_bet ?? null,
    },
    canSetBet: trading.can_set_bet,
    isBidder: trading.is_bidder,
    isAvailable: trading.is_available,
    startTime: trading.start_time,
    stopTime: trading.stop_time,
    comment: trading.comment ?? null,
  };
}
