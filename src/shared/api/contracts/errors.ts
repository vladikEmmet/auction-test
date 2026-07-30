import { z } from 'zod';

import { nullableString } from '@/shared/api/contracts/common';

export const problemDetailSchema = z.object({
  code: z.string(),
  title: z.string(),
  message: z.string(),
  trace_id: nullableString,
});

export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: nullableString,
});

export const validationProblemSchema = z.object({
  code: z.string(),
  title: z.string(),
  message: z.string(),
  trace_id: nullableString,
  errors: z.array(validationErrorSchema),
});

export type ProblemDetailDto = z.infer<typeof problemDetailSchema>;
export type ValidationErrorDto = z.infer<typeof validationErrorSchema>;
export type ValidationProblemDto = z.infer<typeof validationProblemSchema>;
