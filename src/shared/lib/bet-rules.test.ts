import { describe, expect, it } from 'vitest';

import {
  getBetConstraints,
  isBetterBet,
  suggestBetPrice,
  validateBetPrice,
  vatRatioFromPrices,
  type BetConstraintsInput,
} from '@/shared/lib/bet-rules';

const base: BetConstraintsInput = {
  aucType: 'Down',
  canSetBet: true,
  available: 29_500,
  current: 30_000,
  min: 20_000,
  max: 30_000,
  step: 500,
};

const codes = (price: number, input: Partial<BetConstraintsInput> = {}) =>
  validateBetPrice(price, getBetConstraints({ ...base, ...input })).map((error) => error.code);

describe('getBetConstraints', () => {
  it('берёт доступную цену как точку отсчёта, иначе текущую', () => {
    expect(getBetConstraints(base).reference).toBe(29_500);
    expect(getBetConstraints({ ...base, available: null }).reference).toBe(30_000);
    expect(getBetConstraints({ ...base, available: null, current: null }).reference).toBeNull();
  });

  it('игнорирует нулевой и отрицательный шаг', () => {
    expect(getBetConstraints({ ...base, step: 0 }).step).toBeNull();
    expect(getBetConstraints({ ...base, step: -100 }).step).toBeNull();
  });

  it('определяет направление торгов по типу аукциона', () => {
    expect(getBetConstraints({ ...base, aucType: 'Down' }).direction).toBe('down');
    expect(getBetConstraints({ ...base, aucType: 'Up' }).direction).toBe('up');
    expect(getBetConstraints({ ...base, aucType: 'FixPrice' }).direction).toBe('fixed');
    expect(getBetConstraints({ ...base, aucType: 'Request' }).direction).toBe('free');
    expect(getBetConstraints({ ...base, aucType: 'Unknown' }).direction).toBe('free');
  });
});

describe('validateBetPrice', () => {
  it('требует цену больше нуля', () => {
    expect(codes(0)).toEqual(['min_value']);
    expect(codes(-1)).toEqual(['min_value']);
    expect(codes(Number.NaN)).toEqual(['invalid']);
  });

  it('принимает корректную ставку на понижение', () => {
    expect(codes(29_500)).toEqual([]);
    expect(codes(29_000)).toEqual([]);
    expect(codes(20_000)).toEqual([]);
  });

  it('не даёт повысить цену в аукционе на понижение', () => {
    expect(codes(30_000)).toContain('direction');
  });

  it('не даёт понизить цену в аукционе на повышение', () => {
    const upInput = { aucType: 'Up' as const, available: 30_500, max: 50_000 };
    expect(codes(30_000, upInput)).toContain('direction');
    expect(codes(31_000, upInput)).toEqual([]);
  });

  it('требует точного совпадения при фиксированной цене', () => {
    const fixed = {
      aucType: 'FixPrice' as const,
      available: 30_000,
      min: null,
      max: null,
    };
    expect(codes(30_000, fixed)).toEqual([]);
    expect(codes(29_500, fixed)).toContain('direction');
  });

  it('проверяет кратность шага', () => {
    expect(codes(29_300)).toContain('step');
    expect(codes(28_500)).toEqual([]);
  });

  it('не проверяет шаг, если он не задан', () => {
    expect(codes(29_333.33, { step: null })).toEqual([]);
  });

  it('соблюдает границы min и max', () => {
    expect(codes(19_500)).toContain('min_value');
    expect(codes(31_000, { aucType: 'Request', max: 30_000 })).toContain('max_value');
  });

  it('в заявочном аукционе ограничивает только границами', () => {
    const free = { aucType: 'Request' as const, step: null };
    expect(codes(25_123.45, free)).toEqual([]);
    expect(codes(19_999, free)).toEqual(['min_value']);
  });

  it('не спотыкается о дробные значения из-за float', () => {
    const fractional = { available: 29_500.1, step: 0.1, min: null, max: null };
    expect(codes(29_500, fractional)).toEqual([]);
    expect(codes(29_499.9, fractional)).toEqual([]);
  });

  it('возвращает ошибки в формате ValidationError из схемы', () => {
    const errors = validateBetPrice(30_000, getBetConstraints(base));
    expect(errors[0]).toMatchObject({ field: 'price', code: 'direction' });
    expect(typeof errors[0]?.message).toBe('string');
  });
});

describe('suggestBetPrice', () => {
  it('предлагает шаг вниз для аукциона на понижение', () => {
    expect(suggestBetPrice(getBetConstraints(base))).toBe(29_000);
  });

  it('предлагает шаг вверх для аукциона на повышение', () => {
    expect(
      suggestBetPrice(
        getBetConstraints({
          ...base,
          aucType: 'Up',
          available: 30_500,
          max: 50_000,
        }),
      ),
    ).toBe(31_000);
  });

  it('для фиксированной цены предлагает ровно её', () => {
    expect(suggestBetPrice(getBetConstraints({ ...base, aucType: 'FixPrice' }))).toBe(29_500);
  });

  it('не выходит за границы min/max', () => {
    expect(suggestBetPrice(getBetConstraints({ ...base, available: 20_200, min: 20_000 }))).toBe(
      20_000,
    );
  });

  it('предложенная цена всегда проходит валидацию', () => {
    for (const aucType of ['Down', 'Up', 'FixPrice', 'Request'] as const) {
      const constraints = getBetConstraints({
        ...base,
        aucType,
        max: aucType === 'Up' ? 50_000 : base.max,
      });
      const suggestion = suggestBetPrice(constraints);
      expect(suggestion).not.toBeNull();
      expect(validateBetPrice(suggestion as number, constraints)).toEqual([]);
    }
  });
});

describe('vatRatioFromPrices', () => {
  it('выводит коэффициент из пары цен, а не берёт зашитые 20 %', () => {
    expect(vatRatioFromPrices(30_000, 25_000)).toBeCloseTo(1.2, 5);
    expect(vatRatioFromPrices(30_000, 24_590.16)).toBeCloseTo(1.22, 4);
  });

  it('без одной из цен коэффициент не выводится', () => {
    expect(vatRatioFromPrices(null, 25_000)).toBeNull();
    expect(vatRatioFromPrices(30_000, null)).toBeNull();
    expect(vatRatioFromPrices(undefined, undefined)).toBeNull();
  });

  it('отбрасывает бессмысленные значения', () => {
    expect(vatRatioFromPrices(30_000, 0)).toBeNull();
    expect(vatRatioFromPrices(0, 25_000)).toBeNull();

    expect(vatRatioFromPrices(20_000, 25_000)).toBeNull();
    expect(vatRatioFromPrices(60_000, 25_000)).toBeNull();
  });
});

describe('isBetterBet', () => {
  it('на понижение лучше меньшая цена, на повышение — большая', () => {
    expect(isBetterBet(29_000, 29_500, 'Down')).toBe(true);
    expect(isBetterBet(30_000, 29_500, 'Down')).toBe(false);
    expect(isBetterBet(31_000, 30_500, 'Up')).toBe(true);
    expect(isBetterBet(29_000, 29_500, 'Request')).toBe(true);
  });
});
