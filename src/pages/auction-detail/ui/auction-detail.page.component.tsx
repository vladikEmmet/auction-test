import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { ArrowLeftIcon, TriangleAlertIcon } from 'lucide-react';

import {
  auctionDetailQuery,
  getPrimaryAction,
  statusBadgeVariant,
  tradingStatusBadgeVariant,
} from '@/entities/auction';
import { isApiError } from '@/shared/api/api-error';
import { formatDateTime } from '@/shared/lib/format';
import { useTimeLeft } from '@/shared/lib/use-time-left';
import { Badge } from '@/shared/ui/badge.component';
import { Button } from '@/shared/ui/button.component';
import { Card, CardContent, CardHeader } from '@/shared/ui/card.component';
import { Skeleton } from '@/shared/ui/skeleton.component';
import { StatePanel } from '@/shared/ui/state-panel.component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs.component';
import { TimeLeftBadge } from '@/shared/ui/time-left-badge.component';
import {
  AuctionCargoBlock,
  AuctionOrganizerBlock,
  AuctionPaymentBlock,
  AuctionPriceBlock,
  AuctionRestrictionsBlock,
  AuctionRouteBlock,
  AuctionTradingSettingsBlock,
} from '@/widgets/auction-summary';
import { BetsTable } from '@/widgets/bets-table';

export function AuctionDetailPage() {
  const { auctionUuid } = useParams({ from: '/auctions/$auctionUuid' });
  const { tab } = useSearch({ from: '/auctions/$auctionUuid' });
  const navigate = useNavigate({ from: '/auctions/$auctionUuid' });

  const query = useQuery(auctionDetailQuery(auctionUuid));
  // Хук вызывается до ранних return: правило хуков не допускает условного вызова.
  const timeLeft = useTimeLeft(
    query.data?.status === 'Auction' ? query.data.trading.stopTime : null,
  );

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    const notFound = isApiError(query.error) && query.error.isNotFound;
    return (
      <StatePanel
        icon={TriangleAlertIcon}
        title={notFound ? 'Аукцион не найден' : 'Не удалось загрузить аукцион'}
        description={isApiError(query.error) ? query.error.message : 'Неизвестная ошибка запроса.'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void query.refetch()}>
              Повторить
            </Button>
            <Button asChild>
              <Link to="/auctions">К списку аукционов</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const auction = query.data;
  const action = getPrimaryAction({
    canSetBet: auction.restrictions.canSetBet,
    // is_bidder остаётся true даже после отмены ставки — участнику доступна история торгов.
    isBidder: auction.isBidder,
    yourBet: { hasBet: auction.your.hasBet, lastBet: auction.your.lastBetWithVat },
    status: auction.status,
    isExpired: timeLeft.isExpired,
  });

  const showBets = () =>
    void navigate({ search: (previous) => ({ ...previous, tab: 'bets' as const }) });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/auctions">
          <ArrowLeftIcon /> К списку
        </Link>
      </Button>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">Заявка № {auction.cargoNum}</h1>
              <p className="text-sm text-muted-foreground tabular">
                {auction.route.fromCity} → {auction.route.toCity} · создан{' '}
                {formatDateTime(auction.createdAt)}
              </p>
            </div>

            {action.kind === 'set-bet' || action.kind === 'edit-bet' ? (
              <Button asChild>
                <Link to="/auctions/$auctionUuid/bet" params={{ auctionUuid }}>
                  {action.label}
                </Link>
              </Button>
            ) : action.kind === 'view-bets' ? (
              <Button variant="secondary" onClick={showBets}>
                {action.label}
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Button disabled>{action.label}</Button>
                {/* Причина выводится текстом: title у disabled-кнопки не читается скринридером. */}
                <span className="text-xs text-muted-foreground">{action.reason}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{auction.aucTypeLabel}</Badge>
            <Badge variant={statusBadgeVariant(auction.status)}>{auction.statusLabel}</Badge>
            <Badge variant={tradingStatusBadgeVariant(auction.tradingStatus)}>
              {auction.tradingStatusLabel}
            </Badge>
            {auction.your.hasBet ? <Badge variant="success">Моя ставка есть</Badge> : null}
            <TimeLeftBadge timeLeft={timeLeft} prefix="До конца торгов" />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground tabular">
            Торги: {formatDateTime(auction.trading.startTime)} —{' '}
            {formatDateTime(auction.trading.stopTime)}
          </p>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          void navigate({ search: (previous) => ({ ...previous, tab: value as 'info' | 'bets' }) })
        }
      >
        <TabsList>
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="bets">Ставки</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <AuctionPriceBlock auction={auction} />
          <div className="grid gap-4 lg:grid-cols-2">
            <AuctionRouteBlock auction={auction} />
            <div className="space-y-4">
              <AuctionCargoBlock auction={auction} />
              <AuctionOrganizerBlock auction={auction} />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <AuctionPaymentBlock auction={auction} />
            <AuctionTradingSettingsBlock auction={auction} />
          </div>
          <AuctionRestrictionsBlock auction={auction} />
        </TabsContent>

        <TabsContent value="bets">
          <BetsTable
            auctionUuid={auctionUuid}
            restrictions={auction.restrictions}
            currency={auction.payment.currency}
          />
        </TabsContent>
      </Tabs>

      {/* Роут ставки — дочерний: модалка открывается поверх этой страницы. */}
      <Outlet />
    </div>
  );
}
