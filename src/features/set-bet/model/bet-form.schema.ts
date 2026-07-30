import { z } from 'zod';

import { validateBetPrice, type BetConstraints } from '@/shared/lib/bet-rules';

export type BetFormInput = { price: string };
export type BetFormOutput = { price: number };

/** Пользователь может ввести «29 500,50» — приводим к числу перед проверками. */
export function parsePriceInput(raw: string): number {
  const normalized = raw.replace(/[\s\u00a0]/g, '').replace(',', '.');
  return normalized === '' ? Number.NaN : Number(normalized);
}

/**
 * Схема формы строится под конкретный аукцион: те же правила, что применяет «сервер»,
 * поэтому 422 в норме не возникает — но обрабатывается (см. bet-form.component.tsx).
 */
export function createBetFormSchema(constraints: BetConstraints) {
  return z.object({
    price: z
      .string()
      .trim()
      .min(1, 'Укажите цену ставки.')
      .transform(parsePriceInput)
      .refine((value) => Number.isFinite(value), 'Цена должна быть числом.')
      // Проверки ниже пропускают NaN: иначе пользователь получит два противоречивых сообщения.
      .refine((value) => !Number.isFinite(value) || value > 0, 'Цена должна быть больше 0.')
      .superRefine((value, ctx) => {
        if (!Number.isFinite(value) || value <= 0) return;
        for (const error of validateBetPrice(value, constraints)) {
          ctx.addIssue({ code: 'custom', message: error.message });
        }
      }),
  });
}

export type BetFormSchema = ReturnType<typeof createBetFormSchema>;
