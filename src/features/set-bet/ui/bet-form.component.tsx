import { zodResolver } from '@hookform/resolvers/zod';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import type { AuctionDetailVm } from '@/entities/auction';
import { useSetBetMutation } from '@/features/set-bet/api/use-set-bet';
import {
  createBetFormSchema,
  parsePriceInput,
  type BetFormInput,
  type BetFormOutput,
} from '@/features/set-bet/model/bet-form.schema';
import { isApiError } from '@/shared/api/api-error';
import {
  getBetConstraints,
  roundMoney,
  suggestBetPrice,
  vatRatioFromPrices,
} from '@/shared/lib/bet-rules';
import { formatDateTime, formatMoney } from '@/shared/lib/format';
import { useTimeLeft } from '@/shared/lib/use-time-left';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert.component';
import { Button } from '@/shared/ui/button.component';
import { Input } from '@/shared/ui/input.component';
import { Label } from '@/shared/ui/label.component';

type BetFormProps = {
  auction: AuctionDetailVm;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function BetForm({ auction, onSuccess, onCancel }: BetFormProps) {
  // Правила дешёвые и чистые — считаем на каждый рендер, без useMemo и его зависимостей.
  const constraints = getBetConstraints({
    aucType: auction.aucType,
    canSetBet: auction.restrictions.canSetBet,
    available: auction.price.available,
    current: auction.price.current,
    min: auction.price.min,
    max: auction.price.max,
    step: auction.price.step,
  });
  const suggested = suggestBetPrice(constraints);
  const currency = auction.payment.currency;
  const mutation = useSetBetMutation(auction.uuid);
  const timeLeft = useTimeLeft(auction.status === 'Auction' ? auction.trading.stopTime : null);

  // Ставку НДС выводим из пары цен DTO, а не зашиваем 20 %.
  const vatRatio = vatRatioFromPrices(auction.price.current, auction.price.currentNoVat);

  const form = useForm<BetFormInput, unknown, BetFormOutput>({
    resolver: zodResolver(createBetFormSchema(constraints)),
    defaultValues: { price: suggested != null ? String(suggested) : '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  // useWatch вместо watch(): подписка через control безопасна для React Compiler.
  const rawPrice = useWatch({ control, name: 'price' });
  const parsedPrice = parsePriceInput(rawPrice ?? '');
  const hasValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const step = auction.price.step;

  /** Шаг вводится кнопками: набирать «29 500» руками на телефоне неудобно. */
  const shiftByStep = (direction: 1 | -1) => {
    if (step == null) return;

    const base = hasValidPrice ? parsedPrice : (constraints.reference ?? 0);
    const next = roundMoney(base + direction * step);
    if (next <= 0) return;

    setValue('price', String(next), { shouldValidate: true, shouldDirty: true });
  };

  const disabled = !auction.restrictions.canSetBet;

  const onSubmit = handleSubmit(async ({ price }) => {
    try {
      await mutation.mutateAsync(price);
      toast.success('Ставка принята', {
        description: (
          <>
            {formatMoney(price, { currency })} — аукцион №{auction.cargoNum}
            <br />
            {/* Ограничение демо повторяется здесь: в момент ставки оно и важно. */}
            <span className="text-muted-foreground">
              Демо-данные живут до перезагрузки страницы.
            </span>
          </>
        ),
      });
      onSuccess?.();
    } catch (error) {
      if (isApiError(error) && error.isValidation) {
        // 422: раскладываем ошибки по полям, неизвестные поля — в общий алерт формы.
        const fieldErrors = error.errors.filter((item) => item.field === 'price');
        const otherErrors = error.errors.filter((item) => item.field !== 'price');

        for (const item of fieldErrors) {
          setError('price', { type: 'server', message: item.message });
        }
        if (fieldErrors.length === 0 || otherErrors.length > 0) {
          setError('root.server', {
            type: 'server',
            message: otherErrors.map((item) => item.message).join(' ') || error.message,
          });
        }
        toast.error('Ставка не принята', { description: error.message });
        return;
      }

      const message = isApiError(error) ? error.message : 'Не удалось отправить ставку.';
      setError('root.server', { type: 'server', message });
      toast.error('Ошибка отправки ставки', { description: message });
    }
  });

  if (timeLeft.isExpired) {
    return (
      <Alert variant="warning">
        <div>
          <AlertTitle>Торги завершены</AlertTitle>
          <AlertDescription>
            Время торгов истекло {formatDateTime(auction.trading.stopTime)}. Обновите страницу,
            чтобы увидеть итоговый статус аукциона.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  if (disabled) {
    return (
      <Alert variant="warning">
        <div>
          <AlertTitle>Ставка недоступна</AlertTitle>
          <AlertDescription>
            Организатор запретил ставки в этом аукционе (<code>trading.can_set_bet = false</code>).
            Статус торгов: {auction.statusLabel}.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="bet-price">
          Ваша цена, ₽ {auction.trading.measurementLabel ? `(${auction.trading.measurementLabel})` : ''}
        </Label>
        <div className="flex items-center gap-2">
          {step != null ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Уменьшить на шаг ${formatMoney(step, { currency })}`}
              onClick={() => shiftByStep(-1)}
            >
              <MinusIcon />
            </Button>
          ) : null}

          <Input
            id="bet-price"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            className="text-center text-base font-medium tabular"
            aria-invalid={errors.price ? true : undefined}
            aria-describedby="bet-price-hint"
            {...register('price')}
          />

          {step != null ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Увеличить на шаг ${formatMoney(step, { currency })}`}
              onClick={() => shiftByStep(1)}
            >
              <PlusIcon />
            </Button>
          ) : null}
        </div>

        {vatRatio != null && hasValidPrice ? (
          <p className="text-xs text-muted-foreground tabular">
            ≈ {formatMoney(roundMoney(parsedPrice / vatRatio), { currency, precise: true })} без НДС
          </p>
        ) : null}

        <p id="bet-price-hint" className="text-xs text-muted-foreground">
          {buildHint(auction)}
        </p>
        {errors.price ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.price.message}
          </p>
        ) : null}
      </div>

      {errors.root?.server ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending ? 'Отправляем…' : 'Отправить ставку'}
        </Button>
      </div>
    </form>
  );
}

function buildHint(auction: AuctionDetailVm): string {
  const parts: string[] = [];
  const money = (value: number) => formatMoney(value, { currency: auction.payment.currency });

  if (auction.price.available != null) {
    parts.push(`Доступная цена: ${money(auction.price.available)}`);
  } else if (auction.price.current != null) {
    parts.push(`Текущая цена: ${money(auction.price.current)}`);
  }

  if (auction.price.step != null) parts.push(`шаг ${money(auction.price.step)}`);
  if (auction.price.min != null) parts.push(`мин. ${money(auction.price.min)}`);
  if (auction.price.max != null) parts.push(`макс. ${money(auction.price.max)}`);

  return parts.length > 0 ? `${parts.join(', ')}.` : 'Укажите цену больше 0.';
}
