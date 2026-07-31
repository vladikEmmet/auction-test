import type { AuctionShowResponseDto, BetItemDto } from '@/shared/api/contracts';

export type AuctionRecord = {
  uuid: string;
  detail: AuctionShowResponseDto;
  bets: BetItemDto[];

  list: {
    prioritySort: number;
    isAssembly: boolean;
    isHideOrganization: boolean;
    isAvailable: boolean;
    isAccredited: boolean;
    direction: string | null;
    comment: string | null;
    consignor: string | null;
    consignee: string | null;

    hasPriceBlock: boolean;
    hasYourBlock: boolean;
  };
};

let records: AuctionRecord[] = [];
let nextBetId = 1;

export function resetStore(seed: AuctionRecord[]): void {
  records = seed.map((record) => structuredClone(record));
  nextBetId =
    records.reduce(
      (max, record) => record.bets.reduce((inner, bet) => Math.max(inner, bet.id), max),
      0,
    ) + 1;
}

export function getRecords(): AuctionRecord[] {
  return records;
}

export function findRecord(uuid: string): AuctionRecord | undefined {
  return records.find((record) => record.uuid === uuid);
}

export function allocateBetId(): number {
  return nextBetId++;
}
