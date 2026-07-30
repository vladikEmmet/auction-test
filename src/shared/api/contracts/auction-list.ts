import { z } from 'zod';

import {
  nullableBoolean,
  nullableInt,
  nullableNumber,
  nullableString,
} from '@/shared/api/contracts/common';
import {
  auctionStatusSchema,
  auctionTypeSchema,
  bidMeasurementTypeSchema,
  listTradingStatusSchema,
} from '@/shared/api/contracts/enums';

export const auctionListItemMainSchema = z.object({
  id: z.number().int(),
  cargo_num: z.string(),
  cargo_date: z.string(),
  auc_type: auctionTypeSchema,
  order_uid: z.string(),
  created_at: z.string(),
  priority_sort: z.number().int(),
  is_assembly: z.boolean(),
  price_per_km: nullableNumber,
});

export const auctionListItemRoutePointSchema = z.object({
  city: z.string(),
  address: z.string(),
  date: z.string(),
  city_gc_id: z.number().int(),
  points_count: z.number().int(),
});

export const auctionListItemRouteSchema = z.object({
  load: auctionListItemRoutePointSchema,
  unload: auctionListItemRoutePointSchema,
});

export const loadingTypesSchema = z.object({
  side: z.boolean(),
  top: z.boolean(),
  rear: z.boolean(),
  full: z.boolean(),
});

export const docsSchema = z.object({
  tir: z.boolean(),
  cmr: z.boolean(),
  t1: z.boolean(),
  med: z.boolean(),
});

export const auctionListItemCargoCarSchema = z.object({
  type: z.string(),
  weight: nullableNumber,
  volume: nullableNumber,
  width: nullableNumber,
  length: nullableNumber,
  height: nullableNumber,
});

export const auctionListItemCargoSchema = z.object({
  name: z.string(),
  weight: z.number(),
  volume: z.number(),
  body_type: z.string(),
  truck_count: z.number().int(),
  is_cargo: z.boolean(),
  is_international: nullableBoolean,
  containered: nullableBoolean,
  incoterms: nullableString,
  conics: nullableInt,
  belts: nullableInt,
  adr: nullableInt,
  coupling: nullableBoolean,
  air_pass: nullableBoolean,
  low_loader: nullableBoolean,
  additional_load: nullableBoolean,
  temp_from: nullableInt,
  temp_to: nullableInt,
  loading_types: loadingTypesSchema,
  docs: docsSchema,
  car: auctionListItemCargoCarSchema.nullish(),
});

export const auctionListItemOrganizerSchema = z.object({
  subscriber_id: z.number().int(),
  organization_id: z.number().int(),
  organization_name: z.string(),
  organization_inn: z.string(),
  organization_kpp: z.string(),
  is_hide_organization: z.boolean(),
});

export const auctionListItemPaymentSchema = z.object({
  form: z.string(),
  currency_code: z.string(),
  consignor: nullableString,
  consignee: nullableString,
});

export const auctionListItemTradingPriceSchema = z.object({
  start: z.number(),
  current: z.number(),
  current_no_vat: z.number(),
});

export const auctionListItemTradingYourSchema = z.object({
  bet: z.boolean(),
  last_bet: nullableNumber,
});

export const auctionListItemTradingSchema = z.object({
  status: auctionStatusSchema,
  status_mobile: listTradingStatusSchema,
  start_time: z.string(),
  stop_time: z.string(),
  bid_measurement_type: bidMeasurementTypeSchema.nullish(),
  can_set_bet: z.boolean(),
  allow_counter_bets: z.boolean(),
  hide_points_address_and_contacts: z.boolean(),
  direction: nullableString,
  comment: nullableString,
  is_bidder: z.boolean(),
  is_available: z.boolean(),
  is_accredited: z.boolean(),
  is_favorite: z.boolean(),
  price: auctionListItemTradingPriceSchema.nullish(),
  your: auctionListItemTradingYourSchema.nullish(),
  red_bet_with_vat: z.boolean(),
  red_bet_no_vat: z.boolean(),
  is_last_bet_with_vat: nullableBoolean,
});

export const auctionListItemSchema = z.object({
  main: auctionListItemMainSchema,
  organizer: auctionListItemOrganizerSchema,
  route: auctionListItemRouteSchema,
  cargo: auctionListItemCargoSchema,
  trading: auctionListItemTradingSchema,
  payment: auctionListItemPaymentSchema,
});

export const auctionListMetaSchema = z.object({
  current_page: z.number().int(),
  from: z.number().int(),
  last_page: z.number().int(),
  per_page: z.number().int(),
  to: z.number().int(),
  total: z.number().int(),
});

export const auctionListResponseSchema = z.object({
  data: z.array(auctionListItemSchema),
  meta: auctionListMetaSchema,
});

export type AuctionListItemDto = z.infer<typeof auctionListItemSchema>;
export type AuctionListMetaDto = z.infer<typeof auctionListMetaSchema>;
export type AuctionListResponseDto = z.infer<typeof auctionListResponseSchema>;
