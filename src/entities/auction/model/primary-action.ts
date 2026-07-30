import type { AuctionCardVm } from '@/entities/auction/model/auction-card.vm';

export type PrimaryAction =
  | { kind: 'set-bet'; label: 'Сделать ставку' }
  | { kind: 'edit-bet'; label: 'Изменить ставку' }
  | { kind: 'view-bets'; label: 'Смотреть ставки' }
  | { kind: 'disabled'; label: string; reason: string };

export type PrimaryActionInput = {
  canSetBet: AuctionCardVm['canSetBet'];
  isBidder: AuctionCardVm['isBidder'];
  yourBet: AuctionCardVm['yourBet'];
  status: AuctionCardVm['status'];
  /**
   * Время торгов истекло по часам клиента. Флаг приходит снаружи: серверный DTO
   * обновляет `can_set_bet` только при следующем запросе, а кнопка должна погаснуть сразу.
   */
  isExpired?: boolean;
};

/**
 * Основное действие карточки. Порядок проверок важен: истёкшее время бьёт ставку,
 * «изменить» приоритетнее «сделать», а «смотреть ставки» показывается только тем,
 * кто уже участвовал в торгах.
 */
export function getPrimaryAction(auction: PrimaryActionInput): PrimaryAction {
  const participated = auction.isBidder || auction.yourBet.hasBet;

  if (auction.canSetBet && auction.isExpired) {
    return participated
      ? { kind: 'view-bets', label: 'Смотреть ставки' }
      : { kind: 'disabled', label: 'Ставка недоступна', reason: 'Время торгов истекло' };
  }

  if (auction.canSetBet) {
    return auction.yourBet.hasBet
      ? { kind: 'edit-bet', label: 'Изменить ставку' }
      : { kind: 'set-bet', label: 'Сделать ставку' };
  }

  if (participated) {
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
