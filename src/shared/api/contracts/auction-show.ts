import { z } from 'zod';

import {
  nullableBoolean,
  nullableInt,
  nullableNumber,
  nullableString,
} from '@/shared/api/contracts/common';
import { docsSchema, loadingTypesSchema } from '@/shared/api/contracts/auction-list';
import {
  auctionStatusSchema,
  auctionTypeSchema,
  bidMeasurementTypeSchema,
  operationTypeSchema,
  paymentDelayTypeSchema,
  tradingStatusSchema,
} from '@/shared/api/contracts/enums';

export const auctionShowMainSchema = z.object({
  id: z.number().int(),
  cargo_num: z.string(),
  cargo_date: z.string(),
  order_uid: z.string(),
  auc_type: auctionTypeSchema,
  created_at: z.string(),
});

export const auctionShowOrganizerSchema = z.object({
  subscriber_id: z.number().int(),
  subscriber_code: z.string(),
  infobase_code: z.string(),
  organization_name: z.string(),
  organization_inn: z.string(),
  organization_kpp: z.string(),
  organization_id: z.number().int(),
});

export const contactSchema = z.object({
  name: nullableString,
  phone: nullableString,
  work_phone: nullableString,
  uid: nullableString,
  email: nullableString,
});

export const carRequirementsSchema = z.object({
  type: z.string(),
  weight: nullableNumber,
  volume: nullableNumber,
  width: nullableNumber,
  length: nullableNumber,
  height: nullableNumber,
});

export const auctionShowCargoSchema = z.object({
  price: z.string(),
  currency: nullableInt,
  is_international: z.boolean(),
  distance: nullableInt,
  truck_count: z.number().int(),
  body_type: z.string(),
  temp_from: nullableNumber,
  temp_to: nullableNumber,
  conics: nullableInt,
  belts: nullableInt,
  adr: nullableInt,
  coupling: nullableBoolean,
  air_pass: nullableBoolean,
  low_loader: nullableBoolean,
  additional_load: nullableBoolean,
  containered: z.boolean(),
  container_type: nullableString,
  container_size: nullableString,
  loading_types: loadingTypesSchema,
  docs: docsSchema,
  car: carRequirementsSchema.nullish(),
});

export const auctionShowPaymentSchema = z.object({
  condition: nullableString,
  condition_predefined: nullableString,
  form: z.string(),
  delay: nullableInt,
  delay_type: paymentDelayTypeSchema.nullish(),
  currency_code: z.string(),
  prepay: nullableString,
});

export const auctionShowTradingPriceSchema = z.object({
  start: nullableNumber,
  start_no_vat: nullableNumber,
  current: nullableNumber,
  current_no_vat: nullableNumber,
  available: nullableNumber,
  available_no_vat: nullableNumber,
  min: nullableNumber,
  min_no_vat: nullableNumber,
  max: nullableNumber,
  max_no_vat: nullableNumber,
  step: nullableNumber,
  step_no_vat: nullableNumber,
  price_per_km: z.number(),
});

export const auctionShowTradingYourSchema = z.object({
  bet: z.boolean(),
  last_bet: nullableNumber,
  last_bet_with_vat: nullableNumber,
  win: z.boolean(),
});

export const auctionShowTradingSettingsSchema = z.object({
  prolong_after_bet: nullableInt,
  winner_confirm: nullableInt,
  winner_counter_mode: nullableInt,
  transmission_time_in: nullableInt,
  coefficient: nullableInt,
});

export const auctionShowTradingSchema = z.object({
  status: auctionStatusSchema,
  status_mobile: tradingStatusSchema,
  start_time: z.string(),
  stop_time: z.string(),
  bid_measurement_type: bidMeasurementTypeSchema,
  can_set_bet: z.boolean(),
  allow_counter_bets: z.boolean(),
  hide_bets_history: z.boolean(),
  hide_places: z.boolean(),
  no_view_cargo_price: z.boolean(),
  hide_points_address_and_contacts: z.boolean(),
  is_bidder: z.boolean(),
  is_favorite: z.boolean(),
  is_last_bet_with_vat: nullableBoolean,
  red_bet_with_vat: z.boolean(),
  red_bet_no_vat: z.boolean(),
  send_deal_before_load: z.boolean(),
  chat_id: nullableString,
  price: auctionShowTradingPriceSchema,
  your: auctionShowTradingYourSchema,
  settings: auctionShowTradingSettingsSchema,
});

export const assemblySchema = z.object({
  num: nullableString,
  date: nullableString,
});

export const routePointLocationSchema = z.object({
  city_name: z.string(),
  city_full_name: z.string(),
  city_gc_id: z.number().int(),
  loading_address: z.string(),
  lon: z.number(),
  lat: z.number(),
});

export const routePointCargoSchema = z.object({
  name: z.string(),
  package_name: z.string(),
  weight: z.string(),
  volume: z.string(),
  length: z.string(),
  width: z.string(),
  height: z.string(),
  oversized: z.boolean(),
  package_amount: nullableInt,
});

export const routePointContactSchema = z.object({
  name: z.string(),
  phone: z.string(),
});

export const routePointSchema = z.object({
  row_num: z.number().int(),
  op_type: operationTypeSchema,
  start_date: z.string(),
  end_date: z.string(),
  comment: nullableString,
  contractor: z.string(),
  contractor_inn: z.string(),
  location: routePointLocationSchema,
  cargo: routePointCargoSchema,
  contact: routePointContactSchema,
});

export const admittedOrganizationSchema = z.object({
  id: z.number().int(),
  inn: z.string(),
  is_main: z.boolean(),
  name: z.string(),
  full_name: z.string(),
  site: nullableString,
  subscriber_id: z.number().int(),
  subscriber_code: z.string(),
  subscriber_role: nullableString,
  infobase_code: z.string(),
  infobase_address: nullableString,
  nalog_key: nullableString,
  hide_me: z.boolean(),
  current_vat_rate: nullableString,
});

export const auctionShowResponseSchema = z.object({
  main: auctionShowMainSchema,
  organizer: auctionShowOrganizerSchema,
  contacts: z.array(contactSchema),
  cargo: auctionShowCargoSchema,
  trading: auctionShowTradingSchema,
  payment: auctionShowPaymentSchema,
  assembly: assemblySchema,
  routes: z.array(routePointSchema),
  admitted_organizations: z.array(admittedOrganizationSchema),
  hide_bets_history: z.boolean().optional(),
});

export type AuctionShowResponseDto = z.infer<typeof auctionShowResponseSchema>;
export type AuctionShowTradingDto = z.infer<typeof auctionShowTradingSchema>;
export type AuctionShowTradingPriceDto = z.infer<typeof auctionShowTradingPriceSchema>;
export type RoutePointDto = z.infer<typeof routePointSchema>;
export type ContactDto = z.infer<typeof contactSchema>;
