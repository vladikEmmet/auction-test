import { z } from 'zod';

import { nullableInt, nullableNumber, nullableString } from '@/shared/api/contracts/common';

export const betItemPriceInfoSchema = z.object({
  price_with_vat: nullableNumber,
  price_no_vat: nullableNumber,
  payment_type: nullableString,
  vat_rate: nullableString,
});

export const betItemSchema = z.object({
  id: z.number().int(),
  created_at: z.string(),
  auction_id: z.number().int(),
  subscriber_id: z.number().int(),
  contact_name: z.string(),
  contact_phone: z.string(),
  price_with_vat: z.number(),
  price_no_vat: z.number(),
  organization_id: z.number().int(),
  organization_inn: z.string(),
  organization_name: z.string(),
  transporter_comment: nullableString,
  is_rejected: z.boolean(),
  is_counter: z.boolean(),
  place: nullableInt,
  is_win: z.boolean(),
  run_number: z.number().int(),
  cancel_reason: z.string(),
  price_info: betItemPriceInfoSchema,
});

export const betListResponseSchema = z.object({
  bets: z.array(betItemSchema),
});

export const setBetRequestSchema = z.object({
  price: z.number(),
});

export type BetItemDto = z.infer<typeof betItemSchema>;
export type BetListResponseDto = z.infer<typeof betListResponseSchema>;
export type SetBetRequestDto = z.infer<typeof setBetRequestSchema>;
