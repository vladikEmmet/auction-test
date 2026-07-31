import type { AuctionDetailVm } from '@/entities/auction';
import { pickPrice, useVatDisplayStore, VatToggle } from '@/features/vat-display';
import { formatMoney } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card.component';
import { FieldList } from '@/shared/ui/field-list.component';

export function AuctionPriceBlock({ auction }: { auction: AuctionDetailVm }) {
  const mode = useVatDisplayStore((state) => state.mode);
  const noVat = mode === 'no_vat';

  const current = pickPrice(mode, auction.price.current, auction.price.currentNoVat);
  const available = pickPrice(mode, auction.price.available, auction.price.availableNoVat);
  const step = noVat ? auction.price.stepNoVat : auction.price.step;
  const start = pickPrice(mode, auction.price.start, auction.price.startNoVat);
  const yourBet = noVat ? auction.your.lastBet : auction.your.lastBetWithVat;
  const currency = auction.payment.currency;
  const money = (value: number | null) => formatMoney(value, { currency });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle>Параметры торгов</CardTitle>
        <VatToggle id="detail-vat" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/60 p-3 sm:grid-cols-4">
          <Metric label={`Текущая цена${noVat ? ' без НДС' : ''}`} value={money(current)} accent />
          <Metric label="Доступная цена" value={money(available)} />
          <Metric label="Шаг ставки" value={money(step)} />
          <Metric
            label={`За км (${auction.trading.measurementLabel || 'за рейс'})`}
            value={formatMoney(auction.price.perKm, {
              currency,
              precise: true,
            })}
          />
        </div>

        <FieldList
          fields={[
            { label: 'Стартовая цена', value: money(start) },
            {
              label: 'Мин. / макс.',
              value: `${money(auction.price.min)} — ${money(auction.price.max)}`,
            },
            {
              label: 'Ваша ставка',
              value: auction.your.hasBet ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular">{money(yourBet)}</span>
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
