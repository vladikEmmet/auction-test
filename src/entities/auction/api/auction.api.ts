import {
  auctionListResponseSchema,
  auctionShowResponseSchema,
  type AuctionListRequestDto,
  type AuctionListResponseDto,
  type AuctionShowResponseDto,
} from '@/shared/api/contracts';
import { apiRequest } from '@/shared/api/http-client';

export function fetchAuctionList(
  body: AuctionListRequestDto,
  signal?: AbortSignal,
): Promise<AuctionListResponseDto> {
  return apiRequest('/auctions/list', auctionListResponseSchema, {
    method: 'POST',
    body,
    signal,
  });
}

export function fetchAuction(
  auctionUuid: string,
  signal?: AbortSignal,
): Promise<AuctionShowResponseDto> {
  return apiRequest(`/auctions/${auctionUuid}`, auctionShowResponseSchema, { signal });
}
