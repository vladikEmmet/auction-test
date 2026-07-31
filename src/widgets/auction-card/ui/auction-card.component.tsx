import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRightIcon, MapPinIcon, PackageIcon, TruckIcon } from 'lucide-react';

import {
  auctionDetailQuery,
  getPrimaryAction,
  statusBadgeVariant,
  tradingStatusBadgeVariant,
  type AuctionCardVm,
} from '@/entities/auction';
import { pickPrice, useVatDisplayStore } from '@/features/vat-display';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/format';
import { useTimeLeft } from '@/shared/lib/use-time-left';
import { Badge } from '@/shared/ui/badge.component';
import { Button } from '@/shared/ui/button.component';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card.component';
import { TimeLeftBadge } from '@/shared/ui/time-left-badge.component';

type AuctionCardProps = { auction: AuctionCardVm };

export function AuctionCard({ auction }: AuctionCardProps) {
  const queryClient = useQueryClient();
  const priceMode = useVatDisplayStore((state) => state.mode);
  const timeLeft = useTimeLeft(auction.status === 'Auction' ? auction.stopTime : null);
  const action = getPrimaryAction({
    ...auction,
    isExpired: timeLeft.isExpired,
  });

  const prefetchDetail = () => {
    void queryClient.prefetchQuery(auctionDetailQuery(auction.uuid));
  };

  const price = pickPrice(priceMode, auction.price.current, auction.price.currentNoVat);

  return (
    <Card
      className="flex h-full flex-col transition-shadow hover:shadow-md"
      onMouseEnter={prefetchDetail}
      onFocusCapture={prefetchDetail}
    >
      <CardHeader className="gap-2 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/auctions/$auctionUuid"
            params={{ auctionUuid: auction.uuid }}
            preload="intent"
            className="text-base font-semibold text-primary hover:underline"
          >
            Заявка № {auction.cargoNum}
          </Link>
          <Badge variant="outline">{auction.aucTypeLabel}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statusBadgeVariant(auction.status)}>{auction.statusLabel}</Badge>
          <Badge variant={tradingStatusBadgeVariant(auction.tradingStatus)}>
            {auction.tradingStatusLabel}
          </Badge>
          {auction.yourBet.hasBet ? (
            <Badge variant="success">
              Моя ставка:{' '}
              {formatMoney(auction.yourBet.lastBet, {
                currency: auction.currency,
              })}
            </Badge>
          ) : (
            <Badge variant="neutral">Ставки нет</Badge>
          )}
          <TimeLeftBadge timeLeft={timeLeft} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 font-medium">
              <span className="truncate">{auction.route.fromCity}</span>
              <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{auction.route.toCity}</span>
              {auction.route.loadPointsCount + auction.route.unloadPointsCount > 2 ? (
                <Badge variant="outline">
                  {auction.route.loadPointsCount + auction.route.unloadPointsCount} точек
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground tabular">
              Погрузка {formatDateTime(auction.route.loadDate)} · Выгрузка{' '}
              {formatDateTime(auction.route.unloadDate)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <PackageIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-medium">{auction.cargo.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(auction.cargo.weight, 'т')} · {formatNumber(auction.cargo.volume, 'м³')}{' '}
              · {auction.cargo.bodyType}
              {auction.cargo.truckCount > 1 ? ` · ${auction.cargo.truckCount} ТС` : ''}
            </p>
          </div>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-secondary/60 p-2.5">
          <div>
            <dt className="text-xs text-muted-foreground">
              Цена {priceMode === 'no_vat' ? 'без НДС' : 'с НДС'}
            </dt>
            <dd className="font-semibold tabular">
              {formatMoney(price, { currency: auction.currency })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">За км</dt>
            <dd className="tabular">
              {auction.price.perKm == null
                ? '—'
                : formatMoney(auction.price.perKm, {
                    currency: auction.currency,
                    precise: true,
                  })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Старт</dt>
            <dd className="tabular">
              {formatMoney(auction.price.start, { currency: auction.currency })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Шаг ставки</dt>
            <dd
              className="tabular text-muted-foreground"
              title="Шаг приходит только в детальном DTO — откройте карточку аукциона"
            >
              — <span className="text-xs">в деталях</span>
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {action.kind === 'set-bet' || action.kind === 'edit-bet' ? (
          <Button asChild className="flex-1">
            <Link
              to="/auctions/$auctionUuid/bet"
              params={{ auctionUuid: auction.uuid }}
              preload="intent"
            >
              {action.label}
            </Link>
          </Button>
        ) : action.kind === 'view-bets' ? (
          <Button asChild variant="secondary" className="flex-1">
            <Link
              to="/auctions/$auctionUuid"
              params={{ auctionUuid: auction.uuid }}
              search={{ tab: 'bets' }}
              preload="intent"
            >
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button disabled className="flex-1" title={action.reason}>
            {action.label}
          </Button>
        )}

        <Button asChild variant="ghost" size="sm">
          <Link to="/auctions/$auctionUuid" params={{ auctionUuid: auction.uuid }} preload="intent">
            <TruckIcon /> Подробнее
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
