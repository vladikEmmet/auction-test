import { roundMoney } from '@/shared/lib/bet-rules';

/**
 * Ставка НДС мока. В схеме она задаётся на уровне организации
 * (`AdmittedOrganization.current_vat_rate`), поэтому генератор данных использует одну
 * ставку, а UI выводит коэффициент из пары цен DTO — см. `vatRatioFromPrices`.
 */
export const VAT_RATE = 0.2;

export function withoutVat(value: number): number {
  return roundMoney(value / (1 + VAT_RATE));
}
