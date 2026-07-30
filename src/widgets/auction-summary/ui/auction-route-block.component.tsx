import { ArrowDownIcon, LockIcon } from 'lucide-react';

import type { AuctionDetailVm } from '@/entities/auction';
import { formatDateRange, formatEmpty } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card.component';

/** Маршрут со всеми точками; адреса и контакты скрываются флагом из DTO. */
export function AuctionRouteBlock({ auction }: { auction: AuctionDetailVm }) {
  const { points } = auction.route;
  const hidden = auction.restrictions.hidePointsAddressAndContacts;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Маршрут</CardTitle>
        {hidden ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon className="size-3.5" aria-hidden />
            Адреса и контакты скрыты организатором
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {points.map((point, index) => (
            <li key={point.rowNum} className="relative pl-6">
              <span
                className={`absolute left-0 top-1.5 size-3 rounded-full ${
                  point.isLoading ? 'bg-primary' : 'bg-success'
                }`}
                aria-hidden
              />
              {index < points.length - 1 ? (
                <span className="absolute left-1.5 top-5 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden />
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={point.isLoading ? 'default' : 'success'}>{point.opTypeLabel}</Badge>
                <span className="font-medium">{point.cityFullName}</span>
              </div>

              <p className="text-sm text-muted-foreground tabular">
                {formatDateRange(point.startDate, point.endDate)}
              </p>

              <p className="text-sm">
                {point.address ? (
                  point.address
                ) : (
                  <span className="text-muted-foreground">
                    {hidden ? 'адрес скрыт' : 'адрес не указан'}
                  </span>
                )}
              </p>

              <p className="text-xs text-muted-foreground">
                {point.cargoName} · {point.weight} т · {point.volume} м³
                {point.packageName ? ` · ${point.packageName}` : ''}
                {point.oversized ? ' · негабарит' : ''}
              </p>

              {point.contact ? (
                <p className="text-xs text-muted-foreground">
                  Контакт: {formatEmpty(point.contact.name)} {formatEmpty(point.contact.phone)}
                </p>
              ) : null}

              {point.comment ? <p className="text-xs">Комментарий: {point.comment}</p> : null}

              {index < points.length - 1 ? (
                <ArrowDownIcon className="mt-2 size-3.5 text-border" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
