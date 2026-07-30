import { z } from 'zod';

import { FILTER_AUCTION_TYPES, TRADING_STATUSES } from '@/shared/api/contracts/enums';

/** Дата-время в формате ISO 8601 со смещением — как требует `pattern` в схеме. */
const isoDateTimeWithOffset = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)$/);

const sortDirection = z.enum(['asc', 'desc']);

/**
 * Тело POST /auctions/list. Все поля необязательные (в схеме нет `required`),
 * поэтому builder отправляет только реально заданные фильтры.
 */
export const auctionListRequestSchema = z.object({
  page: z.number().int().optional(),
  per_page: z.number().int().optional(),
  is_oldest: z.boolean().optional(),
  sort: z.record(z.string(), sortDirection).nullish(),
  status: z.array(z.enum(TRADING_STATUSES)).optional(),
  mobile_statuses: z.array(z.number().int()).optional(),
  statuses: z.array(z.number().int()).optional(),
  cargo_num: z.string().optional(),
  weight_from: z.number().optional(),
  weight_to: z.number().optional(),
  volume_from: z.number().optional(),
  volume_to: z.number().optional(),
  body_types: z.array(z.string()).optional(),
  form_type: z.string().nullish(),
  is_international_shipment: z.boolean().optional(),
  load_city: z.string().optional(),
  load_gc_id: z.number().int().optional(),
  load_range: z.number().int().optional(),
  unload_city: z.string().optional(),
  unload_gc_id: z.number().int().optional(),
  unload_range: z.number().int().optional(),
  load_date_from: isoDateTimeWithOffset.optional(),
  load_date_to: isoDateTimeWithOffset.optional(),
  unload_date_from: isoDateTimeWithOffset.optional(),
  unload_date_to: isoDateTimeWithOffset.optional(),
  create_date_from: isoDateTimeWithOffset.optional(),
  create_date_to: isoDateTimeWithOffset.optional(),
  start_time_from: isoDateTimeWithOffset.optional(),
  start_time_to: isoDateTimeWithOffset.optional(),
  stop_time_from: isoDateTimeWithOffset.optional(),
  stop_time_to: isoDateTimeWithOffset.optional(),
  is_available: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  is_bidder: z.boolean().optional(),
  customer: z.string().optional(),
  customer_ids: z.array(z.number().int()).optional(),
  contractor: z.string().nullish(),
  auction_ids: z.array(z.number().int()).optional(),
  replace_external_pads: z.boolean().nullish(),
  current_price_from: z.number().nullish(),
  current_price_to: z.number().nullish(),
  price_per_km_from: z.number().nullish(),
  price_per_km_to: z.number().nullish(),
  auc_type: z.array(z.enum(FILTER_AUCTION_TYPES)).optional(),
});

export type AuctionListRequestDto = z.infer<typeof auctionListRequestSchema>;
