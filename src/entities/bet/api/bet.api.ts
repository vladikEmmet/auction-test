import { z } from 'zod';

import {
  betListResponseSchema,
  type BetListResponseDto,
  type SetBetRequestDto,
} from '@/shared/api/contracts';
import { apiRequest } from '@/shared/api/http-client';

export function fetchBets(
  auctionUuid: string,
  all: boolean,
  signal?: AbortSignal,
): Promise<BetListResponseDto> {
  return apiRequest(`/auctions/${auctionUuid}/bets`, betListResponseSchema, {
    query: { all: all ? 'true' : undefined },
    signal,
  });
}

/**
 * Схема не типизирует тело успешного ответа на POST /bets («проксируется от upstream»),
 * поэтому разбираем его как unknown: клиент опирается только на статус ответа.
 */
export function setBet(auctionUuid: string, body: SetBetRequestDto): Promise<unknown> {
  return apiRequest(`/auctions/${auctionUuid}/bets`, z.unknown(), {
    method: 'POST',
    body,
  });
}
