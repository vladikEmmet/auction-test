import type {
  AuctionShowResponseDto,
  AuctionType,
  ValidationErrorDto,
} from '@/shared/api/contracts';

export type BetDirection = 'down' | 'up' | 'fixed' | 'free';

export type BetConstraints = {
  canSetBet: boolean;
  direction: BetDirection;

  reference: number | null;
  min: number | null;
  max: number | null;
  step: number | null;
};

const CENTS = 100;

function toCents(value: number): number {
  return Math.round(value * CENTS);
}

export function directionByAuctionType(aucType: AuctionType): BetDirection {
  switch (aucType) {
    case 'Down':
      return 'down';
    case 'Up':
      return 'up';
    case 'FixPrice':
      return 'fixed';
    default:
      return 'free';
  }
}

export type BetConstraintsInput = {
  aucType: AuctionType;
  canSetBet: boolean;
  available: number | null;
  current: number | null;
  min: number | null;
  max: number | null;
  step: number | null;
};

export function getBetConstraints(input: BetConstraintsInput): BetConstraints {
  return {
    canSetBet: input.canSetBet,
    direction: directionByAuctionType(input.aucType),
    reference: input.available ?? input.current ?? null,
    min: input.min ?? null,
    max: input.max ?? null,
    step: input.step != null && input.step > 0 ? input.step : null,
  };
}

export function getBetConstraintsFromDto(detail: AuctionShowResponseDto): BetConstraints {
  const price = detail.trading.price;
  return getBetConstraints({
    aucType: detail.main.auc_type,
    canSetBet: detail.trading.can_set_bet,
    available: price.available ?? null,
    current: price.current ?? null,
    min: price.min ?? null,
    max: price.max ?? null,
    step: price.step ?? null,
  });
}

export function validateBetPrice(price: number, constraints: BetConstraints): ValidationErrorDto[] {
  const errors: ValidationErrorDto[] = [];
  const add = (code: string, message: string) => errors.push({ field: 'price', message, code });

  if (!Number.isFinite(price)) {
    add('invalid', 'Укажите цену ставки.');
    return errors;
  }

  if (price <= 0) {
    add('min_value', 'Цена должна быть больше 0.');
    return errors;
  }

  const priceCents = toCents(price);

  if (constraints.min != null && priceCents < toCents(constraints.min)) {
    add('min_value', `Цена не может быть меньше ${formatPlain(constraints.min)} ₽.`);
  }

  if (constraints.max != null && priceCents > toCents(constraints.max)) {
    add('max_value', `Цена не может быть больше ${formatPlain(constraints.max)} ₽.`);
  }

  const { reference, step, direction } = constraints;

  if (reference != null) {
    const referenceCents = toCents(reference);

    if (direction === 'down' && priceCents > referenceCents) {
      add('direction', `Аукцион на понижение: ставка не выше ${formatPlain(reference)} ₽.`);
    }
    if (direction === 'up' && priceCents < referenceCents) {
      add('direction', `Аукцион на повышение: ставка не ниже ${formatPlain(reference)} ₽.`);
    }
    if (direction === 'fixed' && priceCents !== referenceCents) {
      add('direction', `Фиксированная цена: ставка должна быть равна ${formatPlain(reference)} ₽.`);
    }

    if (step != null && direction !== 'fixed') {
      const stepCents = toCents(step);
      const deltaCents = Math.abs(priceCents - referenceCents);
      if (stepCents > 0 && deltaCents % stepCents !== 0) {
        add(
          'step',
          `Цена должна отличаться от ${formatPlain(reference)} ₽ на шаг ${formatPlain(step)} ₽.`,
        );
      }
    }
  }

  return errors;
}

export function suggestBetPrice(constraints: BetConstraints): number | null {
  const { reference, step, direction, min, max } = constraints;
  if (reference == null) return min ?? null;

  if (direction === 'fixed') return reference;

  const delta = step ?? 0;
  const suggestion =
    direction === 'down' ? reference - delta : direction === 'up' ? reference + delta : reference;

  if (suggestion <= 0) return reference;
  if (min != null && suggestion < min) return min;
  if (max != null && suggestion > max) return max;
  return roundMoney(suggestion);
}

export function roundMoney(value: number): number {
  return Math.round(value * CENTS) / CENTS;
}

function formatPlain(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

export function vatRatioFromPrices(
  withVat: number | null | undefined,
  noVat: number | null | undefined,
): number | null {
  if (withVat == null || noVat == null) return null;
  if (!Number.isFinite(withVat) || !Number.isFinite(noVat)) return null;
  if (noVat <= 0 || withVat <= 0) return null;

  const ratio = withVat / noVat;

  return ratio >= 1 && ratio <= 2 ? ratio : null;
}

export function isBetterBet(candidate: number, current: number, aucType: AuctionType): boolean {
  return directionByAuctionType(aucType) === 'up' ? candidate > current : candidate < current;
}
