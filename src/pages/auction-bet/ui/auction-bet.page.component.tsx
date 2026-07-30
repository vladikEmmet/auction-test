import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';

import { auctionDetailQuery } from '@/entities/auction';
import { BetForm } from '@/features/set-bet';
import { isApiError } from '@/shared/api/api-error';
import { formatMoney } from '@/shared/lib/format';
import { Alert, AlertDescription } from '@/shared/ui/alert.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.component';
import { Skeleton } from '@/shared/ui/skeleton.component';

/**
 * Режим установки ставки — отдельный роут `/auctions/$auctionUuid/bet`, поэтому форма
 * открывается по прямой ссылке. Визуально это модалка над детальной страницей.
 */
export function AuctionBetPage() {
  const { auctionUuid } = useParams({ from: '/auctions/$auctionUuid/bet' });
  const navigate = useNavigate();
  const query = useQuery(auctionDetailQuery(auctionUuid));

  const close = () => {
    void navigate({ to: '/auctions/$auctionUuid', params: { auctionUuid } });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent aria-describedby="bet-dialog-description">
        <DialogHeader>
          <DialogTitle>
            {query.data?.your.hasBet ? 'Изменить ставку' : 'Сделать ставку'}
          </DialogTitle>
          <DialogDescription id="bet-dialog-description">
            {query.data
              ? `Заявка № ${query.data.cargoNum}: ${query.data.route.fromCity} → ${query.data.route.toCity}`
              : 'Загружаем параметры аукциона…'}
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <div className="space-y-3" aria-busy>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-40 self-end" />
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {isApiError(query.error) ? query.error.message : 'Не удалось загрузить аукцион.'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {query.data.your.hasBet ? (
              <Alert variant="info">
                <AlertDescription>
                  Ваша текущая ставка: {formatMoney(query.data.your.lastBetWithVat)} (
                  {query.data.tradingStatusLabel}).
                </AlertDescription>
              </Alert>
            ) : null}

            <BetForm auction={query.data} onSuccess={close} onCancel={close} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
