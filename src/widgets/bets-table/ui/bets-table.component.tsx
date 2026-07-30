import { useQuery } from '@tanstack/react-query';
import { EyeOffIcon, GavelIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';

import type { AuctionRestrictions } from '@/entities/auction';
import { betListQuery, type BetVm } from '@/entities/bet';
import { isApiError } from '@/shared/api/api-error';
import { formatDateTime, formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Alert, AlertDescription } from '@/shared/ui/alert.component';
import { Badge } from '@/shared/ui/badge.component';
import { Button } from '@/shared/ui/button.component';
import { Checkbox } from '@/shared/ui/checkbox.component';
import { Skeleton } from '@/shared/ui/skeleton.component';
import { StatePanel } from '@/shared/ui/state-panel.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table.component';

type BetsTableProps = {
  auctionUuid: string;
  restrictions: AuctionRestrictions;
};

export function BetsTable({ auctionUuid, restrictions }: BetsTableProps) {
  const [showCancelled, setShowCancelled] = useState(false);

  // История скрыта организатором — запрос не отправляем вовсе.
  const query = useQuery(
    betListQuery(auctionUuid, showCancelled, !restrictions.hideBetsHistory),
  );

  if (restrictions.hideBetsHistory) {
    return (
      <StatePanel
        icon={EyeOffIcon}
        title="История ставок скрыта"
        description={
          <>
            Организатор скрыл историю торгов (<code>hide_bets_history</code>). Доступна только
            текущая цена аукциона.
          </>
        }
      />
    );
  }

  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (query.isError) {
    const message = isApiError(query.error) ? query.error.message : 'Не удалось загрузить ставки.';
    return (
      <StatePanel
        icon={TriangleAlertIcon}
        title="Ошибка загрузки ставок"
        description={message}
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Повторить
          </Button>
        }
      />
    );
  }

  const summary = query.data;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="neutral">Участников: {summary.participantsCount}</Badge>
          <Badge variant="outline">Ставок: {summary.activeCount}</Badge>
          {summary.rejectedCount > 0 ? (
            <Badge variant="destructive">Отменённых: {summary.rejectedCount}</Badge>
          ) : null}
          {restrictions.hidePlaces ? (
            <Badge variant="warning">Рейтинг скрыт организатором</Badge>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={showCancelled}
            onCheckedChange={(checked) => setShowCancelled(checked === true)}
          />
          Показывать отменённые
        </label>
      </div>

      {summary.bets.length === 0 ? (
        <StatePanel
          icon={GavelIcon}
          title="Ставок пока нет"
          description="Вы можете стать первым участником торгов."
        />
      ) : (
        <>
          {/* Desktop: таблица; mobile: карточки — на узком экране таблица нечитаема. */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Место</TableHead>
                  <TableHead>Перевозчик</TableHead>
                  <TableHead className="text-right">Цена с НДС</TableHead>
                  <TableHead className="text-right">Цена без НДС</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.bets.map((bet) => (
                  <TableRow key={bet.id} className={cn(bet.isRejected && 'opacity-60')}>
                    <TableCell className="tabular">{bet.place ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {bet.carrierName}
                          {bet.isMine ? (
                            <Badge variant="default" className="ml-2">
                              моя
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">ИНН {bet.carrierInn}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular">
                      {formatMoney(bet.priceWithVat)}
                    </TableCell>
                    <TableCell className="text-right tabular text-muted-foreground">
                      {formatMoney(bet.priceNoVat)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular">
                      {formatDateTime(bet.createdAt)}
                    </TableCell>
                    <TableCell>
                      <BetStatus bet={bet} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-2 sm:hidden">
            {summary.bets.map((bet) => (
              <li
                key={bet.id}
                className={cn(
                  'rounded-lg border border-border p-3 text-sm',
                  bet.isRejected && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {bet.place ? `${bet.place}. ` : ''}
                      {bet.carrierName}
                    </p>
                    <p className="text-xs text-muted-foreground">ИНН {bet.carrierInn}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular">{formatMoney(bet.priceWithVat)}</p>
                    <p className="text-xs text-muted-foreground tabular">
                      без НДС {formatMoney(bet.priceNoVat)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BetStatus bet={bet} />
                  <span className="text-xs text-muted-foreground tabular">
                    {formatDateTime(bet.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {summary.bets.some((bet) => bet.isRejected && bet.cancelReason) ? (
        <Alert variant="warning">
          <AlertDescription>
            {summary.bets
              .filter((bet) => bet.isRejected && bet.cancelReason)
              .map((bet) => `${bet.carrierName}: ${bet.cancelReason}`)
              .join('; ')}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function BetStatus({ bet }: { bet: BetVm }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {bet.isWinner ? <Badge variant="success">Победитель</Badge> : null}
      {bet.isRejected ? <Badge variant="destructive">Отменена</Badge> : null}
      {bet.isCounter ? <Badge variant="outline">Встречная</Badge> : null}
      {!bet.isWinner && !bet.isRejected && !bet.isCounter ? (
        <Badge variant="neutral">Активна</Badge>
      ) : null}
    </span>
  );
}
