import { z } from 'zod';

/**
 * Enum'ы описаны ровно так, как в openapi.auctions.v0.json.
 * Соответствие проверяется contract-тестом `contracts.contract.test.ts`.
 */

export const AUCTION_TYPES = ['Request', 'Up', 'Down', 'FixPrice', 'Unknown'] as const;
export const auctionTypeSchema = z.enum(AUCTION_TYPES).catch('Unknown');
export type AuctionType = (typeof AUCTION_TYPES)[number];

/** Фильтр `auc_type` в AuctionListRequest не принимает `Unknown` — набор уже, чем AuctionType. */
export const FILTER_AUCTION_TYPES = ['Request', 'Up', 'Down', 'FixPrice'] as const;
export type FilterAuctionType = (typeof FILTER_AUCTION_TYPES)[number];

export const AUCTION_STATUSES = [
  'Planning',
  'Auction',
  'DeterminateWinner',
  'WaitDeal',
  'InProgress',
  'Finished',
  'Stopped',
  'Canceled',
  'Unknown',
] as const;
export const auctionStatusSchema = z.enum(AUCTION_STATUSES).catch('Unknown');
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

/** Полный торговый статус — используется в детальной карточке и в фильтре `status`. */
export const TRADING_STATUSES = [
  'NotParticipating',
  'Leading',
  'Losing',
  'OnPending',
  'Confirmed',
  'ChoosingWinner',
  'Winner',
  'Accepted',
  'Unknown',
] as const;
export const tradingStatusSchema = z.enum(TRADING_STATUSES).catch('Unknown');
export type TradingStatus = (typeof TRADING_STATUSES)[number];

/**
 * В списке (`AuctionListItemTrading.status_mobile`) схема объявляет сокращённый набор —
 * без OnPending / ChoosingWinner / Accepted. Расхождение со схемой детальной карточки
 * оставлено намеренно: контракт воспроизводится как есть, а не «выравнивается».
 */
export const LIST_TRADING_STATUSES = [
  'NotParticipating',
  'Leading',
  'Losing',
  'Winner',
  'Confirmed',
  'Unknown',
] as const;
export const listTradingStatusSchema = z.enum(LIST_TRADING_STATUSES).catch('Unknown');
export type ListTradingStatus = (typeof LIST_TRADING_STATUSES)[number];

export const BID_MEASUREMENT_TYPES = ['PerRoute', 'PerKm', 'Unknown'] as const;
export const bidMeasurementTypeSchema = z.enum(BID_MEASUREMENT_TYPES).catch('Unknown');
export type BidMeasurementType = (typeof BID_MEASUREMENT_TYPES)[number];

export const OPERATION_TYPES = ['Loading', 'Unloading', 'Unknown'] as const;
export const operationTypeSchema = z.enum(OPERATION_TYPES).catch('Unknown');
export type OperationType = (typeof OPERATION_TYPES)[number];

export const PAYMENT_DELAY_TYPES = ['CalendarDays', 'WorkDays', 'Unknown'] as const;
export const paymentDelayTypeSchema = z.enum(PAYMENT_DELAY_TYPES).catch('Unknown');
export type PaymentDelayType = (typeof PAYMENT_DELAY_TYPES)[number];

/**
 * Числовые коды статусов из описаний схемы: фильтр `statuses` принимает числа,
 * а UI и URL оперируют читаемыми ключами.
 */
export const AUCTION_STATUS_CODES: Record<Exclude<AuctionStatus, 'Unknown'>, number> = {
  Planning: 1,
  Auction: 2,
  DeterminateWinner: 3,
  WaitDeal: 4,
  InProgress: 5,
  Finished: 6,
  Stopped: 7,
  Canceled: 8,
};

/** Числовые коды торгового статуса для фильтра `mobile_statuses`. */
export const TRADING_STATUS_CODES: Partial<Record<TradingStatus, number>> = {
  NotParticipating: 1,
  Leading: 2,
  Losing: 3,
  Winner: 4,
  Confirmed: 5,
};

export const AUCTION_TYPE_LABELS: Record<AuctionType, string> = {
  Request: 'Заявочный',
  Up: 'На повышение',
  Down: 'На понижение',
  FixPrice: 'Фикс. цена',
  Unknown: 'Неизвестный тип',
};

export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  Planning: 'Планирование',
  Auction: 'Торги идут',
  DeterminateWinner: 'Определение победителя',
  WaitDeal: 'Ожидание сделки',
  InProgress: 'В работе',
  Finished: 'Завершён',
  Stopped: 'Остановлен',
  Canceled: 'Отменён',
  Unknown: 'Неизвестный статус',
};

export const TRADING_STATUS_LABELS: Record<TradingStatus, string> = {
  NotParticipating: 'Не участвую',
  Leading: 'Лидирую',
  Losing: 'Перебит',
  OnPending: 'На рассмотрении',
  Confirmed: 'Подтверждён',
  ChoosingWinner: 'Выбор победителя',
  Winner: 'Победитель',
  Accepted: 'Принят',
  Unknown: 'Неизвестный статус',
};

export const BID_MEASUREMENT_LABELS: Record<BidMeasurementType, string> = {
  PerRoute: 'за рейс',
  PerKm: 'за км',
  Unknown: '',
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  Loading: 'Погрузка',
  Unloading: 'Выгрузка',
  Unknown: 'Операция',
};

export const PAYMENT_DELAY_LABELS: Record<PaymentDelayType, string> = {
  CalendarDays: 'календарных дней',
  WorkDays: 'рабочих дней',
  Unknown: 'дней',
};
