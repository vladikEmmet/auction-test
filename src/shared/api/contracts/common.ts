import { z } from 'zod';

export const nullableNumber = z.number().nullish();
export const nullableString = z.string().nullish();
export const nullableBoolean = z.boolean().nullish();
export const nullableInt = z.number().int().nullish();
