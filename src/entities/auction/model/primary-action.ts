import type { AuctionCardVm } from '@/entities/auction/model/auction-card.vm';

export type PrimaryAction =
  | { kind: 'set-bet'; label: 'Сделать ставку' }
  | { kind: 'edit-bet'; label: 'Изменить ставку' }
  | { kind: 'view-bets'; label: 'Смотреть ставки' }
  | { kind: 'disabled'; label: string; reason: string };

/**
 * Основное действие карточки. Порядок проверок важен: «изменить» приоритетнее «сделать»,
 * а «смотреть ставки» показывается только тем, кто уже участвовал в торгах.
 */
export function getPrimaryAction(auction: {
  canSetBet: AuctionCardVm['canSetBet'];
  isBidder: AuctionCardVm['isBidder'];
  yourBet: AuctionCardVm['yourBet'];
  status: AuctionCardVm['status'];
}): PrimaryAction {
  if (auction.canSetBet) {
    return auction.yourBet.hasBet
      ? { kind: 'edit-bet', label: 'Изменить ставку' }
      : { kind: 'set-bet', label: 'Сделать ставку' };
  }

  if (auction.isBidder || auction.yourBet.hasBet) {
    return { kind: 'view-bets', label: 'Смотреть ставки' };
  }

  const reason =
    auction.status === 'Planning'
      ? 'Торги ещё не начались'
      : auction.status === 'Auction'
        ? 'Ставки недоступны для вашей организации'
        : 'Торги завершены';

  return { kind: 'disabled', label: 'Ставка недоступна', reason };
}
