import type { AuctionShowResponseDto, BetItemDto } from '@/shared/api/contracts';

/**
 * Запись мок-базы. Источник правды — `detail`; элемент списка строится проекцией
 * (см. `projections.ts`), поэтому после мутации список, деталка и ставки не могут разойтись.
 */
export type AuctionRecord = {
  uuid: string;
  detail: AuctionShowResponseDto;
  bets: BetItemDto[];
  /** Поля, которые есть только в списочном DTO. */
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
    /** Список объявляет trading.price и trading.your nullable — воспроизводим и этот случай. */
    hasPriceBlock: boolean;
    hasYourBlock: boolean;
  };
};

let records: AuctionRecord[] = [];
let nextBetId = 1;

/** Наполняет базу копией сида: тесты и перезагрузка страницы начинают с чистого состояния. */
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
