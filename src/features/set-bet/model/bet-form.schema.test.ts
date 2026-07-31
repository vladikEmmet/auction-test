import { describe, expect, it } from 'vitest';

import { createBetFormSchema, parsePriceInput } from '@/features/set-bet/model/bet-form.schema';
import { getBetConstraints } from '@/shared/lib/bet-rules';

const constraints = getBetConstraints({
  aucType: 'Down',
  canSetBet: true,
  available: 29_500,
  current: 30_000,
  min: 20_000,
  max: 30_000,
  step: 500,
});

const schema = createBetFormSchema(constraints);
const parse = (price: string) => schema.safeParse({ price });
const messages = (price: string) => {
  const result = parse(price);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('parsePriceInput', () => {
  it('понимает запятую, пробелы и неразрывные пробелы', () => {
    expect(parsePriceInput('29 500')).toBe(29_500);
    expect(parsePriceInput('29 500,50')).toBe(29_500.5);
    expect(parsePriceInput('29500.50')).toBe(29_500.5);
  });

  it('пустая строка даёт NaN, а не ноль', () => {
    expect(parsePriceInput('')).toBeNaN();
    expect(parsePriceInput('   ')).toBeNaN();
  });
});

describe('createBetFormSchema', () => {
  it('требует заполнения поля', () => {
    expect(messages('')).toEqual(['Укажите цену ставки.']);
    expect(messages('   ')).toEqual(['Укажите цену ставки.']);
  });

  it('отвергает нечисловой ввод', () => {
    expect(messages('дорого')).toEqual(['Цена должна быть числом.']);
  });

  it('требует цену больше нуля', () => {
    expect(messages('0')).toEqual(['Цена должна быть больше 0.']);
    expect(messages('-500')).toEqual(['Цена должна быть больше 0.']);
  });

  it('пропускает корректную ставку и отдаёт число', () => {
    const result = parse('29 000');
    expect(result.success).toBe(true);
    expect(result.success && result.data.price).toBe(29_000);
  });

  it('применяет те же правила, что и сервер: направление и шаг', () => {
    expect(messages('30000')[0]).toMatch(/понижение/);
    expect(messages('29300')[0]).toMatch(/шаг/);
    expect(messages('19500')[0]).toMatch(/меньше/);
  });

  it('схема пересобирается под другой аукцион', () => {
    const upSchema = createBetFormSchema(
      getBetConstraints({
        aucType: 'Up',
        canSetBet: true,
        available: 30_500,
        current: 30_000,
        min: null,
        max: null,
        step: 500,
      }),
    );
    expect(upSchema.safeParse({ price: '31000' }).success).toBe(true);
    expect(upSchema.safeParse({ price: '30000' }).success).toBe(false);
  });
});
