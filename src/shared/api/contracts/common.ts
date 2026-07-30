import { z } from 'zod';

/**
 * Правило кодирования nullable-полей:
 * поле объявляется nullable, если в схеме стоит `nullable: true` ИЛИ `example: null`.
 * Второй случай — авторская небрежность схемы (например, `AuctionListItemPayment.consignor`
 * без флага, но с null в примере); игнорировать его нельзя, иначе валидный ответ upstream
 * не пройдёт разбор. Соответствие проверяет `contracts.contract.test.ts`.
 *
 * `.nullish()` вместо `.nullable()` — потому что необязательное поле upstream может
 * не прислать вовсе; разница между «null» и «нет ключа» для UI неразличима.
 */
export const nullableNumber = z.number().nullish();
export const nullableString = z.string().nullish();
export const nullableBoolean = z.boolean().nullish();
export const nullableInt = z.number().int().nullish();
