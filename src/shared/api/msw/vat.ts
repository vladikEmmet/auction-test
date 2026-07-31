import { roundMoney } from '@/shared/lib/bet-rules';

export const VAT_RATE = 0.2;

export function withoutVat(value: number): number {
  return roundMoney(value / (1 + VAT_RATE));
}
