import type { AuctionStatus, TradingStatus } from '@/shared/api/contracts';

import type { BadgeProps } from '@/shared/ui/badge.component';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export function statusBadgeVariant(status: AuctionStatus): BadgeVariant {
  switch (status) {
    case 'Auction':
      return 'success';
    case 'Planning':
    case 'DeterminateWinner':
    case 'WaitDeal':
      return 'warning';
    case 'Canceled':
    case 'Stopped':
      return 'destructive';
    case 'Finished':
    case 'InProgress':
      return 'neutral';
    default:
      return 'outline';
  }
}

export function tradingStatusBadgeVariant(status: TradingStatus | string): BadgeVariant {
  switch (status) {
    case 'Leading':
    case 'Winner':
    case 'Confirmed':
    case 'Accepted':
      return 'success';
    case 'Losing':
      return 'destructive';
    case 'OnPending':
    case 'ChoosingWinner':
      return 'warning';
    case 'NotParticipating':
      return 'neutral';
    default:
      return 'outline';
  }
}
