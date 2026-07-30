import type { AuctionDetailVm } from '@/entities/auction';
import { pickPrice, useVatDisplayStore, VatToggle } from '@/features/vat-display';
import { formatMoney } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card.component';
import { FieldList } from '@/shared/ui/field-list.component';

/** Блок цен и состояния собственной ставки. */
export function AuctionPriceBlock({ auction }: { auction: AuctionDetailVm }) {
  const mode = useVatDisplayStore((state) => state.mode);
  const noVat = mode === 'no_vat';

  const current = pickPrice(mode, auction.price.current, auction.price.currentNoVat);
  const available = pickPrice(mode, auction.price.available, auction.price.availableNoVat);
  const step = noVat ? auction.price.stepNoVat : auction.price.step;
  const start = pickPrice(mode, auction.price.start, auction.price.startNoVat);
  const yourBet = noVat ? auction.your.lastBet : auction.your.lastBetWithVat;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle>Параметры торгов</CardTitle>
        <VatToggle id="detail-vat" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/60 p-3 sm:grid-cols-4">
          <Metric label={`Текущая цена${noVat ? ' без НДС' : ''}`} value={formatMoney(current)} accent />
          <Metric label="Доступная цена" value={formatMoney(available)} />
          <Metric label="Шаг ставки" value={formatMoney(step)} />
          <Metric
            label={`За км (${auction.trading.measurementLabel || 'за рейс'})`}
            value={formatMoney(auction.price.perKm, true)}
          />
        </div>

        <FieldList
          fields={[
            { label: 'Стартовая цена', value: formatMoney(start) },
            { label: 'Мин. / макс.', value: `${formatMoney(auction.price.min)} — ${formatMoney(auction.price.max)}` },
            {
              label: 'Ваша ставка',
              value: auction.your.hasBet ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular">{formatMoney(yourBet)}</span>
                  <Badge variant={auction.your.win ? 'success' : 'neutral'}>
                    {auction.your.win ? 'Победа' : auction.tradingStatusLabel}
                  </Badge>
                </span>
              ) : (
                <span className="text-muted-foreground">Ставки нет</span>
              ),
            },
            {
              label: 'Встречные ставки',
              value: auction.trading.allowCounterBets ? 'Разрешены' : 'Запрещены',
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={accent ? 'text-lg font-semibold tabular' : 'font-medium tabular'}>{value}</p>
    </div>
  );
}
