import type { AuctionType, BetItemDto } from '@/shared/api/contracts';
import { isBetterBet } from '@/shared/lib/bet-rules';
import type { AuctionRecord } from '@/shared/api/msw/db';

export function recalculatePlaces(record: AuctionRecord): void {
  const aucType: AuctionType = record.detail.main.auc_type;
  const active = record.bets.filter((bet) => !bet.is_rejected);

  const bestByOrganization = new Map<number, BetItemDto>();
  for (const bet of active) {
    const current = bestByOrganization.get(bet.organization_id);
    if (!current || isBetterBet(bet.price_with_vat, current.price_with_vat, aucType)) {
      bestByOrganization.set(bet.organization_id, bet);
    }
  }

  const ranked = [...bestByOrganization.values()].sort((a, b) =>
    isBetterBet(a.price_with_vat, b.price_with_vat, aucType) ? -1 : 1,
  );
  const placeByBetId = new Map(ranked.map((bet, index) => [bet.id, index + 1]));

  for (const bet of record.bets) {
    bet.place = bet.is_rejected ? null : (placeByBetId.get(bet.id) ?? null);
  }
}
